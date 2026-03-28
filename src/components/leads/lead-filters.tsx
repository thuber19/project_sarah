'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

const GRADE_FILTERS = [
  { label: 'Alle', value: '' },
  { label: 'HOT', value: 'HOT' },
  { label: 'QUALIFIED', value: 'QUALIFIED' },
  { label: 'ENGAGED', value: 'ENGAGED' },
  { label: 'POTENTIAL', value: 'POTENTIAL' },
  { label: 'POOR', value: 'POOR' },
] as const

const SORT_OPTIONS = [
  { label: 'Neueste', value: 'date_desc' },
  { label: 'Name A–Z', value: 'name_asc' },
] as const

export function LeadFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeGrade = searchParams.get('grade') ?? ''
  const activeSort = searchParams.get('sort') ?? 'date_desc'

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 on filter/sort change
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Grade filters */}
      <div className="flex gap-2">
        {GRADE_FILTERS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            onClick={() => updateParam('grade', value)}
            className={cn(
              'cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              activeGrade === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={activeSort}
        onChange={(e) => updateParam('sort', e.target.value)}
        className="ml-auto rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Sortierung"
      >
        {SORT_OPTIONS.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
