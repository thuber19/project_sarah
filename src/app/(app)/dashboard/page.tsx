import Link from 'next/link'
import { Compass, Settings, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { LiveFeed } from '@/components/dashboard/live-feed'
import { ScoreDistribution } from '@/components/dashboard/score-distribution'
import { RecentLeads } from '@/components/dashboard/recent-leads'
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
        <DashboardEmptyState />
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

const hintCards = [
  {
    icon: Settings,
    title: 'Profil vervollständigen',
    description: 'Ergänze dein Firmenprofil und ICP, damit der Agent passende Leads findet.',
    href: '/settings',
    cta: 'Einstellungen öffnen',
  },
  {
    icon: Compass,
    title: 'Erste Discovery starten',
    description: 'Starte eine Lead-Suche basierend auf deinem Ideal Customer Profile.',
    href: '/discovery',
    cta: 'Discovery starten',
  },
  {
    icon: Sparkles,
    title: 'Scoring verstehen',
    description: 'Erfahre, wie der AI-Score deine Leads nach Relevanz bewertet.',
    href: '/scoring',
    cta: 'Scoring ansehen',
  },
] as const

function DashboardEmptyState() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 lg:gap-6 lg:px-8 lg:py-8">
      {/* Welcome */}
      <div className="rounded-xl border border-border bg-white p-5 text-center lg:p-8">
        <h2 className="text-lg font-bold text-foreground lg:text-xl">Willkommen bei Sarah</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Dein AI Sales Agent ist bereit. Starte deine erste Lead-Discovery, um das Dashboard mit
          Daten zu füllen.
        </p>
        <Link
          href="/discovery"
          className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Erste Discovery starten
        </Link>
      </div>

      {/* Zero stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads gesamt" value="0" changeType="neutral" />
        <StatCard label="Qualifizierte Leads" value="0" changeType="neutral" />
        <StatCard label="Hot Leads" value="0" changeType="neutral" />
        <StatCard label="Ø Score" value="—" change="Noch keine Scores" changeType="neutral" />
      </div>

      {/* Onboarding hint cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {hintCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent lg:p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
              <card.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-accent group-hover:underline">
              {card.cta} &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
