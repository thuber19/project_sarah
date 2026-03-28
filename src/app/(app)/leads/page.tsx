import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ScoringButton } from "@/components/leads/scoring-button";
import { requireAuth } from "@/lib/supabase/server";

export default async function LeadsPage() {
  const { user, supabase } = await requireAuth();

  // Fetch user industry for premium modal context
  const { data: profile } = await supabase
    .from("business_profiles")
    .select("icp_settings")
    .eq("user_id", user.id)
    .maybeSingle();

  const icpSettings = profile?.icp_settings as Record<string, unknown> | null;
  const userIndustry = (icpSettings?.industries as string | undefined) ?? null;

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar
        title="Lead-Liste"
        actions={
          <div className="flex items-center gap-2">
            <ScoringButton userIndustry={userIndustry} />
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <Upload className="h-4 w-4" />
              Export
            </button>
          </div>
        }
      />

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 pt-6">
        <LeadFilters />
        <LeadTable />

        {/* Pagination */}
        <nav aria-label="Seitennavigation" className="flex items-center justify-between pb-6">
          <span className="text-sm text-muted-foreground">
            127 Leads total
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary"
              aria-label="Vorherige Seite"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-lg text-sm transition-colors ${
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
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary"
              aria-label="Nächste Seite"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
