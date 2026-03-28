import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateLinkAction {
  label: string
  href: string
  onClick?: never
  disabled?: never
  icon?: LucideIcon
}

interface EmptyStateButtonAction {
  label: string
  onClick: () => void
  href?: never
  disabled?: boolean
  icon?: LucideIcon
}

type EmptyStateAction = EmptyStateLinkAction | EmptyStateButtonAction

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
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-6 rounded-xl border border-border bg-white p-6 lg:p-12',
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

      <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
        <EmptyStateActionElement
          action={primaryAction}
          variant="primary"
        />
        {secondaryAction && (
          <EmptyStateActionElement
            action={secondaryAction}
            variant="secondary"
          />
        )}
      </div>
    </div>
  )
}

const primaryClasses =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50 sm:w-auto'
const secondaryClasses =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50 sm:w-auto'

function EmptyStateActionElement({
  action,
  variant,
}: {
  action: EmptyStateAction
  variant: 'primary' | 'secondary'
}) {
  const ActionIcon = action.icon
  const classes = variant === 'primary' ? primaryClasses : secondaryClasses

  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {ActionIcon && <ActionIcon className="size-4" aria-hidden="true" />}
        {action.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={classes}
    >
      {ActionIcon && <ActionIcon className="size-4" aria-hidden="true" />}
      {action.label}
    </button>
  )
}
