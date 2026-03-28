import Link from 'next/link'
import { Building2, Info, Play, Star, Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/leads/score-badge'
import { ScoringRescoreSection } from './scoring-rescore-section'
import { PersonScoringSection } from '@/components/scoring/person-scoring-section'
import { AppTopbar } from '@/components/layout/app-topbar'
import { requireAuth } from '@/lib/supabase/server'
import { mapLegacyGrade } from '@/lib/scoring/grade'

type Grade = 'TOP_MATCH' | 'GOOD_FIT' | 'POOR_FIT'

interface DistributionItem {
  grade: Grade
  range: string
  count: number
  percent: number
  barColor: string
}

const companyGradeConfig: { grade: Grade; range: string; barColor: string }[] = [
  { grade: 'TOP_MATCH', range: '≥60', barColor: 'bg-score-hot' },
  { grade: 'GOOD_FIT', range: '30-59', barColor: 'bg-score-qualified' },
  { grade: 'POOR_FIT', range: '<30', barColor: 'bg-score-poor-fit' },
]

const personTierConfig = [
  { key: 'entscheider', label: 'Entscheider', color: 'text-score-hot', barColor: 'bg-score-hot' },
  { key: 'budget_holder', label: 'Budget-Holder', color: 'text-score-qualified', barColor: 'bg-score-qualified' },
  { key: 'champion', label: 'Champion', color: 'text-accent', barColor: 'bg-accent' },
  { key: 'influencer', label: 'Influencer', color: 'text-muted-foreground', barColor: 'bg-muted-foreground' },
  { key: 'none', label: 'Ohne Tag', color: 'text-muted-foreground', barColor: 'bg-border' },
]

export default async function ScoringPage() {
  const { user, supabase } = await requireAuth()

  const [{ data: scores }, { data: leads }] = await Promise.all([
    supabase
      .from('lead_scores')
      .select('grade, total_score, company_score, person_score, company_qualified, persona_tag')
      .eq('user_id', user.id),
    supabase.from('leads').select('id').eq('user_id', user.id),
  ])

  const leadIds = (leads ?? []).map((l) => l.id)
  const allScores = scores ?? []
  const total = allScores.length
  const hasScores = total > 0
  const hasLeads = leadIds.length > 0

  // --- Company Score Distribution ---
  const companyCounts: Record<Grade, number> = { TOP_MATCH: 0, GOOD_FIT: 0, POOR_FIT: 0 }
  for (const s of allScores) {
    const mapped = mapLegacyGrade(s.grade)
    companyCounts[mapped]++
  }

  const companyDistribution: DistributionItem[] = companyGradeConfig.map(({ grade, range, barColor }) => ({
    grade,
    range,
    count: companyCounts[grade],
    percent: total > 0 ? Math.round((companyCounts[grade] / total) * 100) : 0,
    barColor,
  }))

  const qualifiedCount = companyCounts.TOP_MATCH + companyCounts.GOOD_FIT

  // --- Person Score Distribution ---
  const personScored = allScores.filter((s) => s.person_score !== null)
  const personTagCounts: Record<string, number> = {
    entscheider: 0, budget_holder: 0, champion: 0, influencer: 0, none: 0,
  }
  let personAvg = 0
  for (const s of personScored) {
    personAvg += s.person_score ?? 0
    const tag = s.persona_tag ?? 'none'
    if (tag in personTagCounts) personTagCounts[tag]++
    else personTagCounts.none++
  }
  if (personScored.length > 0) personAvg = Math.round(personAvg / personScored.length)

  // --- Company Score Stats ---
  const companyScored = allScores.filter((s) => s.company_score !== null)
  let companyAvg = 0
  for (const s of companyScored) companyAvg += s.company_score ?? 0
  if (companyScored.length > 0) companyAvg = Math.round(companyAvg / companyScored.length)

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Scoring" />

      {!hasLeads ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 lg:p-8">
          <EmptyState
            icon={Star}
            title="Noch keine Leads"
            description="Starte eine Discovery, um Leads zu finden und automatisch zu bewerten."
            primaryAction={{ label: 'Discovery starten', href: '/discovery', icon: Play }}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 lg:gap-8 lg:px-8 lg:py-8">
          {/* ================================================================ */}
          {/* PHASE 1: COMPANY SCORING                                        */}
          {/* ================================================================ */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-5 w-5 text-accent" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Phase 1 — Company Score</h2>
                <p className="text-sm text-muted-foreground">
                  Bewertet Firmen anhand von Branche, Größe, Region und Buying Signals.
                </p>
              </div>
            </div>

            {/* Rescore banner */}
            {!hasScores && (
              <div className="mb-4 flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent-light p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {leadIds.length} Leads noch nicht bewertet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Starte die Company-Bewertung, um Firmen zu klassifizieren.
                  </p>
                </div>
                <ScoringRescoreSection leadIds={leadIds} />
              </div>
            )}

            {/* Company Score Distribution */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Company Score Verteilung</h3>
                  <p className="text-sm text-muted-foreground">
                    {total} Leads bewertet{companyAvg > 0 && ` · Ø ${companyAvg}/100`}
                  </p>
                </div>
                {hasScores && <ScoringRescoreSection leadIds={leadIds} />}
              </div>

              {total === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Noch keine bewerteten Leads — starte das Company Scoring oben.
                </p>
              ) : (
                <div className="flex flex-col gap-0">
                  {companyDistribution.map((item) => (
                    <Link
                      key={item.grade}
                      href={`/leads?grade=${item.grade}`}
                      className="flex min-h-12 items-center gap-2 rounded-lg py-2 transition-colors hover:bg-muted lg:gap-4"
                    >
                      <div className="w-[100px] shrink-0">
                        <ScoreBadge grade={item.grade} />
                      </div>
                      <span className="hidden w-10 text-xs text-muted-foreground lg:inline">
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
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Grade basiert nur auf dem Company Score — klicke für Lead-Details</span>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* PHASE 2: PERSON SCORING                                         */}
          {/* ================================================================ */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-accent" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Phase 2 — Person Score</h2>
                <p className="text-sm text-muted-foreground">
                  Bewertet Ansprechpartner bei qualifizierten Companies nach Entscheidungsmacht, Budget und Relevanz.
                </p>
              </div>
            </div>

            {/* Person Scoring Trigger */}
            {hasScores && (
              <PersonScoringSection qualifiedCount={qualifiedCount} />
            )}

            {/* Person Score Results */}
            {personScored.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-white p-4 lg:p-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-foreground">Person Score Verteilung</h3>
                  <p className="text-sm text-muted-foreground">
                    {personScored.length} Ansprechpartner bewertet · Ø {personAvg}/100
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {personTierConfig.map(({ key, label, color, barColor }) => {
                    const count = personTagCounts[key] ?? 0
                    const percent = personScored.length > 0 ? Math.round((count / personScored.length) * 100) : 0
                    return (
                      <div key={key} className="flex items-center gap-2.5">
                        <span className={`w-[100px] shrink-0 text-xs font-semibold ${color}`}>
                          {label}
                        </span>
                        <div className="h-3 flex-1 rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-muted-foreground">{count}</span>
                        <span className="w-8 text-right text-xs text-muted-foreground">{percent}%</span>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Person Score berücksichtigt deine bevorzugten Kontakt-Kanäle und idealen Jobtitel</span>
                </div>
              </div>
            )}

            {/* Empty state when no person scoring done yet */}
            {hasScores && personScored.length === 0 && qualifiedCount > 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Noch kein Person-Scoring durchgeführt
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Klicke oben auf &quot;Person-Scoring starten&quot;, um die besten Ansprechpartner zu identifizieren.
                </p>
              </div>
            )}

            {hasScores && qualifiedCount === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">
                  Keine qualifizierten Companies
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Person-Scoring ist erst verfügbar, wenn mindestens eine Company als TOP MATCH oder GOOD FIT bewertet ist.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
