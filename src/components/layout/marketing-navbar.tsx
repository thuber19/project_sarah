'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
] as const

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="relative flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 lg:h-[72px] lg:px-20">
      <Link href="/" className="flex items-center">
        <Logo size="sm" className="lg:hidden" textClassName="font-bold text-foreground" />
        <Logo size="lg" className="hidden lg:flex" textClassName="font-bold text-foreground" />
      </Link>

      {/* Desktop nav */}
      <div className="hidden items-center gap-8 lg:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 lg:px-5 lg:py-2.5"
        >
          Kostenlos starten
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-foreground lg:hidden"
          aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="absolute left-0 top-16 z-50 w-full border-b border-border bg-white p-4 shadow-lg lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-12 items-center rounded-lg px-4 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
