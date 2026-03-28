import { AppTopbar } from '@/components/layout/app-topbar'
import { requireAuth } from '@/lib/supabase/server'
import { CompetitorClient } from './competitor-client'

export default async function CompetitorAnalysisPage() {
  await requireAuth()

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Competitor Analysis" />
      <CompetitorClient />
    </div>
  )
}
