'use client'

import { NotificationBell } from '@/components/layout/notification-dropdown'

interface AppTopbarProps {
  title: string
  actions?: React.ReactNode
  initials?: string
}

export function AppTopbar({ title, actions, initials = 'BG' }: AppTopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:h-16 lg:px-8">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {actions}

        <NotificationBell />

        <div
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-accent text-xs font-medium text-white"
          aria-label="Benutzermenü"
        >
          {initials}
        </div>
      </div>
    </header>
  )
}

export function AppTopbarSkeleton() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="flex items-center gap-4">
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <div className="size-8 animate-pulse rounded-full bg-muted" />
      </div>
    </header>
  )
}
