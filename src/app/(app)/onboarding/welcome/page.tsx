import Link from 'next/link'
import { Globe, Building2, Target, Rocket } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

const steps = [
  {
    icon: Globe,
    title: 'Website analysieren',
    description: 'Wir analysieren deine Website, um dein Unternehmen zu verstehen',
  },
  {
    icon: Building2,
    title: 'Business Profil',
    description: 'Ergänze dein Unternehmen, Branche und Zielregion',
  },
  {
    icon: Target,
    title: 'ICP definieren',
    description: 'Definiere dein ideales Kundenprofil für präzises Targeting',
  },
  {
    icon: Rocket,
    title: "Los geht's!",
    description: 'Sarah beginnt, passende Leads zu finden und zu qualifizieren',
  },
] as const

export default function OnboardingWelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 lg:px-0">
      <div className="flex w-full max-w-3xl flex-col items-center gap-10">
        <Logo size="lg" textClassName="font-bold text-foreground" />

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-2xl font-bold text-foreground">Willkommen bei Sarah!</h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Dein KI-gestützter Sales Agent für den DACH-Markt ist bereit. In nur 4 Schritten richten
            wir alles für dich ein.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-6 text-center"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-accent-light">
                <Icon className="size-6 text-accent" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/onboarding/step-1"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Einrichtung starten
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Überspringen
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">Dauert nur 4-5 Minuten</p>
      </div>
    </div>
  )
}
