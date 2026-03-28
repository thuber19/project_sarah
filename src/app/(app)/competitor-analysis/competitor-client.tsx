'use client'

import { useState, useTransition } from 'react'
import { Cpu, Loader2, RefreshCw, Search, Swords, CheckCircle } from 'lucide-react'
import {
  refreshCompetitorAnalysisAction,
  type CompetitorAnalysisRow,
} from '@/app/actions/competitor.actions'
import { toast } from 'sonner'

interface AvailableLead {
  id: string
  company_name: string | null
  company_domain: string | null
  company_website: string | null
  industry: string | null
}

interface CompetitorClientProps {
  analyses: CompetitorAnalysisRow[]
  availableLeads: AvailableLead[]
}

function TechBadge({ name, isMatch }: { name: string; isMatch?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isMatch
          ? 'bg-accent-light text-accent ring-1 ring-accent/30'
          : 'bg-secondary text-muted-foreground'
      }`}
    >
      {name}
      {isMatch && ' ✓'}
    </span>
  )
}

function CompetitorCard({ analysis }: { analysis: CompetitorAnalysisRow }) {
  const companyName = analysis.lead?.company_name ?? 'Unbekannt'
  const domain = analysis.lead?.company_domain
  const totalTech = analysis.tech_stack.length
  const totalCompetitors = analysis.competitor_matches.length
  const matchedCount = analysis.icp_tech_matched.length
  const matchedSet = new Set(analysis.icp_tech_matched.map((t) => t.toLowerCase()))

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{companyName}</h3>
          {domain && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{domain}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cpu className="h-3.5 w-3.5" />
          {totalTech} Tech{totalTech !== 1 ? 's' : ''}
          {totalCompetitors > 0 && (
            <>
              <span className="text-border">·</span>
              <Swords className="h-3.5 w-3.5 text-score-qualified" />
              <span className="text-score-qualified font-medium">{totalCompetitors} Wettbewerber</span>
            </>
          )}
        </div>
      </div>

      {/* Tech Stack */}
      {totalTech > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {analysis.tech_stack.map((tech) => (
            <TechBadge
              key={tech}
              name={tech}
              isMatch={matchedSet.has(tech.toLowerCase())}
            />
          ))}
        </div>
      )}

      {/* ICP Match Info */}
      {matchedCount > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          <CheckCircle className="mr-1 inline h-3 w-3 text-accent" />
          {matchedCount} ICP-Technologie{matchedCount !== 1 ? 'n' : ''} erkannt
        </p>
      )}

      {/* Competitor Matches */}
      {totalCompetitors > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {analysis.competitor_matches.map((match, i) => (
            <div
              key={i}
              className="rounded-lg bg-score-qualified/5 border border-score-qualified/20 px-3 py-2"
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-foreground">{match.technology}</span>
                <span className="shrink-0 rounded-full bg-score-qualified/10 px-2 py-0.5 text-[10px] font-medium text-score-qualified">
                  {match.category}
                </span>
              </div>
              <p className="mt-0.5 break-words text-[11px] text-muted-foreground">
                Alternativen: {match.competitors.slice(0, 3).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {analysis.ai_summary && (
        <div className="mt-3 overflow-hidden rounded-lg bg-secondary p-3">
          <p className="break-words text-xs text-foreground">{analysis.ai_summary}</p>
        </div>
      )}

      {/* Timestamp */}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Analysiert: {new Date(analysis.analyzed_at).toLocaleDateString('de-AT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  )
}

export function CompetitorClient({ analyses: initialAnalyses, availableLeads }: CompetitorClientProps) {
  const [analyses] = useState(initialAnalyses)
  const [isPending, startTransition] = useTransition()
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Leads that don't have an analysis yet
  const analyzedLeadIds = new Set(analyses.map((a) => a.lead_id))
  const unanalyzedLeads = availableLeads.filter((l) => !analyzedLeadIds.has(l.id))

  const filteredAnalyses = searchQuery
    ? analyses.filter((a) =>
        a.lead?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tech_stack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : analyses

  function handleAnalyze(leadId: string) {
    startTransition(async () => {
      const result = await refreshCompetitorAnalysisAction({ leadId })
      if (result.success) {
        toast.success('Competitor-Analyse abgeschlossen')
        // Reload page to get fresh data
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    })
  }

  const totalCompetitorTools = analyses.reduce((sum, a) => sum + a.competitor_matches.length, 0)
  const totalTechDetected = analyses.reduce((sum, a) => sum + a.tech_stack.length, 0)

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Analysierte Leads</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{analyses.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Technologien erkannt</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalTechDetected}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Wettbewerber-Tools</p>
          <p className="mt-1 text-2xl font-bold text-score-qualified">{totalCompetitorTools}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-muted-foreground">Noch zu analysieren</p>
          <p className="mt-1 text-2xl font-bold text-accent">{unanalyzedLeads.length}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Firma oder Technologie suchen..."
            className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Analyze new lead */}
        {unanalyzedLeads.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Lead auswählen...</option>
              {unanalyzedLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name ?? lead.company_domain ?? lead.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => selectedLeadId && handleAnalyze(selectedLeadId)}
              disabled={!selectedLeadId || isPending}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Analysieren
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredAnalyses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredAnalyses.map((analysis) => (
            <CompetitorCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
          <Swords className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Keine Analysen vorhanden</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle einen Lead aus und starte die Competitor-Analyse.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white py-12">
          <Search className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Keine Ergebnisse für &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
