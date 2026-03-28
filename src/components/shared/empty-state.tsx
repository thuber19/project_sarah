import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  href: string
  icon?: LucideIcon
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  primaryAction: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const PrimaryIcon = primaryAction.icon
  const SecondaryIcon = secondaryAction?.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-6 rounded-xl border border-border bg-white p-12',
        className,
      )}
    >
      {/* Icon circle */}
      <div className="flex size-24 items-center justify-center rounded-full bg-accent-light">
        <Icon className="size-12 text-accent" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="max-w-[420px] text-center text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={primaryAction.href}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          {PrimaryIcon && <PrimaryIcon className="size-4" aria-hidden="true" />}
          {primaryAction.label}
        </Link>
        {secondaryAction && (
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {SecondaryIcon && <SecondaryIcon className="size-4" aria-hidden="true" />}
            {secondaryAction.label}
          </Link>
        )}
      </div>
    </div>
  )
}
