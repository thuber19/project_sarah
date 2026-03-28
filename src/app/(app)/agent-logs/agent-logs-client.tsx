"use client";

import { useState } from "react";
import {
  AlertCircle,
  Compass,
  Sparkles,
  Target,
} from "lucide-react";

type LogCategory = "Alle" | "Discovery" | "Scoring" | "Enrichment" | "Errors";
type LogStatus = "Erfolg" | "Fehler" | "Info";
type EventType = "Discovery" | "Scoring" | "Enrichment" | "Error";

export interface AgentLogEntry {
  id: string;
  time: string;
  type: EventType;
  message: string;
  status: LogStatus;
}

export interface AgentLogsStats {
  totalToday: number;
  successRate: number;
  lastActivity: string;
}

interface AgentLogsClientProps {
  logs: AgentLogEntry[];
  stats: AgentLogsStats;
}

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

export function AgentLogsClient({ logs, stats }: AgentLogsClientProps) {
  const [activeFilter, setActiveFilter] = useState<LogCategory>("Alle");

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === "Alle") return true;
    if (activeFilter === "Errors") return log.type === "Error";
    return log.type === activeFilter;
  });

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-white p-5">
          <span className="text-sm text-muted-foreground">Aktionen heute</span>
          <p className="mt-1 text-3xl font-bold text-foreground">{stats.totalToday}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <span className="text-sm text-muted-foreground">Erfolgsrate</span>
          <p className="mt-1 text-3xl font-bold text-success">{stats.successRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <span className="text-sm text-muted-foreground">Letzte Aktion</span>
          <p className="mt-1 text-3xl font-bold text-foreground">{stats.lastActivity}</p>
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
              key={log.id}
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
              </div>

              {/* Status badge */}
              {getStatusBadge(log.status)}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Keine Einträge für diesen Filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
