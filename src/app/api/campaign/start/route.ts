import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDiscoveryPipeline } from '@/lib/pipeline/discovery'
import type { BusinessProfile, IcpProfile } from '@/types/database'

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
    .select(
      'id, user_id, website_url, company_name, description, industry, product_summary, value_proposition, target_market, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Kein Business-Profil gefunden' }, { status: 400 })
  }

  // Fetch ICP
  const { data: icpData, error: icpError } = await supabase
    .from('icp_profiles')
    .select(
      'id, user_id, business_profile_id, industries, company_sizes, regions, job_titles, seniority_levels, tech_stack, revenue_ranges, funding_stages, keywords, created_at, updated_at',
    )
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

  // Run pipeline async (non-blocking)
  runDiscoveryPipeline(
    supabase,
    user.id,
    campaign.id,
    profile as BusinessProfile,
    icpData as IcpProfile,
  ).catch((error) => {
    console.error('[Campaign] Pipeline failed:', error)
  })

  return NextResponse.json({
    campaign_id: campaign.id,
    status: 'started',
    message: 'Lead Discovery Pipeline gestartet',
  })
}
