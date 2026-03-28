'use client'

import {
  UserPlus,
  TrendingUp,
  RefreshCw,
  Search,
  TriangleAlert,
  Bell,
} from 'lucide-react'
import {
  markAllNotificationsReadAction,
  type NotificationGroup,
  type NotificationEntry,
} from '@/app/actions/agent-logs.actions'
import { useServerAction } from '@/hooks/use-server-action'
import { AppTopbar } from '@/components/layout/app-topbar'
import { MobileHeader } from '@/components/layout/mobile-header'

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  leads_discovered: UserPlus,
  lead_scored: TrendingUp,
  campaign_completed: RefreshCw,
  campaign_started: RefreshCw,
  query_optimized: Search,
  website_scraped: Search,
  website_analyzed: Search,
  campaign_failed: TriangleAlert,
}

interface NotificationsClientProps {
  groups: NotificationGroup[]
  variant: 'mobile' | 'desktop'
}

export function NotificationsClient({ groups, variant }: NotificationsClientProps) {
  const { execute: markAllRead, isPending } = useServerAction(
    markAllNotificationsReadAction,
    {
      successMessage: 'Alle Benachrichtigungen als gelesen markiert',
    },
  )

  const markAllReadButton = (
    <button
      type="button"
      onClick={() => markAllRead()}
      disabled={isPending}
      className="min-h-12 text-[13px] font-medium text-accent transition-colors hover:text-accent/80 disabled:opacity-50"
      aria-label="Alle Benachrichtigungen als gelesen markieren"
    >
      Alle lesen
    </button>
  )

  return (
    <>
      {variant === 'desktop' ? (
        <AppTopbar title="Benachrichtigungen" actions={markAllReadButton} />
      ) : (
        <MobileHeader
          title="Benachrichtigungen"
          backHref="/dashboard"
          actions={markAllReadButton}
        />
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
        {groups.map((group) => (
          <section key={group.label} aria-label={`Benachrichtigungen von ${group.label}`}>
            <h2 className="mb-2 px-1 text-[13px] font-semibold text-muted-foreground">
              {group.label}
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              {group.notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isLast={index === group.notifications.length - 1}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

interface NotificationItemProps {
  notification: NotificationEntry
  isLast: boolean
}

function NotificationItem({ notification, isLast }: NotificationItemProps) {
  const Icon = ICON_MAP[notification.actionType] ?? Bell

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-3 ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      {/* Colored dot */}
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.dotColor}`}
        aria-hidden="true"
      />

      {/* Icon */}
      <div className="flex shrink-0 items-center justify-center">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-foreground">{notification.message}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {notification.relativeTime}
        </p>
      </div>
    </div>
  )
}
