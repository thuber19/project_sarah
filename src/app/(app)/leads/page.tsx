import { Suspense } from 'react'
import { Compass, Upload, Users } from 'lucide-react'
import { getLeadsAction } from '@/app/actions/leads.actions'
import { requireAuth } from '@/lib/supabase/server'
import { PAGE_SIZE } from '@/lib/constants'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadTable } from '@/components/leads/lead-table'
import { LeadSearchInput } from '@/components/leads/lead-search-input'
import { LeadPagination } from '@/components/leads/lead-pagination'
import { LeadExportButton } from '@/components/leads/lead-export-button'
import { EmptyState } from '@/components/shared/empty-state'
import { AppTopbar } from '@/components/layout/app-topbar'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LeadsPage({ searchParams }: Props) {
  await requireAuth()
  const rawParams = await searchParams

  // Normalize searchParams to Record<string, string | undefined>
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  ) as Record<string, string | undefined>

  const response = await getLeadsAction(params)
  const { leads, totalCount } = response.success ? response.data : { leads: [], totalCount: 0 }

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
        /* Content area */
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 lg:gap-5 lg:px-8 lg:pt-6">
          <Suspense>
            <LeadFilters />
          </Suspense>

          <LeadTable
            leads={leads}
            sort={sort}
            dir={dir}
            searchParams={currentSearchParams.toString()}
          />

          <Suspense>
            <LeadPagination currentPage={page} totalCount={totalCount} pageSize={PAGE_SIZE} />
          </Suspense>
        </div>
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
