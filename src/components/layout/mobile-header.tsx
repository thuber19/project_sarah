'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { NotificationBell } from '@/components/layout/notification-dropdown'

interface MobileHeaderProps {
  title?: string
  backHref?: string
  actions?: React.ReactNode
  showLogo?: boolean
}

export function MobileHeader({
  title,
  backHref,
  actions,
  showLogo = false,
}: MobileHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:hidden">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
            aria-label="Zurück"
          >
            <ArrowLeft className="size-5" />
          </Link>
        )}
        {showLogo && <Logo size="sm" textClassName="font-bold text-foreground" />}
        {title && !showLogo && (
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <NotificationBell />
      </div>
    </header>
  )
}
