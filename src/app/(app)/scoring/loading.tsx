import { Skeleton } from '@/components/ui/skeleton'

export default function ScoringLoading() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <Skeleton className="h-5 w-36" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8 p-8">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Score Distribution card */}
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />

          <div className="flex flex-col gap-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-6 w-[100px] rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Rules card */}
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-72" />

          <div className="mt-2 flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex justify-end">
            <Skeleton className="h-10 w-44 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
