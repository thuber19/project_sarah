import { Bell, Search } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LiveFeed } from '@/components/dashboard/live-feed'
import { ScoreDistribution } from '@/components/dashboard/score-distribution'
import { requireAuth } from '@/lib/supabase/server'

async function getDashboardData(userId: string) {
  const { supabase } = await requireAuth()

  const [leadsResult, scoresResult, feedResult] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lead_scores').select('grade, total_score').eq('user_id', userId),
    supabase
      .from('agent_logs')
      .select('id, action_type, message, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const totalLeads = leadsResult.count ?? 0
  const scores = scoresResult.data ?? []
  const feedItems = feedResult.data ?? []

  const hotLeads = scores.filter((s) => s.grade === 'HOT').length
  const qualifiedLeads = scores.filter((s) => ['HOT', 'QUALIFIED'].includes(s.grade)).length
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length)
      : 0

  const gradeCounts: Record<string, number> = {
    HOT: 0,
    QUALIFIED: 0,
    ENGAGED: 0,
    POTENTIAL: 0,
    POOR: 0,
  }
  for (const s of scores) {
    if (s.grade in gradeCounts) gradeCounts[s.grade]++
  }

  return { totalLeads, hotLeads, qualifiedLeads, avgScore, gradeCounts, feedItems, totalScored: scores.length }
}

export default async function DashboardPage() {
  const { user } = await requireAuth()
  const { totalLeads, hotLeads, qualifiedLeads, avgScore, gradeCounts, feedItems, totalScored } =
    await getDashboardData(user.id)

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Dashboard</span>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Suchen"
            />
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {user.email?.slice(0, 2).toUpperCase() ?? 'SP'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Leads gesamt" value={String(totalLeads)} changeType="neutral" changeBgColor="#DBEAFE" />
          <StatCard label="Qualifizierte Leads" value={String(qualifiedLeads)} changeType="positive" />
          <StatCard
            label="Hot Leads"
            value={String(hotLeads)}
            changeType={hotLeads > 0 ? 'positive' : 'neutral'}
            changeBgColor={hotLeads > 0 ? '#FEE2E2' : '#DBEAFE'}
          />
          <StatCard
            label="Ø Score"
            value={totalScored > 0 ? String(avgScore) : '—'}
            change={totalScored > 0 ? `${totalScored} bewertet` : 'Noch keine Scores'}
            changeType="neutral"
            changeBgColor="#DBEAFE"
          />
        </div>

        <div className="flex h-[400px] gap-6">
          <LiveFeed items={feedItems} />
          <ScoreDistribution counts={gradeCounts} total={totalScored} />
        </div>
      </div>
    </div>
  )
}
