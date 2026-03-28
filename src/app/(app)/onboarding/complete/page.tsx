import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

const completionBadges = ['Firmenprofil', 'ICP-Kriterien', 'Zielbranche'] as const

export default function OnboardingCompletePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-12 lg:px-0">
      <div className="flex w-full max-w-lg flex-col items-center gap-8">
        <div className="flex size-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-12 text-green-600" aria-hidden="true" />
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-bold text-foreground">Onboarding abgeschlossen!</h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Sarah ist jetzt vollständig eingerichtet und bereit, deine ersten Leads zu
            identifizieren und qualifizieren.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          {completionBadges.map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3"
            >
              <CheckCircle2 className="size-4 shrink-0 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Zum Dashboard
          </Link>
          <Link
            href="/discovery"
            className="inline-flex min-h-12 items-center justify-center text-sm font-medium text-accent transition-colors hover:text-accent/80"
          >
            Erste Discovery starten
          </Link>
        </div>
      </div>
    </div>
  )
}
