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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[48px] min-h-[48px] ${
                isActive ? 'text-accent' : 'text-muted-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
