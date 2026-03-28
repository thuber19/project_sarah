import { Suspense } from 'react'
import { Compass, Upload, Users } from 'lucide-react'
import { getLeadsAction } from '@/app/actions/leads.actions'
import { requireAuth } from '@/lib/supabase/server'
import { LeadSearchInput } from '@/components/leads/lead-search-input'
import { LeadExportButton } from '@/components/leads/lead-export-button'
import { ScoringButton } from '@/components/leads/scoring-button'
import { HubSpotBulkExport } from '@/components/leads/hubspot-bulk-export'
import { EmptyState } from '@/components/shared/empty-state'
import { AppTopbar } from '@/components/layout/app-topbar'
import { LeadsClient } from './leads-client'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const { user, supabase } = await requireAuth()
  const rawParams = await searchParams

  // Normalize searchParams to Record<string, string | undefined>
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  ) as Record<string, string | undefined>

  // Fetch leads + supporting data in parallel
  const [response, profileResult, qualifiedResult] = await Promise.all([
    getLeadsAction(params),
    supabase
      .from('business_profiles')
      .select('icp_settings')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('lead_scores')
      .select('lead_id')
      .eq('user_id', user.id)
      .in('grade', ['HOT', 'QUALIFIED', 'TOP_MATCH'])
      .limit(100),
  ])

  const { leads, totalCount } = response.success ? response.data : { leads: [], totalCount: 0 }
  const icpSettings = profileResult.data?.icp_settings as Record<string, unknown> | null
  const userIndustry = (icpSettings?.industries as string | undefined) ?? null
  const qualifiedLeadIds = (qualifiedResult.data ?? []).map((l) => l.lead_id)

  const grade = params.grade ?? 'ALL'
  const sort = params.sort ?? 'total_score'
  const dir = params.dir ?? 'desc'
  const page = Number(params.page ?? '1')
  const hasActiveFilters = grade !== 'ALL' || !!params.q
  const hasLeads = totalCount > 0 || hasActiveFilters

  // Build searchParams string for sort links in LeadTable
  const currentSearchParams = new URLSearchParams()
  if (params.grade) currentSearchParams.set('grade', params.grade)
  if (params.q) currentSearchParams.set('q', params.q)
  if (params.sort) currentSearchParams.set('sort', params.sort)
  if (params.dir) currentSearchParams.set('dir', params.dir)
  if (params.page) currentSearchParams.set('page', params.page)

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar
        title="Lead-Liste"
        actions={
          <>
            <ScoringButton userIndustry={userIndustry} />
            <HubSpotBulkExport qualifiedLeadIds={qualifiedLeadIds} />
            <LeadExportButton grade={grade} q={params.q} />
            <Suspense
              fallback={
                <div className="relative">
                  <div className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-muted-foreground">
                    Suchen...
                  </div>
                </div>
              }
            >
              <LeadSearchInput />
            </Suspense>
          </>
        }
      />

      {hasLeads ? (
        <LeadsClient
          leads={leads}
          totalCount={totalCount}
          currentPage={page}
          sort={sort}
          dir={dir}
          searchParams={currentSearchParams.toString()}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 lg:p-8">
          <EmptyState
            icon={Users}
            title="Noch keine Leads"
            description="Starte eine Lead Discovery oder importiere Leads manuell."
            primaryAction={{
              label: 'Discovery starten',
              href: '/discovery',
              icon: Compass,
            }}
            secondaryAction={{
              label: 'Leads importieren',
              href: '/leads/import',
              icon: Upload,
            }}
          />
        </div>
      )}
    </div>
  )
}
