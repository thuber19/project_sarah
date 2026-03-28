import Link from 'next/link'
import { Building2, Code, Globe, Info, Play, Star, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/leads/score-badge'
import { ScoringRulesToggle } from './scoring-rules-toggle'
import { ScoringRescoreSection } from './scoring-rescore-section'
import { AppTopbar } from '@/components/layout/app-topbar'
import { requireAuth } from '@/lib/supabase/server'

type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'
type DisplayGrade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR_FIT'

interface DistributionItem {
  grade: Grade
  displayGrade: DisplayGrade
  range: string
  count: number
  percent: number
  barColor: string
}

interface ScoringRule {
  name: string
  description: string
  weight: string
  icon: 'building' | 'code' | 'trending' | 'globe'
}

const scoringRules: ScoringRule[] = [
  {
    name: 'Company Fit',
    description:
      'Unternehmensgr\u00f6\u00dfe, Branche und Standort passen zum Ideal Customer Profile',
    weight: '40%',
    icon: 'building',
  },
  {
    name: 'Technology Match',
    description: 'Technologie-Stack des Unternehmens passt zu unserer L\u00f6sung',
    weight: '25%',
    icon: 'code',
  },
  {
    name: 'Growth Signals',
    description: 'Wachstumsindikatoren wie Funding, Stellenausschreibungen und Expansion',
    weight: '25%',
    icon: 'trending',
  },
  {
    name: 'Market Relevance',
    description: 'Relevanz im DACH-Markt und regionale Marktpr\u00e4senz',
    weight: '10%',
    icon: 'globe',
  },
]

const iconMap = {
  building: Building2,
  code: Code,
  trending: TrendingUp,
  globe: Globe,
} as const

const gradeConfig: { grade: Grade; displayGrade: DisplayGrade; range: string; barColor: string }[] =
  [
    { grade: 'HOT', displayGrade: 'HOT', range: '90-100', barColor: 'bg-score-hot' },
    {
      grade: 'QUALIFIED',
      displayGrade: 'QUALIFIED',
      range: '75-89',
      barColor: 'bg-score-qualified',
    },
    { grade: 'ENGAGED', displayGrade: 'ENGAGED', range: '60-74', barColor: 'bg-score-engaged' },
    {
      grade: 'POTENTIAL',
      displayGrade: 'POTENTIAL',
      range: '40-59',
      barColor: 'bg-score-potential',
    },
    { grade: 'POOR', displayGrade: 'POOR_FIT', range: '0-39', barColor: 'bg-score-poor-fit' },
  ]

export default async function ScoringPage() {
  const { user, supabase } = await requireAuth()

  // Fetch all lead scores and lead IDs for this user
  const [{ data: scores }, { data: leads }] = await Promise.all([
    supabase.from('lead_scores').select('grade, total_score').eq('user_id', user.id),
    supabase.from('leads').select('id').eq('user_id', user.id),
  ])

  const leadIds = (leads ?? []).map((l) => l.id)

  // Calculate distribution from real data
  const gradeCounts: Record<Grade, number> = {
    HOT: 0,
    QUALIFIED: 0,
    ENGAGED: 0,
    POTENTIAL: 0,
    POOR: 0,
  }
  for (const s of scores ?? []) {
    const g = s.grade as Grade
    if (g in gradeCounts) gradeCounts[g]++
  }
  const total = scores?.length ?? 0
  const hasScores = total > 0
  const hasLeads = leadIds.length > 0

  const distributionData: DistributionItem[] = gradeConfig.map(
    ({ grade, displayGrade, range, barColor }) => ({
      grade,
      displayGrade,
      range,
      count: gradeCounts[grade],
      percent: total > 0 ? Math.round((gradeCounts[grade] / total) * 100) : 0,
      barColor,
    }),
  )

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Scoring-Übersicht" />

      {!hasLeads ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 lg:p-8">
          <EmptyState
            icon={Star}
            title="Noch keine Leads"
            description="Starte eine Discovery, um Leads zu finden und automatisch zu bewerten."
            primaryAction={{
              label: 'Discovery starten',
              href: '/discovery',
              icon: Play,
            }}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 lg:gap-8 lg:px-8 lg:py-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Scoring-Übersicht</h1>
            <p className="text-sm text-muted-foreground">
              Konfiguriere die Bewertungskriterien für deine Leads
            </p>
          </div>

          {!hasScores && (
            <div className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent-light p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {leadIds.length} Leads noch nicht bewertet
                </h2>
                <p className="text-sm text-muted-foreground">
                  Starte die Bewertung, um deine Leads automatisch zu scoren und zu priorisieren.
                </p>
              </div>
              <ScoringRescoreSection leadIds={leadIds} />
            </div>
          )}

          <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
            <h2 className="text-base font-semibold text-foreground">Score Distribution</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Verteilung der Lead-Scores über alle aktiven Leads
            </p>

            <div className="flex flex-col gap-0">
              {distributionData.map((item) => (
                <Link
                  key={item.grade}
                  href={`/leads?grade=${item.displayGrade}`}
                  className="flex min-h-12 items-center gap-2 rounded-lg py-2 transition-colors hover:bg-muted lg:gap-4"
                >
                  <div className="w-[80px] shrink-0 lg:w-[100px]">
                    <ScoreBadge grade={item.displayGrade} />
                  </div>

                  <span className="hidden w-12 text-xs text-muted-foreground lg:inline">
                    {item.range}
                  </span>

                  <div className="h-4 flex-1 rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${item.barColor}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>

                  <span className="w-14 text-right text-xs text-foreground lg:w-20 lg:text-sm">
                    {item.count} Leads
                  </span>

                  <span className="w-8 text-right text-xs text-muted-foreground lg:w-10 lg:text-sm">
                    {item.percent}%
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Klicke auf einen Lead für eine detaillierte KI-Analyse</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
            <h2 className="text-base font-semibold text-foreground">Scoring Rules</h2>
            <p className="text-sm text-muted-foreground">
              Gewichtete Bewertungskriterien für die Lead-Qualifizierung
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {scoringRules.map((rule) => {
                const Icon = iconMap[rule.icon]

                return (
                  <div
                    key={rule.name}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light">
                        <Icon className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pl-14 lg:shrink-0 lg:pl-0">
                      <span className="text-sm font-semibold text-foreground">{rule.weight}</span>
                      <ScoringRulesToggle />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <ScoringRescoreSection leadIds={leadIds} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
