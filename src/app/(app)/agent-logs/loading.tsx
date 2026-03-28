import { Skeleton } from '@/components/ui/skeleton'
import { AppTopbarSkeleton } from '@/components/layout/app-topbar'

export default function AgentLogsLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbarSkeleton />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-5 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>

        {/* Activity timeline */}
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 px-6 py-4 ${
                i < 7 ? 'border-b border-border' : ''
              }`}
            >
              {/* Timestamp */}
              <Skeleton className="h-4 w-[72px] shrink-0" />

              {/* Icon */}
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

              {/* Content */}
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Status badge */}
              <Skeleton className="h-4 w-14 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
