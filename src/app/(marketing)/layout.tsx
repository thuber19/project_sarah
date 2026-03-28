import Link from 'next/link'
import { MarketingNavbar } from '@/components/layout/marketing-navbar'

const footerLinks = [
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/impressum', label: 'Impressum' },
  { href: '/kontakt', label: 'Kontakt' },
] as const

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-white px-4 py-6 lg:px-20 lg:py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-[13px] text-muted-foreground">
            &copy; 2026 Team Projekt Sarah
          </p>

          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
