import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runScoringPipeline } from '@/lib/scoring/pipeline'
import type { Lead } from '@/types/lead'
import type { ICP } from '@/lib/scoring/rule-engine'

const MAX_LEADS_PER_REQUEST = 100

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const body = await request.json()
  const leadIds: string[] | undefined = body.lead_ids

  // Fetch ICP for user
  const { data: icpData, error: icpError } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (icpError || !icpData) {
    return NextResponse.json({ error: 'Kein ICP-Profil gefunden' }, { status: 400 })
  }

  const icp: ICP = {
    target_industries: icpData.target_industries ?? [],
    target_company_sizes: icpData.target_company_sizes ?? [],
    target_countries: icpData.target_countries ?? [],
    target_seniorities: icpData.target_seniorities ?? [],
    target_titles: icpData.target_titles ?? [],
  }

  // Fetch leads to score
  let query = supabase.from('leads').select('*').eq('user_id', user.id).limit(MAX_LEADS_PER_REQUEST)

  if (leadIds && leadIds.length > 0) {
    query = query.in('id', leadIds.slice(0, MAX_LEADS_PER_REQUEST))
  }

  const { data: leads, error: leadsError } = await query

  if (leadsError || !leads || leads.length === 0) {
    return NextResponse.json({ error: 'Keine Leads gefunden' }, { status: 404 })
  }

  const result = await runScoringPipeline(supabase, leads as Lead[], icp, user.id)

  return NextResponse.json(result)
}
