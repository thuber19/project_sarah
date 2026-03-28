import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingStep2Loading() {
  return (
    <div className="flex w-full max-w-[700px] flex-col gap-6 rounded-xl border border-border bg-white p-8">
      {/* Header with icon + title */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-80" />

      {/* Field rows */}
      <div className="flex flex-col gap-4">
        {/* Unternehmensname */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-4 w-[140px] shrink-0" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Branche (tag) */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-4 w-[140px] shrink-0" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>

        {/* Zielmarkt */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-4 w-[140px] shrink-0" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Produkt */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-4 w-[140px] shrink-0" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Value Proposition */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-4 w-[140px] shrink-0" />
          <Skeleton className="h-4 w-56" />
        </div>

        {/* Beschreibung */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-4 w-[140px] shrink-0" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <Skeleton className="h-px w-full" />

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
    </div>
  )
}
