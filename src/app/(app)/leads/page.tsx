import { Bell, Search, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";

export default function LeadsPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Lead-Liste
        </span>

        <div className="flex items-center gap-4">
          {/* Export button */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <Upload className="h-4 w-4" />
            Export
          </button>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Leads durchsuchen"
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
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 pt-6">
        <LeadFilters />
        <LeadTable />

        {/* Pagination */}
        <div className="flex items-center justify-between pb-6">
          <span className="text-sm text-muted-foreground">
            127 Leads total
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary"
              aria-label="Vorherige Seite"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                  page === 1
                    ? "bg-primary text-white"
                    : "border border-border text-foreground hover:bg-secondary"
                }`}
                aria-label={`Seite ${page}`}
                aria-current={page === 1 ? "page" : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary"
              aria-label="Nächste Seite"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
