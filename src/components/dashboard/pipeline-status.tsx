import Link from 'next/link'
import { ArrowRight, Compass, Sparkles, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PipelineStatusProps {
  discovered: number
  scored: number
  contacted: number
}

const steps = [
  {
    key: 'discovered' as const,
    label: 'Discovered',
    icon: Compass,
    color: 'text-accent',
    bg: 'bg-accent-light',
  },
  {
    key: 'scored' as const,
    label: 'Scored',
    icon: Sparkles,
    color: 'text-score-engaged',
    bg: 'bg-yellow-50',
  },
  {
    key: 'contacted' as const,
    label: 'Contacted',
    icon: Mail,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    placeholder: true,
  },
]

export function PipelineStatus({ discovered, scored, contacted }: PipelineStatusProps) {
  return (
    <div className="rounded-[--radius-card] border border-border bg-white p-5">
      <h3 className="mb-4 text-[15px] font-semibold text-foreground">Pipeline-Status</h3>

      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const count = step.key === 'discovered' ? discovered : step.key === 'scored' ? scored : contacted

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border p-4">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', step.bg)} aria-hidden="true">
                  <Icon className={cn('h-4 w-4', step.color)} />
                </div>
                <span
                  className={cn(
                    'text-2xl font-bold',
                    step.placeholder ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {step.placeholder ? '—' : count}
                </span>
                <span className="text-xs text-muted-foreground">{step.label}</span>
              </div>

              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-border" aria-hidden="true" />}
            </div>
          )
        })}
      </div>

      {/* CTA based on pipeline state */}
      {discovered === 0 ? (
        <Link
          href="/discovery"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <Compass className="h-4 w-4" />
          Discovery starten
        </Link>
      ) : discovered > scored ? (
        <Link
          href="/scoring"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <Sparkles className="h-4 w-4" />
          {discovered - scored} {discovered - scored === 1 ? 'Lead wartet' : 'Leads warten'} auf Scoring → Jetzt bewerten
        </Link>
      ) : null}
    </div>
  )
}
