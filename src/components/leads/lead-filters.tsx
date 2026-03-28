'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const GRADES = ['ALL', 'TOP_MATCH', 'GOOD_FIT', 'POOR_FIT'] as const

const GRADE_LABELS: Record<string, string> = {
  ALL: 'Alle',
  TOP_MATCH: 'TOP MATCH',
  GOOD_FIT: 'GOOD FIT',
  POOR_FIT: 'POOR FIT',
}

export function LeadFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('grade') ?? 'ALL'

  function handleFilter(grade: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (grade === 'ALL') {
      params.delete('grade')
    } else {
      params.set('grade', grade)
    }
    params.delete('page')
    router.replace(`/leads?${params.toString()}`)
  }

  return (
    <div role="group" aria-label="Leads nach Score-Grad filtern" className="flex flex-nowrap gap-2 overflow-x-auto lg:flex-wrap">
      {GRADES.map((grade) => (
        <button
          key={grade}
          type="button"
          onClick={() => handleFilter(grade)}
          aria-pressed={active === grade}
          className={cn(
            'shrink-0 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors lg:py-1.5',
            active === grade
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          )}
        >
          {GRADE_LABELS[grade]}
        </button>
      ))}
    </div>
  )
}
