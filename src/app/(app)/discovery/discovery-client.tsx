'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Compass, Play, Search, Settings, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { AppTopbar } from '@/components/layout/app-topbar'
import {
  startDiscoveryAction,
  type IcpDefaults,
  type DiscoveryLead,
} from '@/app/actions/discovery.actions'
import { discoveryFormSchema } from '@/lib/validation/schemas'
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
  const [isPending, startTransition] = useTransition()
  const [industries, setIndustries] = useState(icpDefaults.industries)
  const [companySize, setCompanySize] = useState(icpDefaults.companySize)
  const [region, setRegion] = useState(icpDefaults.region)
  const [technologies, setTechnologies] = useState(icpDefaults.technologies)
  const [keywords, setKeywords] = useState(icpDefaults.keywords)

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

    startTransition(async () => {
      toast.info('Discovery gestartet...')
      const result = await startDiscoveryAction({
        industries,
        companySize,
        region,
        technologies: technologies || undefined,
        keywords: keywords || undefined,
      })

      if (!result.success) {
        toast.error(result.error.message)
      } else {
        toast.success(`${result.data.leadsFound} Leads gefunden!`)
        router.refresh()
      }
    })
  }

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
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {isPending ? 'Suche laeuft...' : 'Discovery starten'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              Verlauf
            </button>
          </>
        }
      />

      {!hasIcp && !hasDiscovery && latestLeads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-white p-12">
            <div className="flex size-24 items-center justify-center rounded-full bg-accent-light">
              <Compass className="size-12 text-accent" aria-hidden="true" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">Keine Discovery gestartet</h3>
              <p className="max-w-[420px] text-center text-sm leading-relaxed text-muted-foreground">
                Definiere deinen ICP und finde passende Unternehmen automatisch.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/settings?tab=icp"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                ICP konfigurieren
              </Link>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDiscovery}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <Play className="size-4" aria-hidden="true" />
                {isPending ? 'Suche läuft...' : 'Erste Discovery starten'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Content area */
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

              {/* Form fields */}
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

              {/* Leads finden button */}
              <button
                type="button"
                disabled={isPending}
                onClick={handleDiscovery}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {isPending ? 'Suche laeuft...' : 'Leads finden'}
              </button>
            </div>

            {/* Settings link */}
            <Link
              href="/settings?tab=icp"
              className="inline-flex items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="size-4" aria-hidden="true" />
              Einstellungen pruefen
            </Link>
          </div>

          {/* Right column */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">Ergebnisse</h2>
                {totalLeadsFound > 0 && (
                  <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
                    {totalLeadsFound} neue Leads gefunden
                  </span>
                )}
              </div>
              {latestLeads.length > 0 && (
                <Link
                  href="/leads"
                  className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
                >
                  Alle anzeigen
                </Link>
              )}
            </div>

            {/* Results table */}
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
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
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Aktion
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestLeads.length === 0 ? (
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
                </TableBody>
              </Table>
            </div>

            {/* Result count */}
            {latestLeads.length > 0 && (
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
