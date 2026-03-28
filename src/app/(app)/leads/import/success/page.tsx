'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { AppTopbar } from '@/components/layout/app-topbar'
import { MobileHeader } from '@/components/layout/mobile-header'
import { ScoreBadge } from '@/components/leads/score-badge'

const MOCK_LEADS = [
  {
    id: '1',
    company: 'TechVision GmbH',
    industry: 'Software',
    city: 'München',
    score: 93,
    status: 'Qualifiziert',
    updated: 'vor 2 Min.',
  },
  {
    id: '2',
    company: 'Müller & Partner AG',
    industry: 'Beratung',
    city: 'Zürich',
    score: 87,
    status: 'Qualifiziert',
    updated: 'vor 3 Min.',
  },
  {
    id: '3',
    company: 'Alpine Industries',
    industry: 'Fertigung',
    city: 'Wien',
    score: 76,
    status: 'Kontaktiert',
    updated: 'vor 4 Min.',
  },
  {
    id: '4',
    company: 'DataFlow Solutions',
    industry: 'IT-Dienste',
    city: 'Berlin',
    score: 83,
    status: 'Neu',
    updated: 'vor 5 Min.',
  },
  {
    id: '5',
    company: 'Schweizer Logistik AG',
    industry: 'Logistik',
    city: 'Bern',
    score: 0,
    status: 'Bewertung...',
    updated: 'vor 6 Min.',
  },
  {
    id: '6',
    company: 'Rhein Pharma GmbH',
    industry: 'Pharma',
    city: 'Frankfurt',
    score: 0,
    status: 'Bewertung...',
    updated: 'vor 7 Min.',
  },
  {
    id: '7',
    company: 'Barabichi Werke',
    industry: 'SaaS',
    city: 'Hamburg',
    score: 0,
    status: 'Ausstehend',
    updated: 'vor 8 Min.',
  },
]

function getGradeForScore(score: number) {
  if (score >= 90) return 'HOT'
  if (score >= 75) return 'QUALIFIED'
  if (score >= 60) return 'ENGAGED'
  if (score >= 40) return 'POTENTIAL'
  return 'POOR_FIT'
}

export default function ImportSuccessPage() {
  const [progress, setProgress] = useState(34)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.floor(Math.random() * 8) + 2
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const scoredCount = Math.floor((progress / 100) * 127)

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="hidden lg:block">
        <AppTopbar title="Lead-Liste" />
      </div>
      <MobileHeader title="Lead-Liste" backHref="/leads" />

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Success banner */}
        <div className="flex items-center gap-3 bg-status-success-bg px-4 py-3 lg:px-8">
          <CheckCircle2 className="size-5 shrink-0 text-status-success-text" />
          <p className="text-sm font-medium text-success">
            127 Leads erfolgreich importiert! Sarah bewertet sie jetzt automatisch.
          </p>
        </div>

        {/* Scoring progress */}
        <div className="border-b border-border bg-white px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2
                className={`size-4 text-accent ${progress < 100 ? 'animate-spin' : 'hidden'}`}
              />
              <span className="text-sm font-medium text-foreground">
                {progress < 100
                  ? `Sarah bewertet Leads... ${scoredCount} von 127`
                  : '127 Leads bewertet'}
              </span>
            </div>
            <span className="text-sm font-semibold text-accent">{Math.min(progress, 100)}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Lead table - desktop */}
        <div className="hidden flex-1 px-8 py-6 lg:block">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-sm font-semibold text-foreground">Importierte Leads</h2>
            <span className="text-sm text-muted-foreground">
              {scoredCount} von 127 bewertet
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Unternehmen
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Branche
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Standort
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Aktualisiert
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEADS.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{lead.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.industry}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.city}</td>
                    <td className="px-4 py-3">
                      {lead.score > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{lead.score}</span>
                          <ScoreBadge grade={getGradeForScore(lead.score)} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.status === 'Bewertung...' ? (
                        <span className="flex items-center gap-1.5 text-accent">
                          <Loader2 className="size-3 animate-spin" />
                          {lead.status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{lead.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center pt-6">
            <Link
              href="/leads"
              className="flex min-h-12 items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Alle Leads anzeigen
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Lead cards - mobile */}
        <div className="flex flex-1 flex-col gap-3 px-4 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Importierte Leads</h2>
            <span className="text-xs text-muted-foreground">127 gesamt</span>
          </div>

          {MOCK_LEADS.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between rounded-xl border border-border bg-white p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">{lead.company}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{lead.city}</span>
                  <span className="text-xs text-muted-foreground">{lead.industry}</span>
                  {lead.status === 'Bewertung...' && (
                    <span className="flex items-center gap-1 text-xs text-accent">
                      <Loader2 className="size-3 animate-spin" />
                      {lead.status}
                    </span>
                  )}
                </div>
              </div>
              {lead.score > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{lead.score}</span>
                  <ScoreBadge grade={getGradeForScore(lead.score)} />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          ))}

          <Link
            href="/leads"
            className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Alle Leads anzeigen
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
