import { StatCard } from '@/components/dashboard/stat-card'
import { LiveFeed } from '@/components/dashboard/live-feed'
import { ScoreDistribution } from '@/components/dashboard/score-distribution'
import { RecentLeads } from '@/components/dashboard/recent-leads'
import { DashboardEmpty } from '@/components/dashboard/dashboard-empty'
import { AppTopbar } from '@/components/layout/app-topbar'
import { requireAuth } from '@/lib/supabase/server'

async function getDashboardData(userId: string) {
  const { supabase } = await requireAuth()

  const [leadsResult, scoresResult, feedResult, recentLeadsResult] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lead_scores').select('grade, total_score').eq('user_id', userId),
    supabase
      .from('agent_logs')
      .select('id, action_type, message, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('lead_scores')
      .select('lead_id, total_score, grade, leads(company_name, first_name, last_name)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  const totalLeads = leadsResult.count ?? 0
  const scores = scoresResult.data ?? []
  const feedItems = feedResult.data ?? []
  const recentLeads = (recentLeadsResult.data ?? []) as unknown as Array<{
    lead_id: string
    total_score: number
    grade: 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'
    leads: { company_name: string | null; first_name: string | null; last_name: string | null }
  }>

  const topMatches = scores.filter((s) => ['HOT', 'QUALIFIED', 'TOP_MATCH'].includes(s.grade)).length
  const goodFits = scores.filter((s) => ['ENGAGED', 'POTENTIAL', 'GOOD_FIT'].includes(s.grade)).length
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length)
      : 0

  const gradeCounts: Record<string, number> = {
    TOP_MATCH: 0,
    GOOD_FIT: 0,
    POOR_FIT: 0,
  }
  for (const s of scores) {
    if (['HOT', 'QUALIFIED', 'TOP_MATCH'].includes(s.grade)) gradeCounts.TOP_MATCH++
    else if (['ENGAGED', 'POTENTIAL', 'GOOD_FIT'].includes(s.grade)) gradeCounts.GOOD_FIT++
    else gradeCounts.POOR_FIT++
  }

  return {
    totalLeads,
    topMatches,
    goodFits,
    avgScore,
    gradeCounts,
    feedItems,
    totalScored: scores.length,
    recentLeads,
  }
}

export default async function DashboardPage() {
  const { user } = await requireAuth()
  const { totalLeads, topMatches, goodFits, avgScore, gradeCounts, totalScored, recentLeads } =
    await getDashboardData(user.id)

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Dashboard" initials={user.email?.slice(0, 2).toUpperCase() ?? 'SP'} />

      {/* Content */}
      {totalLeads === 0 ? (
        <DashboardEmpty />
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 lg:gap-6 lg:px-8 lg:py-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Leads gesamt" value={String(totalLeads)} changeType="neutral" />
            <StatCard
              label="Top Matches"
              value={String(topMatches)}
              changeType={topMatches > 0 ? 'positive' : 'neutral'}
            />
            <StatCard
              label="Good Fits"
              value={String(goodFits)}
              changeType={goodFits > 0 ? 'positive' : 'neutral'}
            />
            <StatCard
              label="Ø Score"
              value={totalScored > 0 ? String(avgScore) : '—'}
              change={totalScored > 0 ? `${totalScored} bewertet` : 'Noch keine Scores'}
              changeType="neutral"
            />
          </div>

          <div className="flex flex-col gap-6 lg:h-[400px] lg:flex-row">
            <LiveFeed />
            <ScoreDistribution counts={gradeCounts} total={totalScored} />
          </div>

          {recentLeads.length > 0 && <RecentLeads leads={recentLeads} />}
        </div>
      )}
    </div>
  )
}

