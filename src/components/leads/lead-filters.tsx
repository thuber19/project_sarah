"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

const GRADES = ['ALL', 'HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR_FIT'] as const

const GRADE_LABELS: Record<string, string> = {
  ALL: 'Alle',
  HOT: 'HOT',
  QUALIFIED: 'QUALIFIED',
  ENGAGED: 'ENGAGED',
  POTENTIAL: 'POTENTIAL',
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
    params.delete('page') // reset pagination on filter change
    router.replace(`/leads?${params.toString()}`)
  }

  return (
    <div role="group" aria-label="Leads nach Score-Grad filtern" className="flex flex-wrap gap-2">
      {GRADES.map((grade) => (
        <button
          key={grade}
          type="button"
          onClick={() => handleFilter(grade)}
          aria-pressed={active === grade}
          className={cn(
            "cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active === grade
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          {GRADE_LABELS[grade]}
        </button>
      ))}
    </div>
  )
}
