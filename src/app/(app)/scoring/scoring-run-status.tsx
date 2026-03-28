'use client'

import { useState, useEffect, useTransition } from 'react'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { getRunById, type ScoringRun } from '@/app/actions/scoring.actions'

const POLL_INTERVAL_MS = 3000

interface Props {
  initialRun: ScoringRun | null
}

export function ScoringRunStatus({ initialRun }: Props) {
  const [run, setRun] = useState<ScoringRun | null>(initialRun)
  const [isStarting, startTransition] = useTransition()

  // Poll while running
  useEffect(() => {
    if (!run || run.status !== 'running') return

    const id = setInterval(() => {
      startTransition(async () => {
        const updated = await getRunById(run.id)
        if (!updated) return
        setRun(updated)

        if (updated.status === 'completed') {
          clearInterval(id)
          toast.success(`Scoring abgeschlossen — ${updated.scored_leads} Leads bewertet`)
        } else if (updated.status === 'failed') {
          clearInterval(id)
          toast.error('Scoring fehlgeschlagen. Bitte versuche es erneut.')
        }
      })
    }, POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [run])

  async function handleStart() {
    startTransition(async () => {
      const res = await fetch('/api/scoring/run', { method: 'POST' })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        toast.error(body.error ?? 'Scoring konnte nicht gestartet werden.')
        return
      }
      const data = (await res.json()) as { runId: string; totalLeads: number }
      setRun({
        id: data.runId,
        status: 'running',
        total_leads: data.totalLeads,
        scored_leads: 0,
        failed_leads: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
      })
    })
  }

  if (run?.status === 'running') {
    const progress =
      run.total_leads > 0 ? Math.round((run.scored_leads / run.total_leads) * 100) : 0

    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-lg border border-border bg-accent-light px-4 py-3 text-sm"
      >
        <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
        <span className="text-foreground">
          Scoring läuft…{' '}
          <span className="font-semibold text-accent">
            {run.scored_leads}/{run.total_leads} Leads ({progress}%)
          </span>
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={isStarting}
      onClick={handleStart}
      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {isStarting ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Play className="size-4" aria-hidden="true" />
      )}
      Alle Leads neu bewerten
    </button>
  )
}
