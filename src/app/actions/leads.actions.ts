'use server'

import { requireAuth } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/api-response'
import { ok, fail } from '@/lib/api-response'
import { PAGE_SIZE } from '@/lib/constants'
import { z } from 'zod/v4'
import type { LeadListResult } from '@/types/lead'

const leadsQuerySchema = z.object({
  grade: z
    .enum(['ALL', 'HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR_FIT'])
    .optional()
    .default('ALL'),
  q: z.string().max(100).optional().default(''),
  sort: z.enum(['total_score', 'company_name', 'created_at']).optional().default('total_score'),
  dir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
})

export async function getLeadsAction(
  params: Record<string, string | undefined>,
): Promise<ApiResponse<LeadListResult>> {
  const { user, supabase } = await requireAuth()

  const parsed = leadsQuerySchema.safeParse(params)
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Ungültige Suchparameter')
  }

  const { grade, q, sort, dir, page } = parsed.data
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Use !inner join when grade filter is active to enforce INNER JOIN
  const selectClause =
    grade !== 'ALL'
      ? 'id, company_name, first_name, last_name, industry, location, updated_at, lead_scores!inner(total_score, grade)'
      : 'id, company_name, first_name, last_name, industry, location, updated_at, lead_scores(total_score, grade)'

  let query = supabase.from('leads').select(selectClause, { count: 'exact' }).eq('user_id', user.id)

  // Grade filter
  if (grade !== 'ALL') {
    const dbGrade = grade === 'POOR_FIT' ? 'POOR' : grade
    query = query.eq('lead_scores.grade', dbGrade)
  }

  // Text search
  if (q) {
    query = query.or(`company_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
  }

  // Sort
  if (sort === 'total_score') {
    query = query.order('total_score', {
      ascending: dir === 'asc',
      referencedTable: 'lead_scores',
    })
  } else {
    query = query.order(sort, { ascending: dir === 'asc' })
  }

  // Pagination
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('[Leads] Query failed:', error)
    return fail('INTERNAL_ERROR', 'Leads konnten nicht geladen werden')
  }

  // Flatten the nested lead_scores
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
