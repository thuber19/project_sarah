import { Skeleton } from '@/components/ui/skeleton'
import { AppTopbarSkeleton } from '@/components/layout/app-topbar'

export default function SettingsLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbarSkeleton />

      <div className="flex flex-1 flex-col gap-6 p-8">
        {/* Page heading */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border pb-px">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-t-lg" />
          ))}
        </div>

        {/* Form fields card */}
        <div className="rounded-xl border border-border bg-white p-6 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
