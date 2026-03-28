'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'

interface Notification {
  id: string
  message: string
  time: string
  dotColor: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    message: 'Neue Lead entdeckt: CloudTech GmbH',
    time: 'vor 5 Min.',
    dotColor: 'bg-success',
  },
  {
    id: '2',
    message: 'Score berechnet: TechVision → 92 (HOT)',
    time: 'vor 12 Min.',
    dotColor: 'bg-accent',
  },
  {
    id: '3',
    message: 'HubSpot-Sync abgeschlossen: 12 Leads',
    time: 'vor 28 Min.',
    dotColor: 'bg-accent',
  },
  {
    id: '4',
    message: 'Discovery abgeschlossen: 8 neue Leads',
    time: 'vor 1 Std.',
    dotColor: 'bg-success',
  },
  {
    id: '5',
    message: 'Lead-Status geändert: DataFlow AG → 85',
    time: 'vor 2 Std.',
    dotColor: 'bg-accent',
  },
  {
    id: '6',
    message: 'Neuer Kontakt: Maria Steiner, CTO',
    time: 'vor 3 Std.',
    dotColor: 'bg-success',
  },
]

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        {/* Unread indicator */}
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-score-hot" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] rounded-xl border border-border bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Benachrichtigungen</span>
            <button type="button" className="text-xs font-medium text-accent hover:underline">
              Alle lesen
            </button>
          </div>

          {/* Notification list */}
          <div className="flex flex-col">
            {mockNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  index < mockNotifications.length - 1 ? 'border-b border-secondary' : ''
                }`}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.dotColor}`} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{notification.message}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
