import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEnrichmentPipeline } from '@/lib/pipeline/enrich'
import type { ICP } from '@/lib/scoring/rule-engine'

export const maxDuration = 120

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const body = (await request.json()) as { campaignId?: string }
  if (!body.campaignId) {
    return NextResponse.json({ error: 'campaignId ist erforderlich' }, { status: 400 })
  }

  // Fetch ICP for scoring
  const { data: icpData } = await supabase
    .from('icp_profiles')
    .select('industries, company_sizes, regions, job_titles, seniority_levels')
    .eq('user_id', user.id)
    .single()

  const icp: ICP = {
    target_industries: icpData?.industries ?? [],
    target_company_sizes: icpData?.company_sizes ?? [],
    target_countries: icpData?.regions ?? [],
    target_seniorities: icpData?.seniority_levels ?? [],
    target_titles: icpData?.job_titles ?? [],
  }

  // Run enrichment async (non-blocking)
  runEnrichmentPipeline(supabase, user.id, body.campaignId, icp).catch((error) => {
    console.error('[Enrichment] Pipeline failed:', error)
  })

  return NextResponse.json({
    status: 'started',
    message: 'Enrichment Pipeline gestartet',
  })
}
