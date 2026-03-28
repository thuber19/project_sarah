import { Skeleton } from '@/components/ui/skeleton'
import { AppTopbarSkeleton } from '@/components/layout/app-topbar'

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbarSkeleton />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-5 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Feed + Distribution */}
        <div className="flex h-[400px] gap-6">
          <div className="flex flex-1 flex-col rounded-xl border border-border bg-white p-5 space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="w-[340px] rounded-xl border border-border bg-white p-5 space-y-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 flex-1 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
