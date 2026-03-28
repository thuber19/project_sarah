'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Building2, CheckCircle2, ExternalLink, Loader2, MapPin, Plus, Search } from 'lucide-react'
import {
  startDiscoveryAction,
  getDiscoveryLeadsAction,
  type IcpDefaults,
  type DiscoveryLead,
} from '@/app/actions/discovery.actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  initialIcp: IcpDefaults
  userInitials: string
}

const SOURCE_LABELS: Record<string, string> = {
  apollo: 'Apollo',
  google_places: 'Google Places',
}

export function DiscoveryClient({ initialIcp, userInitials }: Props) {
  const [isPending, startTransition] = useTransition()
  const [leads, setLeads] = useState<DiscoveryLead[] | null>(null)
  const [leadsFound, setLeadsFound] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<DiscoveryLead | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const [industries, setIndustries] = useState(initialIcp.industries)
  const [companySize, setCompanySize] = useState(initialIcp.companySize)
  const [region, setRegion] = useState(initialIcp.region)
  const [technologies, setTechnologies] = useState(initialIcp.technologies)
  const [keywords, setKeywords] = useState(initialIcp.keywords)

  function handleSubmit() {
    setError(null)
    setLeads(null)
    setLeadsFound(null)

    startTransition(async () => {
      const result = await startDiscoveryAction({
        industries,
        companySize,
        region,
        technologies: technologies || undefined,
        keywords: keywords || undefined,
      })

      if ('error' in result) {
        setError(result.error)
        return
      }

      setLeadsFound(result.leadsFound)

      // Load the actual leads found in this campaign
      const discovered = await getDiscoveryLeadsAction(result.campaignId)
      setLeads(discovered)
    })
  }

  const showResults = !isPending && leadsFound !== null

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <h1 className="text-base font-semibold text-foreground">Lead Discovery</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Suche läuft...
              </span>
            ) : (
              'Discovery starten'
            )}
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Suchen"
            />
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white" aria-hidden="true">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-8 overflow-y-auto p-8">
        {/* Left column — search criteria */}
        <div className="flex w-[320px] shrink-0 flex-col gap-6">
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">Suchkriterien</h2>
              <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                Aus ICP
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { id: 'branchen', label: 'Branchen', value: industries, onChange: setIndustries, placeholder: '' },
                { id: 'groesse', label: 'Unternehmensgröße', value: companySize, onChange: setCompanySize, placeholder: '' },
                { id: 'region', label: 'Region', value: region, onChange: setRegion, placeholder: '' },
                { id: 'tech', label: 'Technologien (Optional)', value: technologies, onChange: setTechnologies, placeholder: 'z.B. React, Python, AWS...' },
                { id: 'keywords', label: 'Keywords (Optional)', value: keywords, onChange: setKeywords, placeholder: 'z.B. Series A, KMU, B2B...' },
              ].map(({ id, label, value, onChange, placeholder }) => (
                <div key={id} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>
                  <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={isPending}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isPending ? 'Suche läuft...' : 'Leads finden'}
            </button>
          </div>

          {/* Data sources */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">Datenquellen</h2>
            <div className="flex flex-col gap-2">
              {[
                { initial: 'A', bg: 'bg-blue-600', label: 'Apollo.io' },
                { initial: 'G', bg: 'bg-red-500', label: 'Google Places' },
              ].map(({ initial, bg, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} text-xs font-bold text-white`}>
                    {initial}
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="text-xs font-medium text-success">Aktiv</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — results */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">Ergebnisse</h2>
              {leadsFound !== null && (
                <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
                  {leadsFound} neue Leads gefunden
                </span>
              )}
            </div>
            {showResults && (
              <Link
                href="/leads"
                className="text-sm font-medium text-accent hover:underline"
              >
                Alle Leads ansehen →
              </Link>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {/* Loading */}
          {isPending && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16" role="status" aria-live="polite" aria-label="Discovery läuft">
              <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Discovery läuft...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI optimiert Suchparameter, durchsucht Apollo.io und Google Places
                </p>
              </div>
            </div>
          )}

          {/* Leads list */}
          {showResults && leads && leads.length > 0 && (
            <div className="rounded-xl border border-border bg-white" aria-live="polite" aria-label="Discovery-Ergebnisse">
              {/* Success banner */}
              <div className="flex items-center gap-3 border-b border-border bg-green-50 px-5 py-3 rounded-t-xl" role="status">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-success">
                  {leadsFound} Leads erfolgreich gefunden und gespeichert
                </p>
              </div>
              {/* Lead rows */}
              <div className="divide-y divide-border">
                {leads.map((lead) => {
                  const isAdded = addedIds.has(lead.id)
                  return (
                    <div
                      key={lead.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedLead(lead)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedLead(lead)}
                      className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light">
                        <Building2 className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lead.company_name ?? lead.full_name ?? 'Unbekannt'}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          {lead.industry && <span>{lead.industry}</span>}
                          {lead.industry && lead.location && <span>·</span>}
                          {lead.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {SOURCE_LABELS[lead.source ?? ''] ?? lead.source ?? '—'}
                      </span>
                      <button
                        type="button"
                        aria-label={isAdded ? 'Hinzugefügt' : 'Zu Leads hinzufügen'}
                        onClick={(e) => {
                          e.stopPropagation()
                          setAddedIds((prev) => new Set(prev).add(lead.id))
                        }}
                        disabled={isAdded}
                        className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isAdded
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-accent-light text-accent hover:bg-accent hover:text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Hinzugefügt
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Hinzufügen
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
              {leadsFound > leads.length && (
                <div className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground">
                  + {leadsFound - leads.length} weitere Leads in der{' '}
                  <Link href="/leads" className="text-accent hover:underline">Lead-Liste</Link>
                </div>
              )}
            </div>
          )}

          {/* Success but no leads */}
          {showResults && leads && leads.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
              <Search className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Keine Leads gefunden</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Passe die Suchkriterien an und starte eine neue Discovery.
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isPending && leadsFound === null && !error && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
              <Search className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Noch keine Suche gestartet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Passe die Suchkriterien an und klicke &quot;Leads finden&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Company detail dialog */}
      <Dialog open={selectedLead !== null} onOpenChange={(open) => { if (!open) setSelectedLead(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <DialogTitle>
                {selectedLead?.company_name ?? selectedLead?.full_name ?? 'Unbekannt'}
              </DialogTitle>
            </div>
          </DialogHeader>

          {selectedLead && (
            <div className="flex flex-col gap-3 py-2">
              {selectedLead.industry && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Branche</span>
                  <span className="font-medium text-foreground">{selectedLead.industry}</span>
                </div>
              )}
              {selectedLead.location && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Standort</span>
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedLead.location}
                  </span>
                </div>
              )}
              {selectedLead.source && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quelle</span>
                  <span className="font-medium text-foreground">
                    {SOURCE_LABELS[selectedLead.source] ?? selectedLead.source}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedLead && (
              <Link
                href={`/leads/${selectedLead.id}`}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" />
                Zum Lead-Profil
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
