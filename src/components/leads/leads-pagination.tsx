'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  pageCount: number
  total: number
}

export function LeadsPagination({ page, pageCount, total }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  // Show max 5 page numbers centered around current page
  const start = Math.max(1, Math.min(page - 2, pageCount - 4))
  const end = Math.min(pageCount, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="flex items-center justify-between pb-6">
      <span className="text-sm text-muted-foreground">{total} Leads gesamt</span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          aria-label="Vorherige Seite"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => goTo(p)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors',
              p === page
                ? 'bg-primary text-white'
                : 'border border-border text-foreground hover:bg-secondary',
            )}
            aria-label={`Seite ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          aria-label="Nächste Seite"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
