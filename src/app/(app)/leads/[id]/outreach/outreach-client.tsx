'use client'

import { Sparkles, Lightbulb, TrendingUp, Globe, Building2 } from 'lucide-react'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'
import { OutreachDraft } from '@/components/leads/outreach-draft'
import { MobileHeader } from '@/components/layout/mobile-header'

interface LeadData {
  id: string
  companyName: string
  firstName: string | null
  lastName: string | null
  industry: string | null
  location: string | null
  website: string | null
  companySize: string | null
}

interface ScoreData {
  totalScore: number
  grade: string
}

interface OutreachClientProps {
  lead: LeadData
  score: ScoreData | null
}

const KEY_SIGNALS = [
  'Serie-A-Finanzierung abgeschlossen',
  'DACH-Expansionsstrategie',
  'Sucht SaaS-Losungen',
]

export function OutreachClient({ lead, score }: OutreachClientProps) {
  const grade = score?.grade as Grade | undefined

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Mobile Header */}
      <MobileHeader title="AI Outreach" backHref={`/leads/${lead.id}`} />

      {/* Desktop Header */}
      <div className="hidden border-b border-border bg-white px-8 py-4 lg:flex lg:items-center lg:gap-3">
        <Sparkles className="h-5 w-5 text-accent" />
        <h1 className="text-xl font-bold text-foreground">AI Outreach</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile: stacked layout */}
        <div className="flex flex-col gap-4 p-4 lg:hidden">
          {/* Mobile Lead Summary Card */}
          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold text-foreground">
                  {lead.companyName}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {lead.industry && (
                    <span className="text-xs text-muted-foreground">{lead.industry}</span>
                  )}
                  {lead.industry && lead.location && (
                    <span className="text-xs text-muted-foreground" aria-hidden="true">
                      ·
                    </span>
                  )}
                  {lead.location && (
                    <span className="text-xs text-muted-foreground">{lead.location}</span>
                  )}
                </div>
              </div>
              {grade && <ScoreBadge grade={grade} />}
            </div>
          </div>

          {/* Mobile OutreachDraft */}
          <OutreachDraft leadId={lead.id} />
        </div>

        {/* Desktop: two-column layout */}
        <div className="hidden gap-6 p-6 lg:flex">
          {/* Left Column */}
          <div className="flex w-[380px] shrink-0 flex-col gap-6">
            {/* Lead Card */}
            <div className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">{lead.companyName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {lead.industry && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {lead.industry}
                      </span>
                    )}
                    {lead.location && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        {lead.location}
                      </span>
                    )}
                  </div>
                </div>
                {grade && <ScoreBadge grade={grade} />}
              </div>

              {lead.companySize && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Unternehmensgr&ouml;&szlig;e: {lead.companySize}
                </p>
              )}

              {/* Key Signals */}
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Key Signals</h3>
                <ul className="flex flex-col gap-2">
                  {KEY_SIGNALS.map((signal) => (
                    <li key={signal} className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="text-sm text-foreground">{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategy Card */}
            <div className="rounded-xl border border-border bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                <h3 className="text-base font-bold text-foreground">Outreach-Strategie</h3>
              </div>

              <p className="mb-2 text-sm font-semibold text-foreground">
                Empfohlener Ansatz: Wertbasierte Partnerschaft
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Basierend auf der aktuellen Wachstumsphase und den identifizierten Pain Points
                empfehlen wir einen beratenden Ansatz, der den konkreten Mehrwert f&uuml;r das
                Unternehmen in den Vordergrund stellt. Fokussieren Sie auf ROI-getriebene Argumente
                und branchenspezifische Erfolgsbeispiele.
              </p>

              <div className="mt-4">
                <span className="inline-flex items-center rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                  KI-Konfidenz: 94%
                </span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="min-w-0 flex-1">
            <OutreachDraft leadId={lead.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
