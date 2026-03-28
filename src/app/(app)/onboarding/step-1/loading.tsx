import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingStep1Loading() {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12 pt-12 pb-10">
      {/* Icon circle */}
      <Skeleton className="h-[72px] w-[72px] rounded-full" />

      {/* Title */}
      <Skeleton className="h-6 w-72" />

      {/* Description */}
      <div className="flex flex-col items-center gap-1.5">
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* URL input field */}
      <div className="flex w-full flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Submit button */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Footer text */}
      <Skeleton className="h-3 w-52" />
    </div>
  )
}
