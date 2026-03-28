'use server'

import { z } from 'zod/v4'
import { requireAuth } from '@/lib/supabase/server'
import { ok, fail, type ApiResponse } from '@/lib/api-response'
import { MAX_EXPORT_ROWS } from '@/lib/constants'
import { logAgentAction } from '@/lib/agent-log'

const exportSchema = z.object({
  grade: z.enum(['ALL', 'HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR']).optional(),
  q: z.string().max(200).optional(),
})

type ExportParams = z.infer<typeof exportSchema>

interface ExportResult {
  csv: string
  filename: string
  rowCount: number
}

/** CSV injection protection (SEC-016) — prefix dangerous leading characters with a single quote. */
function escapeCsvCell(value: string): string {
  let escaped = value
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = "'" + escaped
  }
  // Escape double quotes and wrap in quotes
  return '"' + escaped.replace(/"/g, '""') + '"'
}

export async function exportLeadsAction(params: ExportParams): Promise<ApiResponse<ExportResult>> {
  const { user, supabase } = await requireAuth()

  const parsed = exportSchema.safeParse(params)
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Ungültige Export-Parameter')

  const { grade, q } = parsed.data

  // Build query with targeted columns (no SELECT * — backend-data.md)
  let query = supabase
    .from('leads')
    .select(
      `
      company_name, industry, location, email, linkedin_url,
      first_name, last_name, job_title,
      lead_scores(total_score, grade)
    `,
    )
    .eq('user_id', user.id)
    .limit(MAX_EXPORT_ROWS)

  // Apply filters
  if (grade && grade !== 'ALL') {
    query = query.eq('lead_scores.grade', grade)
  }
  if (q) {
    query = query.ilike('company_name', `%${q}%`)
  }

  const { data: leads, error } = await query

  if (error) {
    console.error('[Export] Query failed:', error)
    return fail('INTERNAL_ERROR', 'Export fehlgeschlagen')
  }

  if (!leads || leads.length === 0) {
    return fail('NOT_FOUND', 'Keine Leads zum Exportieren gefunden')
  }

  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  const headers = [
    'Firma',
    'Branche',
    'Standort',
    'Score',
    'Status',
    'E-Mail',
    'LinkedIn',
    'Kontakt',
    'Position',
  ]
  const headerRow = headers.map((h) => escapeCsvCell(h)).join(',')

  const rows = leads.map((lead) => {
    const score = Array.isArray(lead.lead_scores) ? lead.lead_scores[0] : lead.lead_scores
    return [
      lead.company_name ?? '',
      lead.industry ?? '',
      lead.location ?? '',
      score?.total_score?.toString() ?? '',
      score?.grade ?? '',
      lead.email ?? '',
      lead.linkedin_url ?? '',
      [lead.first_name, lead.last_name].filter(Boolean).join(' '),
      lead.job_title ?? '',
    ]
      .map(escapeCsvCell)
      .join(',')
  })

  const csv = BOM + headerRow + '\n' + rows.join('\n')
  const date = new Date().toISOString().slice(0, 10)
  const filename = `leads_export_${date}.csv`

  // Log export event
  await logAgentAction(
    { supabase, userId: user.id },
    'lead_exported',
    `${leads.length} Leads als CSV exportiert`,
    { format: 'csv', rowCount: leads.length, filters: { grade, q } },
  )

  return ok({ csv, filename, rowCount: leads.length })
}
