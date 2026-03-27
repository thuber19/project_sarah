import { Bell, Search } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { ScoreDistribution } from "@/components/dashboard/score-distribution";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Dashboard
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
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Neue Leads"
            value="127"
            change="+12%"
            changeType="positive"
            changeBgColor="#DCFCE7"
          />
          <StatCard
            label="Qualifizierte Leads"
            value="43"
            change="+4%"
            changeType="positive"
          />
          <StatCard
            label="Hot Leads"
            value="12"
            change="+3"
            changeType="negative"
            changeBgColor="#FEE2E2"
          />
          <StatCard
            label="Durchschnitt Score"
            value="67.4"
            change="Mittel"
            changeType="neutral"
            changeBgColor="#DBEAFE"
          />
        </div>

        {/* Bottom row: Live Feed + Score Distribution */}
        <div className="flex h-[400px] gap-6">
          <LiveFeed />
          <ScoreDistribution />
        </div>
      </div>
    </div>
  );
}
