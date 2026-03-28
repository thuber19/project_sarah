import { Bell, Compass, Upload, Users } from 'lucide-react'
import { Suspense } from 'react'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadTable } from '@/components/leads/lead-table'
import { LeadsPagination } from '@/components/leads/leads-pagination'
import { LeadsSearch } from '@/components/leads/leads-search'
import { EmptyState } from '@/components/shared/empty-state'
import { getLeadsAction } from '@/app/actions/leads.actions'
import { createClient } from '@/lib/supabase/server'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const grade = typeof params.grade === 'string' ? params.grade : undefined
  const search = typeof params.search === 'string' ? params.search : undefined
  const sort = typeof params.sort === 'string' ? params.sort : undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'US'

  const result = await getLeadsAction({ page, grade, search, sort })
  const { leads, total, pageCount } = 'error' in result
    ? { leads: [], total: 0, pageCount: 1 }
    : result

  // Show empty state only when no leads exist at all (no active filter/search)
  const isFiltered = Boolean(grade || search)
  const showEmptyState = !isFiltered && total === 0 && !('error' in result)

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Lead-Liste</span>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <Upload className="h-4 w-4" />
            Export
          </button>

          <Suspense>
            <LeadsSearch />
          </Suspense>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {initials}
          </div>
        </div>
      </div>

      {showEmptyState ? (
        <div className="flex flex-1 items-center justify-center p-8">
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
      ) : (
        /* Content area */
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 pt-6">
          <Suspense>
            <LeadFilters />
          </Suspense>

          {'error' in result ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Leads konnten nicht geladen werden.
            </div>
          ) : (
            <LeadTable leads={leads} />
          )}

          <Suspense>
            <LeadsPagination page={page} pageCount={pageCount} total={total} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
