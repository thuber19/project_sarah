"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bell,
  Bot,
  Compass,
  Play,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

type LogCategory = "Alle" | "Discovery" | "Scoring" | "Enrichment" | "Errors";
type LogStatus = "Erfolg" | "Fehler" | "Info";
type EventType = "Discovery" | "Scoring" | "Enrichment" | "Error";

interface LogEntry {
  time: string;
  type: EventType;
  message: string;
  detail?: string;
  status: LogStatus;
}

const mockLogs: LogEntry[] = [
  {
    time: "14:32:15",
    type: "Discovery",
    message: "Lead analysiert: CloudScale GmbH für Batch-4..",
    status: "Erfolg",
  },
  {
    time: "14:27:03",
    type: "Scoring",
    message: "Score berechnet: TechVentures GmbH = 92 (HOT)",
    status: "Erfolg",
  },
  {
    time: "14:19:52",
    type: "Enrichment",
    message: "Enrichment: DataFlow AG — 12 neue Datenpunkte",
    status: "Erfolg",
  },
  {
    time: "14:15:30",
    type: "Discovery",
    message: "Lead entdeckt: SecureNet Solutions via LinkedIn",
    status: "Erfolg",
  },
  {
    time: "14:09:24",
    type: "Error",
    message: "Rate Limit: Apollo API — Retry in 30s",
    status: "Fehler",
  },
  {
    time: "13:58:17",
    type: "Scoring",
    message: "Score berechnet: HelvetiaNet AG = 79 (QUALIFIED)",
    status: "Erfolg",
  },
  {
    time: "13:44:02",
    type: "Discovery",
    message: "Discovery: Batch München — 14 neue Leads gefunden",
    status: "Erfolg",
  },
  {
    time: "13:38:00",
    type: "Error",
    message: "API-Fehler: LinkedIn Rate Limit überschritten",
    status: "Fehler",
  },
  {
    time: "13:18:45",
    type: "Enrichment",
    message: "Enrichment: CloudScale GmbH — Kontakt verifiziert",
    status: "Erfolg",
  },
  {
    time: "13:07:25",
    type: "Scoring",
    message: "Score berechnet: BayernApp GmbH = 65 (ENGAGED)",
    status: "Erfolg",
  },
];

const filterTabs: LogCategory[] = [
  "Alle",
  "Discovery",
  "Scoring",
  "Enrichment",
  "Errors",
];

function getEventIcon(type: EventType) {
  switch (type) {
    case "Discovery":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <Compass className="h-4 w-4 text-accent" />
        </div>
      );
    case "Scoring":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
          <Target className="h-4 w-4 text-success" />
        </div>
      );
    case "Enrichment":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-50">
          <Sparkles className="h-4 w-4 text-warning" />
        </div>
      );
    case "Error":
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
      );
  }
}

function getStatusBadge(status: LogStatus) {
  switch (status) {
    case "Erfolg":
      return <span className="shrink-0 text-xs font-medium text-success">Erfolg</span>;
    case "Fehler":
      return <span className="shrink-0 text-xs font-medium text-destructive">Fehler</span>;
    case "Info":
      return <span className="shrink-0 text-xs font-medium text-accent">Info</span>;
  }
}

// TODO: Replace with real data check from Supabase
const hasLogs = true;

export default function AgentLogsPage() {
  const [activeFilter, setActiveFilter] = useState<LogCategory>("Alle");

  const filteredLogs = mockLogs.filter((log) => {
    if (activeFilter === "Alle") return true;
    if (activeFilter === "Errors") return log.type === "Error";
    return log.type === activeFilter;
  });

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Agent-Aktivitäten
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
            TH
          </div>
        </div>
      </div>

      {!hasLogs ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyState
            icon={Bot}
            title="Keine Agent-Aktivitäten"
            description="Sobald du eine Discovery startest, siehst du hier die Aktivitäten deiner KI-Agenten."
            primaryAction={{
              label: "Discovery starten",
              href: "/discovery",
              icon: Play,
            }}
          />
        </div>
      ) : (
      /* Content area */
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-white p-5">
            <span className="text-sm text-muted-foreground">Aktionen heute</span>
            <p className="mt-1 text-3xl font-bold text-foreground">156</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <span className="text-sm text-muted-foreground">Erfolgsrate</span>
            <p className="mt-1 text-3xl font-bold text-success">94.2%</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <span className="text-sm text-muted-foreground">Letzte Aktion</span>
            <p className="mt-1 text-3xl font-bold text-foreground">vor 2 Min.</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Activity timeline */}
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="flex flex-col">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.time}-${log.message}`}
                className={`flex items-start gap-4 px-6 py-4 ${
                  index < filteredLogs.length - 1 ? "border-b border-border" : ""
                }`}
              >
                {/* Timestamp */}
                <span className="w-[72px] shrink-0 pt-0.5 text-xs text-muted-foreground">
                  {log.time}
                </span>

                {/* Icon */}
                {getEventIcon(log.type)}

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm text-foreground">{log.message}</p>
                  {log.detail && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {log.detail}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                {getStatusBadge(log.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
