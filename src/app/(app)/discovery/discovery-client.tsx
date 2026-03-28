'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Compass, Loader2, Play, Search, Settings, SlidersHorizontal, Square, Target, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { AppTopbar } from '@/components/layout/app-topbar'
import {
  startDiscoveryAction,
  saveSelectedLeadsAction,
  type IcpDefaults,
  type DiscoveryLead,
  type DiscoveredLead,
} from '@/app/actions/discovery.actions'
import { discoveryFormSchema } from '@/lib/validation/schemas'
import { useServerAction } from '@/hooks/use-server-action'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DiscoveryClientProps {
  icpDefaults: IcpDefaults
  latestLeads: DiscoveryLead[]
  totalLeadsFound: number
  hasDiscovery: boolean
  hasIcp: boolean
}

export function DiscoveryClient({
  icpDefaults,
  latestLeads,
  totalLeadsFound,
  hasDiscovery,
  hasIcp,
}: DiscoveryClientProps) {
  const router = useRouter()
  const [industries, setIndustries] = useState(icpDefaults.industries)
  const [companySize, setCompanySize] = useState(icpDefaults.companySize)
  const [region, setRegion] = useState(icpDefaults.region)
  const [technologies, setTechnologies] = useState(icpDefaults.technologies)
  const [keywords, setKeywords] = useState(icpDefaults.keywords)
  const [progress, setProgress] = useState(0)
  const [stopped, setStopped] = useState(false)

  // Discovered leads awaiting user selection (not yet saved to DB)
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)

  // After save: scoring state
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>([])
  const [isScoring, setIsScoring] = useState(false)
  const [scoringDone, setScoringDone] = useState(false)
  const [scoringProgress, setScoringProgress] = useState<{ current: number; total: number } | null>(null)

  const { execute: runDiscovery, isPending } = useServerAction(startDiscoveryAction, {
    onSuccess: (data) => {
      setDiscoveredLeads(data.leads)
      setSelectedIds(new Set(data.leads.map((l) => l.tempId)))
      setActiveCampaignId(data.campaignId)
      toast.success(
        `${data.leads.length} Leads gefunden — wähle aus, welche du speichern möchtest`,
      )
    },
  })

  const { execute: saveLeads, isPending: isSaving } = useServerAction(saveSelectedLeadsAction, {
    onSuccess: (data) => {
      toast.success(`${data.savedCount} Leads gespeichert — bereit zum Scoren`)
      setSavedLeadIds(data.savedLeadIds)
      setDiscoveredLeads([])
      setSelectedIds(new Set())
      setActiveCampaignId(null)
      setScoringDone(false)
      router.refresh()
    },
  })

  const handleScore = useCallback(async () => {
    if (savedLeadIds.length === 0) return
    setIsScoring(true)
    setScoringProgress({ current: 0, total: savedLeadIds.length })

    try {
      const response = await fetch('/api/scoring/batch-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: savedLeadIds }),
      })

      if (!response.ok) throw new Error('Scoring fehlgeschlagen')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setScoringProgress({ current: data.current, total: data.total })
              } else if (data.type === 'done') {
                toast.success(`${data.scored} Leads gescored`)
                setScoringDone(true)
                setSavedLeadIds([])
                router.refresh()
              }
            } catch {
              // Ignore partial SSE chunks
            }
          }
        }
      }
    } catch {
      toast.error('Scoring fehlgeschlagen. Bitte auf der Scoring-Seite erneut versuchen.')
    } finally {
      setIsScoring(false)
      setScoringProgress(null)
    }
  }, [savedLeadIds, router])

  function handleSave() {
    if (!activeCampaignId) return
    const selected = discoveredLeads.filter((l) => selectedIds.has(l.tempId))
    if (selected.length === 0) {
      toast.error('Bitte wähle mindestens einen Lead aus')
      return
    }
    saveLeads(activeCampaignId, selected)
  }

  const showDiscovered = discoveredLeads.length > 0
  const allSelected = showDiscovered && selectedIds.size === discoveredLeads.length

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(discoveredLeads.map((l) => l.tempId)))
    }
  }

  function toggleOne(tempId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tempId)) next.delete(tempId)
      else next.add(tempId)
      return next
    })
  }

  function handleDiscovery() {
    const validation = discoveryFormSchema.safeParse({
      industries,
      companySize,
      region,
      technologies: technologies || undefined,
      keywords: keywords || undefined,
    })
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    toast.info('Discovery gestartet...')
    setStopped(false)
    setProgress(0)
    runDiscovery({
      industries,
      companySize,
      region,
      technologies: technologies || undefined,
      keywords: keywords || undefined,
    })
  }

  useEffect(() => {
    if (!isPending || stopped) {
      return
    }
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 15))
    }, 1000)
    return () => clearInterval(interval)
  }, [isPending, stopped])

  function handleStop() {
    setStopped(true)
    setProgress(0)
    toast.info('Discovery wird abgebrochen...')
  }

  const showRunningState = isPending && !stopped

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar
        title="Lead Discovery"
        actions={
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDiscovery}
              className="hidden min-h-12 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50 lg:inline-flex"
            >
              {isPending ? 'Suche läuft...' : 'Discovery starten'}
            </button>
            <button
              type="button"
              className="hidden min-h-12 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary lg:inline-flex"
            >
              Verlauf
            </button>
          </>
        }
      />

      {!hasIcp && !hasDiscovery && latestLeads.length === 0 && !showDiscovered ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 lg:p-8">
          <EmptyState
            icon={Compass}
            title="Keine Discovery gestartet"
            description="Definiere deinen ICP und finde passende Unternehmen automatisch."
            primaryAction={{
              label: 'ICP konfigurieren',
              href: '/settings?tab=icp',
              icon: SlidersHorizontal,
            }}
            secondaryAction={{
              label: isPending ? 'Suche läuft...' : 'Erste Discovery starten',
              onClick: handleDiscovery,
              disabled: isPending,
              icon: Play,
            }}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
          <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[320px]">
            <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">Suchkriterien</h2>
                <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                  Automatisch
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="branchen" className="text-sm font-medium text-foreground">
                    Branchen
                  </label>
                  <input
                    id="branchen"
                    type="text"
                    value={industries}
                    onChange={(e) => setIndustries(e.target.value)}
                    className="min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="unternehmensgroesse"
                    className="text-sm font-medium text-foreground"
                  >
                    Unternehmensgröße
                  </label>
                  <input
                    id="unternehmensgroesse"
                    type="text"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="region" className="text-sm font-medium text-foreground">
                    Region
                  </label>
                  <input
                    id="region"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="technologien" className="text-sm font-medium text-foreground">
                    Technologien (Optional)
                  </label>
                  <input
                    id="technologien"
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="z.B. React, Python, AWS..."
                    className="min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="keywords" className="text-sm font-medium text-foreground">
                    Keywords (Optional)
                  </label>
                  <input
                    id="keywords"
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="z.B. Series A, KMU, B2B..."
                    className="min-h-12 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDiscovery}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Suche läuft...
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    Leads finden
                  </>
                )}
              </button>
            </div>

            {showRunningState && (
              <>
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-accent" />
                    <span className="text-sm font-medium text-foreground">Suche aktiv</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="h-1 w-full rounded-sm bg-border">
                      <div
                        className="h-1 rounded-sm bg-accent transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(progress)}% abgeschlossen
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {industries && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {industries}
                      </span>
                    )}
                    {region && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {region}
                      </span>
                    )}
                    {companySize && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
                        {companySize}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-success" />
                      <span className="text-xs text-muted-foreground">Apollo.io</span>
                      <span className="ml-auto text-xs font-medium text-status-success-text">Aktiv</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-success" />
                      <span className="text-xs text-muted-foreground">Google Places</span>
                      <span className="ml-auto text-xs font-medium text-status-success-text">Aktiv</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStop}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-destructive text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Square className="size-4" aria-hidden="true" />
                  Discovery stoppen
                </button>
              </>
            )}

            <Link
              href="/settings?tab=icp"
              className="inline-flex min-h-12 items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="size-4" aria-hidden="true" />
              Einstellungen prüfen
            </Link>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            {/* Score banner — shown after leads are saved */}
            {savedLeadIds.length > 0 && !scoringDone && (
              <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent-light p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {savedLeadIds.length} neue Leads bereit zum Scoren
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Starte das Company-Scoring, um die Leads zu klassifizieren (TOP MATCH / GOOD FIT / POOR FIT).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleScore}
                  disabled={isScoring}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  {isScoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  {isScoring ? 'Scoring läuft...' : 'Jetzt scoren'}
                </button>
              </div>
            )}

            {/* Scoring progress */}
            {isScoring && scoringProgress && (
              <div className="rounded-lg border border-border bg-white p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Lead {scoringProgress.current} von {scoringProgress.total}</span>
                  <span>{Math.round((scoringProgress.current / scoringProgress.total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${(scoringProgress.current / scoringProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scoring done */}
            {scoringDone && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Scoring abgeschlossen</p>
                  <p className="text-xs text-muted-foreground">
                    Alle Leads wurden bewertet.{' '}
                    <Link href="/scoring" className="font-medium text-accent hover:underline">
                      Zur Scoring-Übersicht →
                    </Link>
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  {showRunningState && latestLeads.length > 0
                    ? 'Live-Ergebnisse'
                    : 'Ergebnisse'}
                </h2>
                {showRunningState && latestLeads.length > 0 ? (
                  <span className="text-xs font-medium text-accent">Nach Score</span>
                ) : (
                  totalLeadsFound > 0 && (
                    <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
                      {totalLeadsFound} neue Leads gefunden
                    </span>
                  )
                )}
              </div>
              {showDiscovered ? (
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm text-muted-foreground lg:inline">
                    {selectedIds.size} von {discoveredLeads.length} ausgewählt
                  </span>
                  <button
                    type="button"
                    disabled={isSaving || selectedIds.size === 0}
                    onClick={handleSave}
                    className="min-h-12 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                  >
                    {isSaving
                      ? 'Wird gespeichert...'
                      : `${selectedIds.size} Lead${selectedIds.size !== 1 ? 's' : ''} hinzufügen`}
                  </button>
                </div>
              ) : (
                latestLeads.length > 0 && (
                  <Link
                    href="/leads"
                    className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    Alle anzeigen
                  </Link>
                )
              )}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-border bg-white lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {showDiscovered && (
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          aria-label="Alle auswählen"
                          className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
                        />
                      </TableHead>
                    )}
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Unternehmen
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Kontakt
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Branche
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Standort
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Quelle
                    </TableHead>
                    {!showDiscovered && (
                      <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                        Aktion
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showDiscovered ? (
                    discoveredLeads.map((lead) => (
                      <TableRow
                        key={lead.tempId}
                        className={`cursor-pointer ${selectedIds.has(lead.tempId) ? 'bg-accent-light/30' : ''}`}
                        onClick={() => toggleOne(lead.tempId)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(lead.tempId)}
                            onChange={() => toggleOne(lead.tempId)}
                            aria-label={`${lead.company_name ?? 'Lead'} auswählen`}
                            className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
                          />
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {lead.company_name ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.full_name ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.industry ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.location ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.source === 'apollo'
                            ? 'Apollo.io'
                            : lead.source === 'google_places'
                              ? 'Google Places'
                              : lead.source}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : latestLeads.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        {!hasDiscovery
                          ? 'Noch keine Discovery gestartet. Passe die Suchkriterien an und klicke auf "Leads finden".'
                          : 'Keine Ergebnisse gefunden. Passe die Suchkriterien an und versuche es erneut.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    latestLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-sm font-medium text-foreground">
                          {lead.company_name ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.full_name ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.industry ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.location ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.source === 'apollo'
                            ? 'Apollo.io'
                            : lead.source === 'google_places'
                              ? 'Google Places'
                              : (lead.source ?? '-')}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent/90"
                          >
                            Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {showRunningState &&
                    latestLeads.length > 0 &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="opacity-60">
                        <TableCell>
                          <div className="h-4 w-28 animate-pulse rounded bg-border" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 animate-pulse rounded bg-border" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 animate-pulse rounded bg-border" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 animate-pulse rounded bg-border" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 animate-pulse rounded bg-border" />
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-14 animate-pulse rounded-lg bg-border" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
              {showDiscovered ? (
                discoveredLeads.map((lead) => (
                  <div
                    key={lead.tempId}
                    onClick={() => toggleOne(lead.tempId)}
                    className={`flex flex-col gap-2 rounded-xl border bg-white p-4 transition-colors active:bg-muted ${
                      selectedIds.has(lead.tempId) ? 'border-accent bg-accent-light/20' : 'border-border'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === ' ' && toggleOne(lead.tempId)}
                    aria-pressed={selectedIds.has(lead.tempId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.tempId)}
                          onChange={() => toggleOne(lead.tempId)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${lead.company_name ?? 'Lead'} auswählen`}
                          className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {lead.company_name ?? '-'}
                        </span>
                      </div>
                      <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                        {lead.source === 'apollo' ? 'Apollo.io' : 'Google Places'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {lead.full_name && <span>{lead.full_name}</span>}
                      {lead.location && <span>{lead.location}</span>}
                      {lead.industry && (
                        <span className="rounded bg-secondary px-1.5 py-0.5">{lead.industry}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : latestLeads.length === 0 ? (
                <div className="rounded-xl border border-border bg-white px-4 py-12 text-center text-sm text-muted-foreground">
                  {!hasDiscovery
                    ? 'Noch keine Discovery gestartet. Passe die Suchkriterien an und klicke auf "Leads finden".'
                    : 'Keine Ergebnisse gefunden. Passe die Suchkriterien an und versuche es erneut.'}
                </div>
              ) : (
                latestLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 transition-colors active:bg-muted"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {lead.company_name ?? '-'}
                      </span>
                      <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                        {lead.source === 'apollo'
                          ? 'Apollo.io'
                          : lead.source === 'google_places'
                            ? 'Google Places'
                            : (lead.source ?? '-')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {lead.full_name && <span>{lead.full_name}</span>}
                      {lead.location && <span>{lead.location}</span>}
                      {lead.industry && (
                        <span className="rounded bg-secondary px-1.5 py-0.5">{lead.industry}</span>
                      )}
                    </div>
                  </Link>
                ))
              )}
              {showRunningState &&
                latestLeads.length > 0 &&
                Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={`skeleton-mobile-${i}`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 animate-pulse rounded bg-border" />
                      <div className="h-5 w-16 animate-pulse rounded-md bg-border" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-24 animate-pulse rounded bg-border" />
                      <div className="h-3 w-20 animate-pulse rounded bg-border" />
                      <div className="h-4 w-16 animate-pulse rounded bg-border" />
                    </div>
                  </div>
                ))}
            </div>

            {showDiscovered && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {discoveredLeads.length} Leads gefunden — wähle aus und klicke auf &quot;Hinzufügen&quot;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDiscoveredLeads([])
                    setSelectedIds(new Set())
                    setActiveCampaignId(null)
                  }}
                  className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Verwerfen
                </button>
              </div>
            )}
            {!showDiscovered && latestLeads.length > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {latestLeads.length} von {totalLeadsFound} Ergebnissen
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
