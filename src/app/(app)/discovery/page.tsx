import { requireAuth } from '@/lib/supabase/server'
import { getIcpDefaultsAction, getDiscoveryLeadsAction } from '@/app/actions/discovery.actions'
import { DiscoveryClient } from './discovery-client'

export default async function DiscoveryPage() {
  const { user, supabase } = await requireAuth()

  // Load ICP defaults + latest campaign in parallel
  const [icpResult, latestCampaignResult] = await Promise.all([
    getIcpDefaultsAction(),
    supabase
      .from('search_campaigns')
      .select('id, leads_found')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const icpDefaults = icpResult.success
    ? icpResult.data
    : { industries: '', companySize: '', region: 'DACH (AT, DE, CH)', technologies: '', keywords: '' }

  const latestCampaign = latestCampaignResult.data
  const hasDiscovery = !!latestCampaign

  // Fetch leads from the latest campaign
  let latestLeads: Array<{ id: string; company_name: string | null; full_name: string | null; industry: string | null; location: string | null; source: string | null }> = []
  let totalLeadsFound = 0

  if (latestCampaign) {
    const leadsResult = await getDiscoveryLeadsAction(latestCampaign.id)
    if (leadsResult.success) {
      latestLeads = leadsResult.data
    }
    totalLeadsFound = latestCampaign.leads_found ?? 0
  }

  // Check if ICP is configured
  const { data: icpProfile } = await supabase
    .from('icp_profiles')
    .select('industries')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasIcp = !!icpProfile && (icpProfile.industries?.length ?? 0) > 0

  return (
    <DiscoveryClient
      icpDefaults={icpDefaults}
      latestLeads={latestLeads}
      totalLeadsFound={totalLeadsFound}
      hasDiscovery={hasDiscovery}
      hasIcp={hasIcp}
    />
  )
}
