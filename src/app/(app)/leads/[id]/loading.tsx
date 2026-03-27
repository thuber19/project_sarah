import { Skeleton } from '@/components/ui/skeleton'

export default function LeadDetailLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <Skeleton className="h-5 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <Skeleton className="h-4 w-32" />

        <div className="mt-4 flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-12 w-16 ml-auto" />
            <Skeleton className="h-4 w-12 ml-auto" />
          </div>
        </div>

        <div className="mt-8 flex gap-8">
          <div className="flex flex-1 flex-col gap-8">
            <div className="rounded-xl border border-border bg-white p-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ))}
              <Skeleton className="h-20 w-full rounded-lg mt-2" />
            </div>
            <div className="rounded-xl border border-border bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-44" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-[340px] space-y-6">
            <div className="rounded-xl border border-border bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-36" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
