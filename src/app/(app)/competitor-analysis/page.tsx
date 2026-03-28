import { AppTopbar } from '@/components/layout/app-topbar'
import { requireAuth } from '@/lib/supabase/server'
import { getCompetitorAnalysesAction } from '@/app/actions/competitor.actions'
import { CompetitorClient } from './competitor-client'

export default async function CompetitorAnalysisPage() {
  await requireAuth()

  const result = await getCompetitorAnalysesAction()
  const analyses = result.success ? result.data : []

  // Fetch leads without analysis yet for the "Analyze" button
  const { supabase, user } = await requireAuth()
  const { data: leadsWithWebsite } = await supabase
    .from('leads')
    .select('id, company_name, company_domain, company_website, industry')
    .eq('user_id', user.id)
    .not('company_domain', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Competitor Analysis" />
      <CompetitorClient
        analyses={analyses}
        availableLeads={leadsWithWebsite ?? []}
      />
    </div>
  )
}
