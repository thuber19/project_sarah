import { Skeleton } from '@/components/ui/skeleton'
import { AppTopbarSkeleton } from '@/components/layout/app-topbar'

export default function DiscoveryLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbarSkeleton />
      <div className="flex flex-1 gap-8 p-8">
        <div className="flex w-[320px] shrink-0 flex-col gap-6">
          <div className="rounded-xl border border-border bg-white p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-10 w-full rounded-lg mt-2" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
      </div>
    </div>
  )
}
