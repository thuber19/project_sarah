'use client'

import { Search, CircleCheck, Loader, Circle } from 'lucide-react'

const ANALYSIS_STEPS = [
  {
    label: 'Website-Struktur erkannt',
    status: 'done' as const,
  },
  {
    label: 'Branche wird analysiert',
    status: 'done' as const,
  },
  {
    label: 'Zielgruppe wird identifiziert...',
    status: 'loading' as const,
  },
  {
    label: 'Wettbewerber werden recherchiert...',
    status: 'pending' as const,
  },
]

export default function OnboardingAnalysisPage() {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12">
      {/* Circular progress indicator */}
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
          {/* Track */}
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
          {/* Progress fill — 70% of circumference */}
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34 * 0.7} ${2 * Math.PI * 34 * 0.3}`}
            className="transition-[stroke-dasharray] duration-1000 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="h-6 w-6 text-accent" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-center text-xl font-bold text-foreground">
        Sarah analysiert deine Website...
      </h1>

      {/* Subtitle */}
      <p className="text-center text-sm text-muted-foreground">Dies dauert nur einen Moment</p>

      {/* Progress bar */}
      <div className="mt-4 w-full">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-accent transition-[width] duration-1000 ease-in-out"
            style={{ width: '70%' }}
            role="progressbar"
            aria-valuenow={70}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Analyse-Fortschritt"
          />
        </div>
        <p className="mt-2 text-xs font-medium text-accent">70% abgeschlossen</p>
      </div>

      {/* Divider */}
      <div className="my-2 h-px w-full bg-border" />

      {/* Status checklist */}
      <div className="flex w-full flex-col gap-3">
        {ANALYSIS_STEPS.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            {step.status === 'done' && <CircleCheck className="h-5 w-5 shrink-0 text-success" />}
            {step.status === 'loading' && (
              <Loader className="h-5 w-5 shrink-0 animate-spin text-accent" />
            )}
            {step.status === 'pending' && <Circle className="h-5 w-5 shrink-0 text-border" />}
            <span
              className={`text-sm ${
                step.status === 'done'
                  ? 'text-foreground'
                  : step.status === 'loading'
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
