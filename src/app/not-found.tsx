import Link from 'next/link'
import { Bot, LayoutDashboard, Users, Compass } from 'lucide-react'

const quickLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'Discovery', href: '/discovery', icon: Compass },
] as const

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
          <Bot className="h-8 w-8 text-accent" />
        </div>

        {/* Status + Heading */}
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">404</p>
          <h1 className="text-2xl font-bold text-foreground">Seite nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <LayoutDashboard className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>

        {/* Quick links */}
        <div className="w-full rounded-xl border border-border bg-white p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">Häufig besucht</p>
          <div className="flex flex-col gap-1">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
