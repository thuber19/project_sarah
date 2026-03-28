import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingStep4Loading() {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12 pt-12 pb-10">
      {/* Icon circle */}
      <Skeleton className="h-[72px] w-[72px] rounded-full" />

      {/* Title */}
      <Skeleton className="h-6 w-40" />

      {/* Description */}
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Summary card */}
      <div className="flex w-full flex-col gap-1.5 rounded-lg bg-muted p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Primary button */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Secondary button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}
