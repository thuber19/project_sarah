'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import {
  Bot,
  LayoutDashboard,
  Users,
  Compass,
  Target,
  Activity,
  Share2,
  Settings,
  LogOut,
} from 'lucide-react'
import { signOutAction } from '@/app/actions/auth.actions'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'Discovery', href: '/discovery', icon: Compass },
  { label: 'Scoring', href: '/scoring', icon: Target },
  { label: 'Agent Logs', href: '/agent-logs', icon: Activity },
  { label: 'Export & CRM', href: '/export', icon: Share2 },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

interface AppSidebarProps {
  displayName: string
  email: string
  initials: string
}

export function AppSidebar({ displayName, email, initials }: AppSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col justify-between bg-sidebar px-4 py-6">
      {/* Top: Logo + Navigation */}
      <div>
        <div className="flex items-center gap-2.5 px-3 pb-8">
          <Bot className="size-6 text-accent" aria-hidden="true" />
          <span className="text-lg font-bold text-white">Sarah</span>
        </div>

        <nav aria-label="Hauptnavigation">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom: User info + Logout */}
      <div className="flex items-center gap-3 rounded-lg px-2 py-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent"
          aria-hidden="true"
        >
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-white">{displayName}</p>
          <p className="truncate text-[11px] text-sidebar-muted">{email}</p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground disabled:opacity-50"
          aria-label="Abmelden"
          title="Abmelden"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      {/* Legal links */}
      <div className="flex gap-3 px-2 pb-1">
        <Link
          href="/impressum"
          className="text-[10px] text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          Impressum
        </Link>
        <Link
          href="/datenschutz"
          className="text-[10px] text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        >
          Datenschutz
        </Link>
      </div>
    </aside>
  )
}
