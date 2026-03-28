'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Compass, Target, Settings } from 'lucide-react'

const tabs = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'Discovery', href: '/discovery', icon: Compass },
  { label: 'Scoring', href: '/scoring', icon: Target },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="flex h-14 items-center justify-around">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-accent'
                  : 'text-sidebar-muted hover:text-sidebar-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
