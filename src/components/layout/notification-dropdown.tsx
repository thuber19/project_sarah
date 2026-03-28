'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { getRecentNotificationsAction, type NotificationEntry } from '@/app/actions/agent-logs.actions'
import Link from 'next/link'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationEntry[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getRecentNotificationsAction().then((result) => {
      if (result.success) setNotifications(result.data)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasNotifications = notifications.length > 0

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Benachrichtigungen"
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {hasNotifications && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-score-hot" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] rounded-xl border border-border bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Benachrichtigungen</span>
            <Link
              href="/agent-logs"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-accent hover:underline"
            >
              Alle anzeigen
            </Link>
          </div>

          {/* Notification list */}
          {hasNotifications ? (
            <div className="flex flex-col">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    index < notifications.length - 1 ? 'border-b border-secondary' : ''
                  }`}
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.dotColor}`} />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">{notification.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{notification.relativeTime}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Noch keine Aktivitäten
            </p>
          )}
        </div>
      )}
    </div>
  )
}
