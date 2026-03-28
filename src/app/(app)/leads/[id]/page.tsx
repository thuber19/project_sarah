import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Bell, ExternalLink, Mail, Search, User } from 'lucide-react'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'
import { ScoreBreakdown } from '@/components/leads/score-breakdown'
import { AnimatedScore } from '@/components/leads/animated-score'
import { LeadResearchButton } from '@/components/leads/lead-research-button'
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

  const [leadResult, scoreResult] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('lead_scores').select('*').eq('lead_id', id).eq('user_id', user.id).maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) notFound()

  const lead = leadResult.data
  const score = scoreResult.data

  const { data: logs } = lead.campaign_id
    ? await supabase
        .from('agent_logs')
        .select('id, action_type, message, created_at')
        .eq('campaign_id', lead.campaign_id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] }

  const displayName =
    lead.full_name ?? ([lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unbekannt')
  const grade = (score?.grade ?? null) as Grade | null

  const scoreColor =
    grade === 'HOT'
      ? 'text-score-hot'
      : grade === 'QUALIFIED'
        ? 'text-score-qualified'
        : 'text-foreground'

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Lead-Detail</span>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Suchen"
            />
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
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
      <div className="flex-1 overflow-y-auto p-8">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Liste
        </Link>

        {/* Header */}
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lead.company_name ?? displayName}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              {grade && <ScoreBadge grade={grade} />}
              {(lead.location ?? lead.country) && (
                <span className="text-sm text-muted-foreground">{lead.location ?? lead.country}</span>
              )}
            </div>
          </div>
          {score && (
            <div className="text-right">
              <AnimatedScore value={score.total_score} className={`text-4xl font-bold ${scoreColor}`} />
              <p className="mt-1 text-sm font-medium text-muted-foreground">{grade}</p>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-8">
            {score && (
              <div className="rounded-xl border border-border bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground">Score Breakdown</h2>
                  <LeadResearchButton
                    leadId={id}
                    companyName={lead.company_name}
                  />
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
                    <p className="text-sm text-foreground">{score.ai_reasoning}</p>
                  </div>
                )}
                {score.recommended_action && (
                  <div className="mt-3 rounded-lg border border-accent/20 bg-accent-light p-3">
                    <p className="mb-0.5 text-xs font-medium text-accent">Empfehlung</p>
                    <p className="text-sm text-foreground">{score.recommended_action}</p>
                  </div>
                )}
              </div>
            )}

            {/* Kontakt */}
            <div className="rounded-xl border border-border bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground">Kontaktinformationen</h2>
                {!score && (
                  <LeadResearchButton
                    leadId={id}
                    companyName={lead.company_name}
                  />
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{displayName}</span>
                  {lead.job_title && (
                    <span className="text-sm text-muted-foreground">{lead.job_title}</span>
                  )}
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.email}`} className="text-sm text-accent underline">
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
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">Unternehmensprofil</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
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
              <div className="rounded-xl border border-border bg-white p-6">
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
