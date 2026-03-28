import { Skeleton } from '@/components/ui/skeleton'
import { AppTopbarSkeleton } from '@/components/layout/app-topbar'

export default function LeadsLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbarSkeleton />

      <div className="flex flex-1 flex-col gap-4 p-8">
        {/* Filters */}
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-lg" />
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="border-b border-border px-5 py-3 flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
