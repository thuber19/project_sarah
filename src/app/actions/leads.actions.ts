'use server'

import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

export type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'
const VALID_GRADES: Grade[] = ['HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR']

export interface LeadWithScore {
  id: string
  company_name: string | null
  full_name: string | null
  industry: string | null
  location: string | null
  created_at: string
  total_score: number | null
  grade: Grade | null
}

export interface GetLeadsResult {
  leads: LeadWithScore[]
  total: number
  page: number
  pageCount: number
}

export async function getLeadsAction(params: {
  page?: number
  grade?: string
  search?: string
  sort?: string
} = {}): Promise<GetLeadsResult | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const page = Math.max(1, params.page ?? 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Grade filter: fetch matching lead_ids from lead_scores first
  const gradeFilter = VALID_GRADES.includes(params.grade as Grade)
    ? (params.grade as Grade)
    : null

  let filteredIds: string[] | null = null
  if (gradeFilter) {
    const { data: scoreData } = await supabase
      .from('lead_scores')
      .select('lead_id')
      .eq('user_id', user.id)
      .eq('grade', gradeFilter)

    filteredIds = (scoreData ?? []).map((s) => s.lead_id)
    if (filteredIds.length === 0) {
      return { leads: [], total: 0, page: 1, pageCount: 1 }
    }
  }

  let query = supabase
    .from('leads')
    .select(
      'id, company_name, full_name, industry, location, created_at, lead_scores(total_score, grade)',
      { count: 'exact' },
    )
    .eq('user_id', user.id)

  if (filteredIds) {
    query = query.in('id', filteredIds)
  }

  if (params.search) {
    query = query.or(
      `company_name.ilike.%${params.search}%,full_name.ilike.%${params.search}%`,
    )
  }

  if (params.sort === 'name_asc') {
    query = query.order('company_name', { ascending: true, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('[Leads] getLeadsAction failed:', error)
    return { error: 'Leads konnten nicht geladen werden' }
  }

  const leads: LeadWithScore[] = (data ?? []).map((row) => {
    const scores = row.lead_scores as Array<{ total_score: number; grade: string }> | null
    const score = Array.isArray(scores) ? scores[0] : null
    return {
      id: row.id,
      company_name: row.company_name,
      full_name: row.full_name,
      industry: row.industry,
      location: row.location,
      created_at: row.created_at,
      total_score: score?.total_score ?? null,
      grade: (score?.grade ?? null) as Grade | null,
    }
  })

  const total = count ?? 0
  return {
    leads,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}
