import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Mail, Newspaper, User, Sparkles, Swords } from 'lucide-react'
import { detectCompetitors, type CompetitorMatch } from '@/lib/ai/tools/detect-tech-stack'
import { fetchCompanyNews, type NewsItem } from '@/lib/ai/tools/company-news'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'
import { DataQualityBadge } from '@/components/leads/data-quality-badge'
import { ScoreBreakdown } from '@/components/leads/score-breakdown'
import { OutreachVoice } from '@/components/leads/outreach-voice'
import { OutreachDraft } from '@/components/leads/outreach-draft'
import { AnimatedScore } from '@/components/leads/animated-score'
import { AppTopbar } from '@/components/layout/app-topbar'
import { LeadResearch } from '@/components/leads/lead-research'
import { LeadStreamingAnalysis } from '@/components/leads/lead-streaming-analysis'
import { LeadResearchButton } from '@/components/leads/lead-research-button'
import { EmailGenerator } from '@/components/leads/email-generator'
import { requireAuth } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

const eventTypeLabels: Record<string, { label: string; className: string }> = {
  funding: { label: 'Funding', className: 'bg-score-hot/10 text-score-hot' },
  expansion: { label: 'Expansion', className: 'bg-score-engaged/10 text-score-engaged' },
  hiring: { label: 'Hiring', className: 'bg-score-qualified/10 text-score-qualified' },
  product_launch: { label: 'Produkt', className: 'bg-accent-light text-accent' },
  leadership_change: { label: 'Leadership', className: 'bg-secondary text-muted-foreground' },
  other: { label: 'News', className: 'bg-secondary text-muted-foreground' },
}

function EventTypeBadge({ type }: { type: string }) {
  const config = eventTypeLabels[type] ?? eventTypeLabels.other
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`
  return new Date(dateStr).toLocaleDateString('de-AT')
}

const activityDotColor: Record<string, string> = {
  lead_scored: 'bg-success',
  leads_discovered: 'bg-accent',
  campaign_completed: 'bg-warning',
  campaign_failed: 'bg-destructive',
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const { user, supabase } = await requireAuth()

  const [leadResult, scoreResult, researchResult, icpResult] = await Promise.all([
    supabase
      .from('leads')
      .select(
        'id, first_name, last_name, full_name, company_name, email, linkedin_url, job_title, industry, company_size, revenue_range, funding_stage, location, country, company_website, company_domain, campaign_id, enrichment_status',
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('lead_scores')
      .select(
        'total_score, grade, company_fit_score, contact_fit_score, buying_signals_score, timing_score, ai_reasoning, recommended_action, data_quality_score',
      )
      .eq('lead_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('lead_research')
      .select('full_report, tech_stack')
      .eq('lead_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('icp_profiles').select('tech_stack').eq('user_id', user.id).maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) notFound()

  const lead = leadResult.data
  const score = scoreResult.data
  const research = researchResult.data
  const techStack: string[] = (research?.tech_stack as string[] | null) ?? []
  const icpTechStack: string[] = (icpResult.data?.tech_stack as string[] | null) ?? []
  const icpTechSet = new Set(icpTechStack.map((t) => t.toLowerCase().trim()))
  const competitorMatches: CompetitorMatch[] =
    techStack.length > 0 ? detectCompetitors(techStack) : []

  // Fetch company news + activity logs in parallel
  const [logsResult, newsResult] = await Promise.all([
    lead.campaign_id
      ? supabase
          .from('agent_logs')
          .select('id, action_type, message, created_at')
          .eq('campaign_id', lead.campaign_id)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    lead.company_name
      ? fetchCompanyNews(lead.company_name, lead.company_domain ?? undefined).catch(() => null)
      : Promise.resolve(null),
  ])

  const logs = logsResult.data
  const companyNews = newsResult?.news ?? []

  const joinedName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  const displayName = (lead.full_name ?? joinedName) || 'Unbekannt'
  const grade = (score?.grade ?? null) as Grade | null

  const scoreColor =
    grade === 'HOT'
      ? 'text-score-hot'
      : grade === 'QUALIFIED'
        ? 'text-score-qualified'
        : 'text-foreground'

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Lead-Detail" initials={user.email?.slice(0, 2).toUpperCase() ?? 'SP'} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 lg:p-8">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Liste
        </Link>

        {/* Header */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-foreground lg:text-2xl">
              {lead.company_name ?? displayName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 lg:gap-3">
              {grade && <ScoreBadge grade={grade} />}
              {score?.data_quality_score != null && (
                <DataQualityBadge score={score.data_quality_score} />
              )}
              {lead.enrichment_status === 'enriching' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-info-bg px-2.5 py-0.5 text-xs font-medium text-status-info-text">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  Wird angereichert…
                </span>
              )}
              {(lead.location ?? lead.country) && (
                <span className="text-sm text-muted-foreground">
                  {lead.location ?? lead.country}
                </span>
              )}
            </div>
          </div>
          {score && (
            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0 sm:text-right">
              <AnimatedScore
                value={score.total_score}
                className={`text-3xl font-bold lg:text-4xl ${scoreColor}`}
              />
              <p className="text-sm font-medium text-muted-foreground sm:mt-1">{grade}</p>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="mt-6 flex flex-col gap-6 lg:mt-8 lg:flex-row lg:gap-8">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-6 lg:gap-8">
            <LeadResearch leadId={id} cachedReport={research?.full_report ?? null} />
            <OutreachDraft leadId={id} />
            <Link
              href={`/leads/${id}/outreach`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-accent bg-accent-light px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
            >
              <Sparkles className="h-4 w-4" />
              AI Outreach-Seite öffnen
            </Link>
            <OutreachVoice leadId={id} companyName={lead.company_name ?? null} />
            {score && (
              <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Score Breakdown</h2>
                  <LeadResearchButton leadId={id} companyName={lead.company_name} />
                </div>
                <ScoreBreakdown
                  companyFit={score.company_fit_score}
                  contactFit={score.contact_fit_score}
                  buyingSignals={score.buying_signals_score}
                  timing={score.timing_score}
                />
                {score.ai_reasoning && (
                  <div className="mt-4 rounded-lg bg-secondary p-4">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">AI-Begründung</p>
                    <p className="break-words text-sm text-foreground">{score.ai_reasoning}</p>
                  </div>
                )}
                {score.recommended_action && (
                  <div className="mt-3 rounded-lg border border-accent/20 bg-accent-light p-3">
                    <p className="mb-0.5 text-xs font-medium text-accent">Empfehlung</p>
                    <p className="break-words text-sm text-foreground">
                      {score.recommended_action}
                    </p>
                  </div>
                )}
              </div>
            )}

            <LeadStreamingAnalysis leadId={id} hasExistingScore={!!score} />

            {/* Kontakt */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Kontaktinformationen</h2>
                {!score && <LeadResearchButton leadId={id} companyName={lead.company_name} />}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">{displayName}</span>
                  {lead.job_title && (
                    <span className="truncate text-sm text-muted-foreground">{lead.job_title}</span>
                  )}
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="truncate text-sm text-accent underline"
                    >
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent"
                    >
                      LinkedIn-Profil
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Outreach / Email */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">Outreach</h2>
              <EmailGenerator leadId={id} />
            </div>
          </div>

          {/* Right column */}
          <div className="flex w-full flex-col gap-6 lg:w-[340px]">
            <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">Unternehmensprofil</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 [&_p]:break-words">
                {lead.industry && (
                  <div>
                    <p className="text-xs text-muted-foreground">Industrie</p>
                    <p className="text-sm font-medium text-foreground">{lead.industry}</p>
                  </div>
                )}
                {lead.company_size && (
                  <div>
                    <p className="text-xs text-muted-foreground">Größe</p>
                    <p className="text-sm font-medium text-foreground">{lead.company_size}</p>
                  </div>
                )}
                {lead.revenue_range && (
                  <div>
                    <p className="text-xs text-muted-foreground">Umsatz</p>
                    <p className="text-sm font-medium text-foreground">{lead.revenue_range}</p>
                  </div>
                )}
                {lead.funding_stage && (
                  <div>
                    <p className="text-xs text-muted-foreground">Funding</p>
                    <p className="text-sm font-medium text-foreground">{lead.funding_stage}</p>
                  </div>
                )}
                {(lead.location ?? lead.country) && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Standort</p>
                    <p className="text-sm font-medium text-foreground">
                      {lead.location ?? lead.country}
                    </p>
                  </div>
                )}
                {lead.company_website && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a
                      href={lead.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent"
                    >
                      {lead.company_domain ?? lead.company_website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {techStack.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">Technologien</h2>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => {
                    const isMatch = icpTechSet.has(tech.toLowerCase().trim())
                    return (
                      <span
                        key={tech}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isMatch
                            ? 'bg-accent-light text-accent ring-1 ring-accent/30'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                        title={isMatch ? 'Passt zu deinem ICP Tech-Stack' : undefined}
                      >
                        {tech}
                        {isMatch && ' \u2713'}
                      </span>
                    )
                  })}
                </div>
                {icpTechStack.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {techStack.filter((t) => icpTechSet.has(t.toLowerCase().trim())).length} von{' '}
                    {icpTechStack.length} ICP-Technologien erkannt
                  </p>
                )}
              </div>
            )}

            {competitorMatches.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Swords className="h-4 w-4 text-score-qualified" />
                  <h2 className="text-base font-semibold text-foreground">Competitor-Analyse</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {competitorMatches.map((match, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-score-qualified/20 bg-score-qualified/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {match.technology}
                        </span>
                        <span className="rounded-full bg-score-qualified/10 px-2 py-0.5 text-xs font-medium text-score-qualified">
                          {match.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Wettbewerber: {match.competitors.slice(0, 4).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {competitorMatches.length} Wettbewerber-Tool
                  {competitorMatches.length !== 1 ? 's' : ''} erkannt — höhere
                  Wechselbereitschaft möglich
                </p>
              </div>
            )}

            {companyNews.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground">Neuigkeiten</h2>
                </div>
                <div className="flex flex-col gap-4">
                  {companyNews.map((item: NewsItem, i: number) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1 border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {item.title}
                        </p>
                        <EventTypeBadge type={item.event_type} />
                      </div>
                      <p className="text-xs text-muted-foreground">{item.summary}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-accent">{item.relevance}</p>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
                          >
                            {item.source}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{item.source}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {logs && logs.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">Aktivitäten</h2>
                <div className="flex flex-col gap-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityDotColor[log.action_type] ?? 'bg-muted-foreground'}`}
                      />
                      <div>
                        <p className="text-sm text-foreground">{log.message}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
