import { Compass, ChevronRight, Play, Search, SlidersHorizontal } from "lucide-react";
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
import { AppTopbar } from "@/components/layout/app-topbar";
import { requireAuth } from "@/lib/supabase/server";

interface DiscoveryResult {
  company: string;
  industry: string;
  location: string;
  score: number;
}

const mockResults: DiscoveryResult[] = [
  { company: "CloudScale GmbH", industry: "SaaS", location: "Wien, AT", score: 91 },
  { company: "FinanceHub AG", industry: "FinTech", location: "München, DE", score: 87 },
  { company: "AlpenCloud Solutions", industry: "Cloud", location: "Zürich, CH", score: 79 },
  { company: "Data2Health Analytics", industry: "Analytics", location: "Wien, AT", score: 74 },
  { company: "ZüriPay GmbH", industry: "FinTech", location: "Zürich, CH", score: 71 },
  { company: "LogiSmart Services", industry: "E-Commerce", location: "Hamburg, DE", score: 65 },
];

function getScoreColor(score: number): string {
  if (score >= 90) return "text-score-hot";
  if (score >= 75) return "text-score-qualified";
  if (score >= 60) return "text-score-engaged";
  return "text-score-potential";
}

export default async function DiscoveryPage() {
  const { user, supabase } = await requireAuth();

  // Load ICP + business profile to pre-fill search criteria
  const [icpResult, profileResult] = await Promise.all([
    supabase
      .from("icp_profiles")
      .select("industries, company_sizes, regions, tech_stack, keywords")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("business_profiles")
      .select("industry, target_market")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const icp = icpResult.data;
  const profile = profileResult.data;

  // Derive search defaults from ICP/profile
  const defaultIndustries =
    (icp?.industries ?? []).length > 0
      ? (icp?.industries ?? []).join(", ")
      : profile?.industry ?? "";

  const defaultSizes =
    (icp?.company_sizes ?? []).length > 0
      ? (icp?.company_sizes ?? []).join(", ")
      : "";

  const defaultRegions =
    (icp?.regions ?? []).length > 0
      ? (icp?.regions ?? []).join(", ")
      : "DACH (AT, DE, CH)";

  const defaultTech = (icp?.tech_stack ?? []).join(", ");
  const defaultKeywords = (icp?.keywords ?? []).join(", ");

  const hasIcp = !!icp && (icp.industries?.length > 0 || icp.regions?.length > 0);

  // TODO: Replace with real data check from Supabase
  const hasDiscovery = true;

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Lead Discovery" />

      {!hasIcp ? (
        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <EmptyState
            icon={Compass}
            title="Kein ICP konfiguriert"
            description="Definiere zuerst dein Ideal Customer Profile in den Einstellungen, damit Sarah passende Leads finden kann."
            primaryAction={{
              label: "ICP konfigurieren",
              href: "/settings?tab=icp",
              icon: SlidersHorizontal,
            }}
          />
        </div>
      ) : !hasDiscovery ? (
        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <EmptyState
            icon={Compass}
            title="Keine Discovery gestartet"
            description="Dein ICP ist bereit. Starte eine Lead-Discovery."
            primaryAction={{
              label: "Discovery starten",
              href: "/discovery",
              icon: Play,
            }}
          />
        </div>
      ) : (
        /* Content area */
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 lg:flex-row lg:gap-8 lg:p-8">
          {/* Left column */}
          <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[320px]">
            {/* Suchkriterien card */}
            <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  Suchkriterien
                </h2>
                <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                  Aus ICP
                </span>
              </div>

              {/* Form fields pre-filled from ICP */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="branchen" className="text-sm font-medium text-foreground">
                    Branchen
                  </label>
                  <input
                    id="branchen"
                    type="text"
                    defaultValue={defaultIndustries}
                    placeholder="z.B. SaaS, FinTech..."
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="unternehmensgroesse" className="text-sm font-medium text-foreground">
                    Unternehmensgröße
                  </label>
                  <input
                    id="unternehmensgroesse"
                    type="text"
                    defaultValue={defaultSizes}
                    placeholder="z.B. 11-50, 51-200..."
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="region" className="text-sm font-medium text-foreground">
                    Region
                  </label>
                  <input
                    id="region"
                    type="text"
                    defaultValue={defaultRegions}
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
                    defaultValue={defaultTech}
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
                    defaultValue={defaultKeywords}
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
              <h2 className="mb-3 text-base font-semibold text-foreground">Datenquellen</h2>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">A</div>
                  <span className="text-sm font-medium text-foreground">Apollo.io</span>
                  <span className="text-xs font-medium text-success">Aktiv</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">G</div>
                  <span className="text-sm font-medium text-foreground">Google Places</span>
                  <span className="text-xs font-medium text-success">Aktiv</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-foreground">Ergebnisse</h2>
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
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Unternehmen</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Branche</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Standort</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Score</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockResults.map((result) => (
                    <TableRow key={result.company}>
                      <TableCell className="text-sm font-medium text-foreground">{result.company}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.industry}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.location}</TableCell>
                      <TableCell className={`text-sm font-bold ${getScoreColor(result.score)}`}>{result.score}</TableCell>
                      <TableCell><AddLeadButton company={result.company} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Seite 1 von 8 Ergebnissen</span>
              <div className="flex items-center gap-1">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-medium text-white" aria-current="page">1</button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary">2</button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary">3</button>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary" aria-label="Nächste Seite">
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
