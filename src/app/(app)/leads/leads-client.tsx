'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadTable } from '@/components/leads/lead-table'
import { LeadPagination } from '@/components/leads/lead-pagination'
import { LeadFilterSheet, type LeadFilters as FilterValues } from '@/components/leads/lead-filter-sheet'
import { LeadBulkToolbar } from '@/components/leads/lead-bulk-toolbar'
import { PAGE_SIZE } from '@/lib/constants'
import type { LeadListItem } from '@/types/lead'

interface LeadsClientProps {
  leads: LeadListItem[]
  totalCount: number
  currentPage: number
  sort: string
  dir: string
  searchParams: string
}


export function LeadsClient({
  leads,
  totalCount,
  currentPage,
  sort,
  dir,
  searchParams,
}: LeadsClientProps) {
  const router = useRouter()
  const urlParams = useSearchParams()
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Build current filters from URL params
  const currentFilters: FilterValues = {
    scoreRange: [
      Number(urlParams.get('scoreMin') ?? '0'),
      Number(urlParams.get('scoreMax') ?? '100'),
    ],
    industries: urlParams.get('industries')?.split(',').filter(Boolean) ?? [],
    regions: urlParams.get('regions')?.split(',').filter(Boolean) ?? [],
    companySizes: urlParams.get('companySizes')?.split(',').filter(Boolean) ?? [],
  }

  function handleFilterApply(filters: FilterValues) {
    const params = new URLSearchParams(urlParams.toString())
    // Score range
    if (filters.scoreRange[0] > 0) {
      params.set('scoreMin', String(filters.scoreRange[0]))
    } else {
      params.delete('scoreMin')
    }
    if (filters.scoreRange[1] < 100) {
      params.set('scoreMax', String(filters.scoreRange[1]))
    } else {
      params.delete('scoreMax')
    }
    // Industries
    if (filters.industries.length > 0) {
      params.set('industries', filters.industries.join(','))
    } else {
      params.delete('industries')
    }
    // Regions
    if (filters.regions.length > 0) {
      params.set('regions', filters.regions.join(','))
    } else {
      params.delete('regions')
    }
    // Company sizes
    if (filters.companySizes.length > 0) {
      params.set('companySizes', filters.companySizes.join(','))
    } else {
      params.delete('companySizes')
    }
    params.delete('page')
    router.replace(`/leads?${params.toString()}`)
  }

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === leads.length) {
        return new Set()
      }
      return new Set(leads.map((l) => l.id))
    })
  }, [leads])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])


  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 lg:gap-5 lg:px-8 lg:pt-6">
      {/* Grade filters + mobile filter trigger */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <LeadFilters />
        </div>
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Erweiterte Filter öffnen"
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </div>

      {/* Bulk actions toolbar */}
      <LeadBulkToolbar
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
      />

      {/* Lead table with selection */}
      <LeadTable
        leads={leads}
        sort={sort}
        dir={dir}
        searchParams={searchParams}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleAll={handleToggleAll}
      />

      <LeadPagination currentPage={currentPage} totalCount={totalCount} pageSize={PAGE_SIZE} />

      {/* Mobile filter sheet */}
      <LeadFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={currentFilters}
        onApply={handleFilterApply}
      />
    </div>
  )
}
