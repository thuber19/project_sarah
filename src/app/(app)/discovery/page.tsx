'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Loader2, Search } from 'lucide-react'
import { startDiscoveryAction } from '@/app/actions/discovery.actions'

export default function DiscoveryPage() {
  const [isPending, startTransition] = useTransition()
  const [leadsFound, setLeadsFound] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [industries, setIndustries] = useState('SaaS, FinTech, E-Commerce')
  const [companySize, setCompanySize] = useState('10-500 Mitarbeiter')
  const [region, setRegion] = useState('DACH (AT, DE, CH)')
  const [technologies, setTechnologies] = useState('')
  const [keywords, setKeywords] = useState('')

  function handleSubmit() {
    setError(null)
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
      // Leads will be visible on the /leads page after discovery
      // For now show a success state
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Lead Discovery</span>

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

          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Verlauf
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

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            BG
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 gap-8 overflow-y-auto p-8">
        {/* Left column */}
        <div className="flex w-[320px] shrink-0 flex-col gap-6">
          {/* Suchkriterien card */}
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
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
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="unternehmensgroesse" className="text-sm font-medium text-foreground">
                  Unternehmensgröße
                </label>
                <input
                  id="unternehmensgroesse"
                  type="text"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isPending ? 'Suche läuft...' : 'Leads finden'}
            </button>
          </div>

          {/* Datenquellen card */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">Datenquellen</h2>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  A
                </div>
                <span className="text-sm font-medium text-foreground">Apollo.io</span>
                <span className="text-xs font-medium text-success">Aktiv</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  G
                </div>
                <span className="text-sm font-medium text-foreground">Google Places</span>
                <span className="text-xs font-medium text-success">Aktiv</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">Ergebnisse</h2>
              {leadsFound !== null && (
                <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
                  {leadsFound} neue Leads gefunden
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Status messages */}
          {isPending && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Discovery läuft...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI optimiert Suchparameter, durchsucht Apollo.io und Google Places
                </p>
              </div>
            </div>
          )}

          {/* Success state */}
          {!isPending && leadsFound !== null && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Search className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {leadsFound} Leads erfolgreich gefunden!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Die Leads sind jetzt in deiner Lead-Liste verfügbar.
                </p>
              </div>
              <Link
                href="/leads"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Zu den Leads
              </Link>
            </div>
          )}

          {/* Empty state */}
          {!isPending && leadsFound === null && (
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
    </div>
  )
}
