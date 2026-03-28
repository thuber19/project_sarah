'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getActiveRun, getRunById, type ScoringRun } from '@/app/actions/scoring.actions'

const POLL_INTERVAL_MS = 3000

interface Props {
  initialRun: ScoringRun | null
}

export function ScoringProgressBanner({ initialRun }: Props) {
  const [run, setRun] = useState<ScoringRun | null>(initialRun)
  const [dismissed, setDismissed] = useState(false)
  const [, startTransition] = useTransition()

  // Poll for active run if none initially
  useEffect(() => {
    if (!run && !dismissed) {
      const id = setInterval(() => {
        startTransition(async () => {
          const active = await getActiveRun()
          if (active) setRun(active)
        })
      }, POLL_INTERVAL_MS)
      return () => clearInterval(id)
    }
  }, [run, dismissed])

  // Poll progress while running
  useEffect(() => {
    if (!run || run.status !== 'running') return

    const id = setInterval(() => {
      startTransition(async () => {
        const updated = await getRunById(run.id)
        if (!updated) return

        setRun(updated)

        if (updated.status === 'completed') {
          clearInterval(id)
          toast.success(`Scoring abgeschlossen — ${updated.scored_leads} Leads bewertet`, {
            action: {
              label: 'Zur Übersicht',
              onClick: () => (window.location.href = '/scoring'),
            },
            duration: 8000,
          })
          // Hide banner after short delay
          setTimeout(() => setRun(null), 500)
        } else if (updated.status === 'failed') {
          clearInterval(id)
          toast.error('Scoring fehlgeschlagen. Bitte versuche es erneut.')
          setTimeout(() => setRun(null), 500)
        }
      })
    }, POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [run])

  if (!run || run.status !== 'running' || dismissed) return null

  const progress =
    run.total_leads > 0 ? Math.round((run.scored_leads / run.total_leads) * 100) : 0

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between bg-accent px-4 py-2 text-sm text-white"
    >
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>
          Scoring läuft…{' '}
          <span className="font-semibold">
            {run.scored_leads}/{run.total_leads} Leads
          </span>{' '}
          ({progress}%)
        </span>
        <Link href="/scoring" className="underline underline-offset-2 hover:no-underline">
          Zur Scoring-Seite
        </Link>
      </div>
      <button
        type="button"
        aria-label="Banner schließen"
        onClick={() => setDismissed(true)}
        className="rounded p-0.5 hover:bg-white/20"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
