import { AppTopbar } from '@/components/layout/app-topbar'
import { ExportContent } from './export-content'
import { requireAuth } from '@/lib/supabase/server'

type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'

export default async function ExportPage() {
  const { user, supabase } = await requireAuth()

  const [leadsResult, scoresResult, gradesResult] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('lead_scores')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase.from('lead_scores').select('grade').eq('user_id', user.id),
  ])

  const totalLeads = leadsResult.count ?? 0
  const scoredLeads = scoresResult.count ?? 0

  const gradeCounts: Record<Grade, number> = {
    HOT: 0,
    QUALIFIED: 0,
    ENGAGED: 0,
    POTENTIAL: 0,
    POOR: 0,
  }
  for (const row of gradesResult.data ?? []) {
    const g = row.grade as Grade
    if (g in gradeCounts) gradeCounts[g]++
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Export & CRM" />
      <ExportContent totalLeads={totalLeads} scoredLeads={scoredLeads} gradeCounts={gradeCounts} />
    </div>
  )
}
