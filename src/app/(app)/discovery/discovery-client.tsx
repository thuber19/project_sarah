"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Compass, Play, Search, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { startDiscoveryAction, type IcpDefaults, type DiscoveryLead } from "@/app/actions/discovery.actions"
import { discoveryFormSchema } from "@/lib/validation/schemas"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DiscoveryClientProps {
  icpDefaults: IcpDefaults
  latestLeads: DiscoveryLead[]
  totalLeadsFound: number
  hasDiscovery: boolean
}

export function DiscoveryClient({
  icpDefaults,
  latestLeads,
  totalLeadsFound,
  hasDiscovery,
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
      toast.info("Discovery gestartet...")
      const result = await startDiscoveryAction({
        industries,
        companySize,
        region,
        technologies: technologies || undefined,
        keywords: keywords || undefined,
      })

      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(`${result.leadsFound} Leads gefunden!`)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Lead Discovery
        </span>

        <div className="flex items-center gap-3">
          {/* Discovery starten button */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleDiscovery}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? "Suche laeuft..." : "Discovery starten"}
          </button>

          {/* Verlauf button */}
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Verlauf
          </button>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Suchen"
            />
          </div>

          {/* Bell icon */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            BG
          </div>
        </div>
      </div>

      {!hasDiscovery && latestLeads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyState
            icon={Compass}
            title="Keine Discovery gestartet"
            description="Definiere deinen ICP und finde passende Unternehmen automatisch."
            primaryAction={{
              label: "ICP konfigurieren",
              href: "/settings?tab=icp",
              icon: SlidersHorizontal,
            }}
            secondaryAction={{
              label: "Erste Discovery starten",
              href: "/discovery",
              icon: Play,
            }}
          />
        </div>
      ) : (
        /* Content area */
        <div className="flex flex-1 gap-8 overflow-y-auto p-8">
          {/* Left column */}
          <div className="flex w-[320px] shrink-0 flex-col gap-6">
            {/* Suchkriterien card */}
            <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  Suchkriterien
                </h2>
                <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                  Automatisch
                </span>
              </div>

              {/* Form fields */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="branchen"
                    className="text-sm font-medium text-foreground"
                  >
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
                  <label
                    htmlFor="region"
                    className="text-sm font-medium text-foreground"
                  >
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
                  <label
                    htmlFor="technologien"
                    className="text-sm font-medium text-foreground"
                  >
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
                  <label
                    htmlFor="keywords"
                    className="text-sm font-medium text-foreground"
                  >
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
                {isPending ? "Suche laeuft..." : "Leads finden"}
              </button>
            </div>

            {/* Datenquellen card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-3 text-base font-semibold text-foreground">
                Datenquellen
              </h2>

              <div className="flex flex-col gap-2">
                {/* Apollo.io */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    A
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Apollo.io
                  </span>
                  <span className="text-xs font-medium text-success">Aktiv</span>
                </div>

                {/* Google Places */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    G
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    Google Places
                  </span>
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
                <h2 className="text-base font-semibold text-foreground">
                  Ergebnisse
                </h2>
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
                        Noch keine Ergebnisse. Starte eine Discovery um Leads zu finden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    latestLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="text-sm font-medium text-foreground">
                          {lead.company_name ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.full_name ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.industry ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.location ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.source === "apollo" ? "Apollo.io" : lead.source === "google_places" ? "Google Places" : lead.source ?? "-"}
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
