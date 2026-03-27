import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDiscoveryPipeline } from '@/lib/pipeline/discovery'
import type { BusinessProfile, ICPProfile } from '@/lib/ai/optimize-query'

export const maxDuration = 120

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  // Fetch business profile
  const { data: profile, error: profileError } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Kein Business-Profil gefunden' }, { status: 400 })
  }

  // Fetch ICP
  const { data: icpData, error: icpError } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (icpError || !icpData) {
    return NextResponse.json({ error: 'Kein ICP-Profil gefunden' }, { status: 400 })
  }

  // Create campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({ user_id: user.id, status: 'pending' })
    .select()
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign konnte nicht erstellt werden' }, { status: 500 })
  }

  const businessProfile: BusinessProfile = {
    company_name: profile.company_name ?? '',
    industry: profile.industry ?? '',
    description: profile.description ?? '',
    services: profile.services ?? [],
    target_market: profile.target_market ?? 'DACH',
    website_url: profile.website_url ?? '',
  }

  const icpProfile: ICPProfile = {
    target_industries: icpData.target_industries ?? [],
    target_company_sizes: icpData.target_company_sizes ?? [],
    target_countries: icpData.target_countries ?? [],
    target_seniorities: icpData.target_seniorities ?? [],
    target_titles: icpData.target_titles ?? [],
    additional_criteria: icpData.additional_criteria ?? undefined,
  }

  // Run pipeline async (non-blocking)
  runDiscoveryPipeline(supabase, user.id, campaign.id, businessProfile, icpProfile).catch((error) => {
    console.error('[Campaign] Pipeline failed:', error)
  })

  return NextResponse.json({
    campaign_id: campaign.id,
    status: 'started',
    message: 'Lead Discovery Pipeline gestartet',
  })
}
