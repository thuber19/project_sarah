import { requireAuth } from '@/lib/supabase/server'
import {
  getIcpDefaultsAction,
  getDiscoveryLeadsAction,
  type DiscoveryLead,
} from '@/app/actions/discovery.actions'
import { DiscoveryClient } from './discovery-client'

export default async function DiscoveryPage() {
  const { user, supabase } = await requireAuth()

  // Fetch ICP defaults for form prefill, ICP existence check, and latest campaign in parallel
  const [icpDefaultsResult, icpProfileResult, latestCampaignResult] = await Promise.all([
    getIcpDefaultsAction(),
    supabase.from('icp_profiles').select('id').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('search_campaigns')
      .select('id, leads_found')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // Unwrap ICP defaults from ApiResponse envelope
  const icpDefaults = icpDefaultsResult.success
    ? icpDefaultsResult.data
    : { industries: '', companySize: '', region: '', technologies: '', keywords: '' }

  const latestCampaign = latestCampaignResult.data

  // Fetch leads from the latest campaign if one exists
  let latestLeads: DiscoveryLead[] = []
  if (latestCampaign?.id) {
    const leadsResult = await getDiscoveryLeadsAction(latestCampaign.id)
    latestLeads = leadsResult.success ? leadsResult.data : []
  }

  const hasIcp = !!icpProfileResult.data
  const hasDiscovery = !!latestCampaign
  const totalLeadsFound = latestCampaign?.leads_found ?? 0

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
