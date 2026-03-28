'use server'

import { requireAuth } from '@/lib/supabase/server'
import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'

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
