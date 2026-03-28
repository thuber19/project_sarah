import { requireAuth } from "@/lib/supabase/server"
import {
  getIcpDefaultsAction,
  getDiscoveryLeadsAction,
  type DiscoveryLead,
} from "@/app/actions/discovery.actions"
import { DiscoveryClient } from "./discovery-client"

export default async function DiscoveryPage() {
  const { user, supabase } = await requireAuth()

  // Fetch ICP defaults for form prefill and latest campaign in parallel
  const [icpDefaults, latestCampaignResult] = await Promise.all([
    getIcpDefaultsAction(),
    supabase
      .from("search_campaigns")
      .select("id, leads_found")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const latestCampaign = latestCampaignResult.data

  // Fetch leads from the latest campaign if one exists
  let latestLeads: DiscoveryLead[] = []
  if (latestCampaign?.id) {
    latestLeads = await getDiscoveryLeadsAction(latestCampaign.id)
  }

  const hasDiscovery = !!latestCampaign
  const totalLeadsFound = latestCampaign?.leads_found ?? 0

  return (
    <DiscoveryClient
      icpDefaults={icpDefaults}
      latestLeads={latestLeads}
      totalLeadsFound={totalLeadsFound}
      hasDiscovery={hasDiscovery}
    />
  )
}
