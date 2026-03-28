import { Bell, Building2, Code, Globe, Play, Search, Settings2, Star, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge } from "@/components/leads/score-badge";
import { ScoringRulesToggle } from "./scoring-rules-toggle";

type Grade = "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR_FIT";

interface DistributionItem {
  grade: Grade;
  range: string;
  count: number;
  percent: number;
  barColor: string;
}

const distributionData: DistributionItem[] = [
  {
    grade: "HOT",
    range: "90-100",
    count: 15,
    percent: 12,
    barColor: "bg-score-hot",
  },
  {
    grade: "QUALIFIED",
    range: "75-89",
    count: 31,
    percent: 24,
    barColor: "bg-score-qualified",
  },
  {
    grade: "ENGAGED",
    range: "60-74",
    count: 28,
    percent: 22,
    barColor: "bg-score-engaged",
  },
  {
    grade: "POTENTIAL",
    range: "40-59",
    count: 38,
    percent: 30,
    barColor: "bg-score-potential",
  },
  {
    grade: "POOR_FIT",
    range: "0-39",
    count: 18,
    percent: 14,
    barColor: "bg-score-poor-fit",
  },
];

interface ScoringRule {
  name: string;
  description: string;
  weight: string;
  icon: "building" | "code" | "trending" | "globe";
}

const scoringRules: ScoringRule[] = [
  {
    name: "Company Fit",
    description:
      "Unternehmensgröße, Branche und Standort passen zum Ideal Customer Profile",
    weight: "40%",
    icon: "building",
  },
  {
    name: "Technology Match",
    description:
      "Technologie-Stack des Unternehmens passt zu unserer Lösung",
    weight: "25%",
    icon: "code",
  },
  {
    name: "Growth Signals",
    description:
      "Wachstumsindikatoren wie Funding, Stellenausschreibungen und Expansion",
    weight: "25%",
    icon: "trending",
  },
  {
    name: "Market Relevance",
    description: "Relevanz im DACH-Markt und regionale Marktpräsenz",
    weight: "10%",
    icon: "globe",
  },
];

const iconMap = {
  building: Building2,
  code: Code,
  trending: TrendingUp,
  globe: Globe,
} as const;

// TODO: Replace with real data check from Supabase
const hasScores = true;

export default function ScoringPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Scoring-Übersicht
        </span>

        <div className="flex items-center gap-4">
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

      {!hasScores ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyState
            icon={Star}
            title="Noch keine Scores"
            description="Starte eine Discovery, um Leads automatisch zu bewerten und zu priorisieren."
            primaryAction={{
              label: "Discovery starten",
              href: "/discovery",
              icon: Play,
            }}
            secondaryAction={{
              label: "Scoring konfigurieren",
              href: "/scoring",
              icon: Settings2,
            }}
          />
        </div>
      ) : (
      /* Content area */
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Scoring-Übersicht
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfiguriere die Bewertungskriterien für deine Leads
          </p>
        </div>

        {/* Score Distribution card */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-base font-semibold text-foreground">
            Score Distribution
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Verteilung der Lead-Scores über alle aktiven Leads
          </p>

          <div className="flex flex-col gap-0">
            {distributionData.map((item) => (
              <div
                key={item.grade}
                className="flex items-center gap-4 py-2"
              >
                {/* Grade badge */}
                <div className="w-[100px]">
                  <ScoreBadge grade={item.grade} />
                </div>

                {/* Range text */}
                <span className="w-12 text-xs text-muted-foreground">
                  {item.range}
                </span>

                {/* Bar */}
                <div className="h-4 flex-1 rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${item.barColor}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                {/* Count */}
                <span className="w-20 text-right text-sm text-foreground">
                  {item.count} Leads
                </span>

                {/* Percent */}
                <span className="w-10 text-right text-sm text-muted-foreground">
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Rules card */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-base font-semibold text-foreground">
            Scoring Rules
          </h2>
          <p className="text-sm text-muted-foreground">
            Gewichtete Bewertungskriterien für die Lead-Qualifizierung
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {scoringRules.map((rule) => {
              const Icon = iconMap[rule.icon];

              return (
                <div
                  key={rule.name}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  {/* Left side */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {rule.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rule.description}
                      </p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-semibold text-foreground">
                      {rule.weight}
                    </span>
                    <ScoringRulesToggle />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Regeln aktualisieren
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
