import { Building2, Clock, TrendingUp, User } from "lucide-react";
import { ScoreBadge } from "@/components/leads/score-badge";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ScoringRulesToggle } from "./scoring-rules-toggle";
import { ScoringRunStatus } from "./scoring-run-status";
import { getLatestRun } from "@/app/actions/scoring.actions";

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
    range: "85-100",
    count: 15,
    percent: 12,
    barColor: "bg-score-hot",
  },
  {
    grade: "QUALIFIED",
    range: "70-84",
    count: 31,
    percent: 24,
    barColor: "bg-score-qualified",
  },
  {
    grade: "ENGAGED",
    range: "55-69",
    count: 28,
    percent: 22,
    barColor: "bg-score-engaged",
  },
  {
    grade: "POTENTIAL",
    range: "35-54",
    count: 38,
    percent: 30,
    barColor: "bg-score-potential",
  },
  {
    grade: "POOR_FIT",
    range: "0-34",
    count: 18,
    percent: 14,
    barColor: "bg-score-poor-fit",
  },
];

interface ScoringRule {
  name: string;
  description: string;
  weight: string;
  maxPoints: number;
  icon: "building" | "user" | "trending" | "clock";
}

const scoringRules: ScoringRule[] = [
  {
    name: "Company Fit",
    description:
      "Branche, Unternehmensgröße, DACH-Standort, Firmentyp (GmbH/AG) und Web-Präsenz",
    weight: "40%",
    maxPoints: 40,
    icon: "building",
  },
  {
    name: "Contact Fit",
    description:
      "Seniority-Level, Titel-Match zum ICP, deutsche Titel (Geschäftsführer, Vorstand, etc.)",
    weight: "20%",
    maxPoints: 20,
    icon: "user",
  },
  {
    name: "Buying Signals",
    description:
      "Funding-Runden, Stellenausschreibungen, Technologie-Stack und Social-Media-Präsenz",
    weight: "25%",
    maxPoints: 25,
    icon: "trending",
  },
  {
    name: "Timing",
    description:
      "Aktualität der Kontakt- und Unternehmensdaten als Indikator für Engagement",
    weight: "15%",
    maxPoints: 15,
    icon: "clock",
  },
];

const iconMap = {
  building: Building2,
  user: User,
  trending: TrendingUp,
  clock: Clock,
} as const;

export default async function ScoringPage() {
  const latestRun = await getLatestRun()
  const activeRun = latestRun?.status === 'running' ? latestRun : null

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Scoring-Übersicht" />

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Konfiguriere die Bewertungskriterien für deine Leads
          </p>
          <ScoringRunStatus initialRun={activeRun} />
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
                    role="progressbar"
                    aria-valuenow={item.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.grade}: ${item.percent}% (${item.count} Leads)`}
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
    </div>
  );
}
