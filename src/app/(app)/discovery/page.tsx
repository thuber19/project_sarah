import { Bell, Compass, ChevronRight, Play, Search, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddAllLeadsButton,
  AddLeadButton,
  DiscoveryStartButton,
  LeadsFindButton,
} from "./discovery-actions";

interface DiscoveryResult {
  company: string;
  industry: string;
  location: string;
  score: number;
}

const mockResults: DiscoveryResult[] = [
  {
    company: "CloudScale GmbH",
    industry: "SaaS",
    location: "Wien, AT",
    score: 91,
  },
  {
    company: "FinanceHub AG",
    industry: "FinTech",
    location: "München, DE",
    score: 87,
  },
  {
    company: "AlpenCloud Solutions",
    industry: "Cloud",
    location: "Zürich, CH",
    score: 79,
  },
  {
    company: "Data2Health Analytics",
    industry: "Analytics",
    location: "Wien, AT",
    score: 74,
  },
  {
    company: "ZüriPay GmbH",
    industry: "FinTech",
    location: "Zürich, CH",
    score: 71,
  },
  {
    company: "LogiSmart Services",
    industry: "E-Commerce",
    location: "Hamburg, DE",
    score: 65,
  },
];

function getScoreColor(score: number): string {
  if (score >= 90) return "text-score-hot";
  if (score >= 75) return "text-score-qualified";
  if (score >= 60) return "text-score-engaged";
  return "text-score-potential";
}

// TODO: Replace with real data check from Supabase
const hasDiscovery = true;

export default function DiscoveryPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Lead Discovery
        </span>

        <div className="flex items-center gap-3">
          {/* Discovery starten button */}
          <DiscoveryStartButton />

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

      {!hasDiscovery ? (
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
                  defaultValue="SaaS, FinTech, E-Commerce"
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
                  defaultValue="10-500 Mitarbeiter"
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
                  defaultValue="DACH (AT, DE, CH)"
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
                  placeholder="z.B. Series A, KMU, B2B..."
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Leads finden button */}
            <LeadsFindButton />
          </div>

          {/* Datenquellen card */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Datenquellen
            </h2>

            <div className="flex flex-col gap-2">
              {/* Apollo.io */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  A
                </div>
                <span className="text-sm font-medium text-foreground">
                  Apollo.io
                </span>
                <span className="text-xs font-medium text-success">Aktiv</span>
              </div>

              {/* Google Places */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
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
              <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
                147 neue Leads gefunden
              </span>
            </div>
            <AddAllLeadsButton />
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
                    Branche
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                    Standort
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                    Score
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                    Aktion
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockResults.map((result) => (
                  <TableRow key={result.company}>
                    <TableCell className="text-sm font-medium text-foreground">
                      {result.company}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.industry}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {result.location}
                    </TableCell>
                    <TableCell
                      className={`text-sm font-bold ${getScoreColor(result.score)}`}
                    >
                      {result.score}
                    </TableCell>
                    <TableCell>
                      <AddLeadButton company={result.company} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Seite 1 von 8 Ergebnissen
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-medium text-white"
                aria-current="page"
              >
                1
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                2
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                3
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Nächste Seite"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
