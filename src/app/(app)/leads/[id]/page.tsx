import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Search,
  User,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { ScoreBadge } from "@/components/leads/score-badge";
import { ScoreBreakdown } from "@/components/leads/score-breakdown";

export default function LeadDetailPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Lead-Liste
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

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Back link */}
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Liste
        </Link>

        {/* Header row */}
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              TechVentures GmbH
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <ScoreBadge grade="HOT" />
              <span className="text-sm text-muted-foreground">Wien, AT</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-4xl font-bold text-score-hot">92</span>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              HOT
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="mt-8 flex gap-8">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-8">
            {/* Score Breakdown card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Score Breakdown
              </h2>
              <ScoreBreakdown
                companyFit={35}
                technologyMatch={20}
                growthSignal={22}
                marketRelevance={15}
              />
            </div>

            {/* Kontaktinformationen card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Kontaktinformationen
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Max Mustermann
                  </span>
                  <span className="text-sm text-muted-foreground">CTO</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href="mailto:max.mustermann@techventures.at"
                    className="text-sm text-accent underline"
                  >
                    max.mustermann@techventures.at
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    +43 1 234 5678
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a
                    href="https://linkedin.com/in/maxmustermann"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent"
                  >
                    linkedin.com/in/maxmustermann
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex w-[340px] flex-col gap-6">
            {/* Unternehmensprofil card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Unternehmensprofil
              </h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Industrie</p>
                  <p className="text-sm font-medium text-foreground">
                    SaaS/Cloud
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Größe</p>
                  <p className="text-sm font-medium text-foreground">
                    25-50 Mitarbeiter
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Umsatz</p>
                  <p className="text-sm font-medium text-foreground">
                    EUR 2-5M
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gegründet</p>
                  <p className="text-sm font-medium text-foreground">2019</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Standort</p>
                  <p className="text-sm font-medium text-foreground">
                    Wien, Österreich
                  </p>
                </div>
              </div>
            </div>

            {/* Technologien card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Technologien
              </h2>
              <div className="flex flex-wrap gap-2">
                {["React", "Node.js", "AWS"].map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent"
                  >
                    {tech}
                  </span>
                ))}
                {["PostgreSQL", "Kubernetes"].map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Aktivitäten card */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Aktivitäten
              </h2>
              <div className="flex flex-col gap-4">
                {/* Activity 1 - Green */}
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Letztkontakt
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score aktualisiert: 92 (HOT)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Heute, 14:30
                    </p>
                  </div>
                </div>

                {/* Activity 2 - Blue */}
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Score berechnet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Heute, 14:30
                    </p>
                  </div>
                </div>

                {/* Activity 3 - Yellow */}
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Profil angereichert
                    </p>
                    <p className="text-xs text-muted-foreground">Gestern</p>
                  </div>
                </div>

                {/* Activity 4 - Gray */}
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-score-poor-fit" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Kontaktdaten verifiziert
                    </p>
                    <p className="text-xs text-muted-foreground">23.03.2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
