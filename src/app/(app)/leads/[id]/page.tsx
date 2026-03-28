import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Mail, User } from 'lucide-react'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'
import { DataQualityBadge } from '@/components/leads/data-quality-badge'
import { ScoreBreakdown } from '@/components/leads/score-breakdown'
import { OutreachVoice } from '@/components/leads/outreach-voice'
import { OutreachDraft } from '@/components/leads/outreach-draft'
import { AnimatedScore } from '@/components/leads/animated-score'
import { AppTopbar } from '@/components/layout/app-topbar'
import { LeadResearch } from '@/components/leads/lead-research'
import { LeadStreamingAnalysis } from '@/components/leads/lead-streaming-analysis'
import { requireAuth } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
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

  const [leadResult, scoreResult, researchResult] = await Promise.all([
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
      .select('full_report')
      .eq('lead_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) notFound()

  const lead = leadResult.data
  const score = scoreResult.data
  const research = researchResult.data

  const { data: logs } = lead.campaign_id
    ? await supabase
        .from('agent_logs')
        .select('id, action_type, message, created_at')
        .eq('campaign_id', lead.campaign_id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
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
            <OutreachVoice leadId={id} companyName={lead.company_name ?? null} />
            {score && (
              <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">Score Breakdown</h2>
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
                    <p className="break-words text-sm text-foreground">{score.recommended_action}</p>
                  </div>
                )}
              </div>
            )}

            <LeadStreamingAnalysis leadId={id} hasExistingScore={!!score} />

            {/* Kontakt */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">Kontaktinformationen</h2>
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
                    <a href={`mailto:${lead.email}`} className="truncate text-sm text-accent underline">
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
