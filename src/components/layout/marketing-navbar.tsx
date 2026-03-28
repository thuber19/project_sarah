import Link from 'next/link'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
] as const

export function MarketingNavbar() {
  return (
    <nav className="flex h-[72px] w-full items-center justify-between border-b border-border bg-white px-20">
      <Link href="/" className="text-2xl font-bold text-foreground">
        Sarah
      </Link>

      <div className="flex items-center gap-8">
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

      <Link
        href="/login"
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Kostenlos starten
      </Link>
    </nav>
  )
}
