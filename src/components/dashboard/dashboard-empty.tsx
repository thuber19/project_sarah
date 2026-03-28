import Link from 'next/link'
import { Compass, Play, Search, Settings, Sparkles } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { EmptyState } from '@/components/shared/empty-state'

const hintCards = [
  {
    icon: Settings,
    title: 'Profil vervollständigen',
    description: 'Ergänze dein Firmenprofil und ICP, damit der Agent passende Leads findet.',
    href: '/settings',
    cta: 'Einstellungen öffnen',
  },
  {
    icon: Compass,
    title: 'Erste Discovery starten',
    description: 'Starte eine Lead-Suche basierend auf deinem Ideal Customer Profile.',
    href: '/discovery',
    cta: 'Discovery starten',
  },
  {
    icon: Sparkles,
    title: 'Scoring verstehen',
    description: 'Erfahre, wie der AI-Score deine Leads nach Relevanz bewertet.',
    href: '/scoring',
    cta: 'Scoring ansehen',
  },
] as const

export function DashboardEmpty() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 lg:gap-6 lg:px-8 lg:py-8">
      {/* Welcome — reuses shared EmptyState */}
      <EmptyState
        icon={Search}
        title="Willkommen bei Sarah"
        description="Dein AI Sales Agent ist bereit. Starte deine erste Lead-Discovery, um das Dashboard mit Daten zu füllen."
        primaryAction={{
          label: 'Erste Discovery starten',
          href: '/discovery',
          icon: Play,
        }}
        secondaryAction={{
          label: 'ICP anpassen',
          href: '/settings?tab=icp',
        }}
      />

      {/* Zero stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Leads gesamt" value="0" changeType="neutral" />
        <StatCard label="Qualifizierte Leads" value="0" changeType="neutral" />
        <StatCard label="Hot Leads" value="0" changeType="neutral" />
        <StatCard label="Ø Score" value="—" change="Noch keine Scores" changeType="neutral" />
      </div>

      {/* Onboarding hint cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {hintCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-accent lg:p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
              <card.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-accent group-hover:underline">
              {card.cta} &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
