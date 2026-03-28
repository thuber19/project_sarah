'use client'

import { Lightbulb, Swords, TrendingUp, RefreshCw } from 'lucide-react'
import { AppTopbar } from '@/components/layout/app-topbar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Competitor {
  name: string
  score: number
  strength: number
  overlap: number
  threat: 'Hoch' | 'Mittel' | 'Niedrig'
}

const mockCompetitors: Competitor[] = [
  { name: 'Dealfront', score: 87, strength: 82, overlap: 74, threat: 'Hoch' },
  { name: 'Cognism', score: 79, strength: 68, overlap: 61, threat: 'Mittel' },
  { name: 'Apollo.io', score: 91, strength: 90, overlap: 45, threat: 'Mittel' },
  { name: 'Lusha', score: 72, strength: 55, overlap: 38, threat: 'Niedrig' },
  { name: 'Echobot', score: 65, strength: 48, overlap: 82, threat: 'Hoch' },
]

const threatColors: Record<Competitor['threat'], string> = {
  Hoch: 'bg-red-100 text-red-700',
  Mittel: 'bg-yellow-100 text-yellow-700',
  Niedrig: 'bg-green-100 text-green-700',
}

const recommendations = [
  {
    icon: Lightbulb,
    title: 'Differenzierung',
    description:
      'Durch spezialisierte KI-Lösungen für B2B-Vertrieb gibt es klare Alleinstellungsmerkmale im Markt. Wettbewerbsvorteil simplifizieren!',
  },
  {
    icon: Swords,
    title: 'Wettbewerb',
    description:
      'Direkte Konkurrenz durch größere Plattformen. Marktpositionierung als Spezialisten-Tool fokussieren.',
  },
  {
    icon: TrendingUp,
    title: 'Marktchance',
    description:
      'Kein Wettbewerber deckt den DACH-Markt spezialisiert ab. Hier liegt eine große Marktchance.',
  },
] as const

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-border">
        <div
          className={`h-2 rounded-full ${className ?? 'bg-accent'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">{value}%</span>
    </div>
  )
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{competitor.name}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${threatColors[competitor.threat]}`}
        >
          {competitor.threat}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Score</span>
        <span className="text-sm font-semibold text-foreground">{competitor.score}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <span className="text-xs text-muted-foreground">Stärke</span>
          <ProgressBar value={competitor.strength} />
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Überlappung</span>
          <ProgressBar value={competitor.overlap} className="bg-amber-500" />
        </div>
      </div>
    </div>
  )
}

export function CompetitorClient() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Wettbewerbsanalyse" />

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-8">
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground">
            SaaS / Cloud Services — DACH
          </span>
          <span className="rounded-lg bg-accent-light px-3 py-1.5 text-xs font-medium text-accent">
            KI-gestützt
          </span>
        </div>

        {/* Main two-column layout */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column — Competitor Table */}
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-base font-semibold text-foreground">
              Unternehmen und Marktpositionsvergleich
            </h2>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-white lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Unternehmen
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Score
                    </TableHead>
                    <TableHead className="min-w-[140px] text-xs font-medium uppercase text-muted-foreground">
                      Stärke
                    </TableHead>
                    <TableHead className="min-w-[140px] text-xs font-medium uppercase text-muted-foreground">
                      Überlappung
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">
                      Bedrohung
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCompetitors.map((competitor) => (
                    <TableRow key={competitor.name}>
                      <TableCell className="text-sm font-medium text-foreground">
                        {competitor.name}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {competitor.score}
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={competitor.strength} />
                      </TableCell>
                      <TableCell>
                        <ProgressBar value={competitor.overlap} className="bg-amber-500" />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${threatColors[competitor.threat]}`}
                        >
                          {competitor.threat}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card view */}
            <div className="flex flex-col gap-3 lg:hidden">
              {mockCompetitors.map((competitor) => (
                <CompetitorCard key={competitor.name} competitor={competitor} />
              ))}
            </div>
          </div>

          {/* Right column — KI-Empfehlungen */}
          <div className="flex w-full flex-col gap-4 lg:w-[360px] lg:shrink-0">
            <h2 className="text-base font-semibold text-foreground">KI-Empfehlungen</h2>

            <div className="flex flex-col gap-3">
              {recommendations.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-xl border border-border bg-white p-5"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-light">
                    <Icon className="size-5 text-accent" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Overview Card */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Marktübersicht</h2>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Identifizierte Wettbewerber</span>
              <span className="text-xl font-bold text-foreground">5</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Marktüberlappung</span>
              <span className="text-xl font-bold text-foreground">68%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Marktbewertung</span>
              <span className="text-xl font-bold text-foreground">B von 5</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Letzte Analyse</span>
              <span className="text-xl font-bold text-foreground">28.03.2026</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Analyse aktualisieren
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
