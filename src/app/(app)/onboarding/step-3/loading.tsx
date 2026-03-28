import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingStep3Loading() {
  return (
    <div className="flex w-full max-w-[700px] flex-col gap-7 rounded-xl border border-border bg-white p-9">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="flex flex-col gap-5">
        {/* Zielbranchen — label + tag pills */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>

        {/* Unternehmensgröße — label + select */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        {/* Region — label + checkboxes */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Technologie-Stack — label + tag pills */}
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>

        {/* Min. Score Threshold — label + slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  )
}
