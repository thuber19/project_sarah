import { Compass, Play, Search, Settings2, Star } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { EmptyState } from '@/components/shared/empty-state'

interface HelpCardProps {
  step: string
  title: string
  description: string
  icon: React.ReactNode
}

function HelpCard({ step, title, description, icon }: HelpCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-white p-5">
      <div className="flex size-10 items-center justify-center rounded-lg bg-accent-light">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-accent">{step}</p>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export function DashboardEmpty() {
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Willkommen, Bernhard!</h1>
        <p className="text-sm text-muted-foreground">Lass uns deine ersten Leads finden.</p>
      </div>

      {/* Stats row — zeroed out */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Neue Leads" value="0" />
        <StatCard label="Qualifizierte Leads" value="0" />
        <StatCard label="Hot Leads" value="0" />
        <StatCard label="Durchschnitt Score" value="—" />
      </div>

      {/* Empty state card */}
      <EmptyState
        icon={Search}
        title="Noch keine Leads"
        description="Starte deine erste Lead Discovery, um qualifizierte Unternehmen im DACH-Raum zu finden."
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

      {/* Help cards */}
      <div className="grid grid-cols-3 gap-4">
        <HelpCard
          step="Schritt 1"
          title="ICP prüfen"
          description="Überprüfe dein Ideal Customer Profile und passe die Kriterien an."
          icon={<Settings2 className="size-5 text-accent" />}
        />
        <HelpCard
          step="Schritt 2"
          title="Discovery starten"
          description="Starte eine automatische Suche nach passenden Unternehmen."
          icon={<Compass className="size-5 text-accent" />}
        />
        <HelpCard
          step="Schritt 3"
          title="Leads bewerten"
          description="Bewerte und qualifiziere die gefundenen Leads mit Scoring-Daten."
          icon={<Star className="size-5 text-accent" />}
        />
      </div>
    </div>
  )
}
