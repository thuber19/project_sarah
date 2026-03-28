'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalCount: number
  pageSize: number
}

export function LeadPagination({ currentPage, totalCount, pageSize }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return null

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    router.replace(`/leads?${params.toString()}`)
  }

  // Generate visible page numbers (window of 5 centered on current)
  const pages: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <nav aria-label="Seitennavigation" className="flex items-center justify-between pb-6">
      <span className="text-sm text-muted-foreground">{totalCount} Leads total</span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            className={`flex min-h-12 min-w-12 items-center justify-center rounded-lg text-sm transition-colors ${
              page === currentPage
                ? 'bg-primary text-white'
                : 'border border-border text-foreground hover:bg-secondary'
            }`}
            aria-label={`Seite ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
