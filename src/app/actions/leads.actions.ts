'use server'

import { requireAuth } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/api-response'
import { ok, fail } from '@/lib/api-response'
import { PAGE_SIZE } from '@/lib/constants'
import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import type { LeadListResult } from '@/types/lead'

const leadsQuerySchema = z.object({
  grade: z
    .enum(['ALL', 'TOP_MATCH', 'GOOD_FIT', 'POOR_FIT', 'HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL'])
    .optional()
    .default('ALL'),
  q: z.string().max(100).optional().default(''),
  sort: z.enum(['total_score', 'company_name', 'created_at']).optional().default('total_score'),
  dir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  // Extended filter params from LeadFilterSheet
  scoreMin: z.coerce.number().int().min(0).max(100).optional(),
  scoreMax: z.coerce.number().int().min(0).max(100).optional(),
  industries: z.string().max(200).optional(),
  regions: z.string().max(50).optional(),
  companySizes: z.string().max(100).optional(),
})

export async function getLeadsAction(
  params: Record<string, string | undefined>,
): Promise<ApiResponse<LeadListResult>> {
  const { user, supabase } = await requireAuth()

  const parsed = leadsQuerySchema.safeParse(params)
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Ungültige Suchparameter')
  }

  const { grade, q, sort, dir, page, scoreMin, scoreMax, industries, regions } = parsed.data
  // Note: companySizes is accepted in the schema but not used for filtering
  // because the leads table uses a free-text company_size field, not an enum.
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Use !inner join when score/grade filters are active to enforce INNER JOIN
  const needsInnerJoin = grade !== 'ALL' || scoreMin !== undefined || scoreMax !== undefined
  const selectClause = needsInnerJoin
    ? 'id, company_name, first_name, last_name, industry, location, updated_at, lead_scores!inner(total_score, grade)'
    : 'id, company_name, first_name, last_name, industry, location, updated_at, lead_scores(total_score, grade)'

  let query = supabase.from('leads').select(selectClause, { count: 'exact' }).eq('user_id', user.id)

  // Grade filter — map new grades to DB values
  if (grade !== 'ALL') {
    if (grade === 'TOP_MATCH') {
      query = query.in('lead_scores.grade', ['HOT', 'QUALIFIED', 'TOP_MATCH'])
    } else if (grade === 'GOOD_FIT') {
      query = query.in('lead_scores.grade', ['ENGAGED', 'POTENTIAL', 'GOOD_FIT'])
    } else if (grade === 'POOR_FIT') {
      query = query.in('lead_scores.grade', ['POOR', 'POOR_FIT'])
    } else {
      query = query.eq('lead_scores.grade', grade)
    }
  }

  // Score range filter
  if (scoreMin !== undefined) {
    query = query.gte('lead_scores.total_score', scoreMin)
  }
  if (scoreMax !== undefined) {
    query = query.lte('lead_scores.total_score', scoreMax)
  }

  // Industry filter (comma-separated list)
  if (industries) {
    const industryList = industries.split(',').filter(Boolean)
    if (industryList.length > 0) {
      query = query.in('industry', industryList)
    }
  }

  // Region filter (comma-separated country codes)
  if (regions) {
    const regionList = regions.split(',').filter(Boolean)
    if (regionList.length > 0) {
      query = query.in('location', regionList)
    }
  }

  // Text search
  if (q) {
    query = query.or(`company_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
  }

  if (sort === 'total_score') {
    query = query.order('total_score', { ascending: dir === 'asc', referencedTable: 'lead_scores' })
  } else {
    query = query.order(sort, { ascending: dir === 'asc' })
  }

  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[Leads] Query failed:', error)
    return fail('INTERNAL_ERROR', 'Leads konnten nicht geladen werden')
  }

  const leads = (data ?? []).map((row: Record<string, unknown>) => {
    const scores = row.lead_scores as
      | Array<{ total_score: number | null; grade: string | null }>
      | { total_score: number | null; grade: string | null }
      | null
    const score = Array.isArray(scores) ? scores[0] : scores
    return {
      id: row.id as string,
      company_name: row.company_name as string | null,
      first_name: row.first_name as string | null,
      last_name: row.last_name as string | null,
      industry: row.industry as string | null,
      location: row.location as string | null,
      total_score: score?.total_score ?? null,
      grade: score?.grade ?? null,
      updated_at: row.updated_at as string,
    }
  })

  return ok({ leads, totalCount: count ?? 0 })
}

// ---------------------------------------------------------------------------
// Bulk Actions
// ---------------------------------------------------------------------------

const bulkIdsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
})

/**
 * Bulk-score selected leads by triggering a scoring run.
 */
export async function bulkScoreLeadsAction(data: { leadIds: string[] }) {
  const { user, supabase } = await requireAuth()

  const parsed = bulkIdsSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Lead-IDs' }

  const { leadIds } = parsed.data

  // Verify leads belong to user
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('id', leadIds)

  if ((count ?? 0) !== leadIds.length) {
    return { success: false as const, error: 'Einige Leads wurden nicht gefunden' }
  }

  // Create a scoring run
  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({
      user_id: user.id,
      status: 'running',
      total_leads: leadIds.length,
      scored_leads: 0,
      failed_leads: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (runError || !run) {
    return { success: false as const, error: 'Scoring-Run konnte nicht erstellt werden' }
  }

  // Trigger scoring via the streaming API (non-blocking)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${baseUrl}/api/scoring/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId: run.id, leadIds }),
  }).catch(() => {
    // Fire-and-forget — errors handled inside the stream endpoint
  })

  revalidatePath('/leads')

  return {
    success: true as const,
    data: { runId: run.id, totalLeads: leadIds.length },
  }
}

/**
 * Bulk-export selected leads as CSV download data.
 */
export async function bulkExportLeadsAction(data: { leadIds: string[] }) {
  const { user, supabase } = await requireAuth()

  const parsed = bulkIdsSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Lead-IDs' }

  const { leadIds } = parsed.data

  const { data: leads, error } = await supabase
    .from('leads')
    .select('first_name, last_name, email, phone, company_name, company_domain, industry, company_size, country, location, job_title')
    .eq('user_id', user.id)
    .in('id', leadIds)

  if (error || !leads) {
    return { success: false as const, error: 'Leads konnten nicht geladen werden' }
  }

  // Fetch scores for these leads
  const { data: scores } = await supabase
    .from('lead_scores')
    .select('lead_id, total_score, grade')
    .eq('user_id', user.id)
    .in('lead_id', leadIds)

  const scoreMap = new Map(
    (scores ?? []).map((s) => [s.lead_id, { score: s.total_score, grade: s.grade }])
  )

  // CSV-safe value: escape quotes and prefix formula characters
  function csvSafe(value: string | null | undefined): string {
    if (!value) return ''
    let safe = value
    // SEC-016: Prevent CSV injection
    if (/^[=+\-@\t\r]/.test(safe)) {
      safe = `'${safe}`
    }
    return `"${safe.replace(/"/g, '""')}"`
  }

  const header = 'Vorname,Nachname,E-Mail,Telefon,Unternehmen,Domain,Branche,Größe,Land,Standort,Jobtitel,Score,Grade'
  const rows = leads.map((lead) => {
    const s = scoreMap.get((lead as Record<string, unknown>).id as string)
    return [
      csvSafe(lead.first_name),
      csvSafe(lead.last_name),
      csvSafe(lead.email),
      csvSafe(lead.phone),
      csvSafe(lead.company_name),
      csvSafe(lead.company_domain),
      csvSafe(lead.industry),
      csvSafe(lead.company_size),
      csvSafe(lead.country),
      csvSafe(lead.location),
      csvSafe(lead.job_title),
      s?.score ?? '',
      s?.grade ?? '',
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')

  return {
    success: true as const,
    data: { csv, count: leads.length },
  }
}

/**
 * Bulk-delete selected leads.
 */
export async function bulkDeleteLeadsAction(data: { leadIds: string[] }) {
  const { user, supabase } = await requireAuth()

  const parsed = bulkIdsSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Lead-IDs' }

  const { leadIds } = parsed.data

  // Delete scores first (foreign key)
  await supabase
    .from('lead_scores')
    .delete()
    .eq('user_id', user.id)
    .in('lead_id', leadIds)

  // Delete research data
  await supabase
    .from('lead_research')
    .delete()
    .eq('user_id', user.id)
    .in('lead_id', leadIds)

  // Delete leads
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('user_id', user.id)
    .in('id', leadIds)

  if (error) {
    return { success: false as const, error: 'Leads konnten nicht gelöscht werden' }
  }

  revalidatePath('/leads')

  return {
    success: true as const,
    data: { deleted: leadIds.length },
  }
}
