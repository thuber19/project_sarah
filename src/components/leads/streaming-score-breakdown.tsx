'use client'

import { Loader2 } from 'lucide-react'
import type { StreamingScoringData } from '@/hooks/use-streaming-score'

interface StreamingScoreBreakdownProps {
  data?: StreamingScoringData
  isLoading: boolean
}

const SECTIONS = [
  { key: 'company_fit_analysis', label: 'Company Fit' },
  { key: 'contact_fit_analysis', label: 'Contact Fit' },
  { key: 'buying_signals_analysis', label: 'Kaufsignale' },
  { key: 'timing_analysis', label: 'Timing' },
] as const

export function StreamingScoreBreakdown({ data, isLoading }: StreamingScoreBreakdownProps) {
  if (!data && !isLoading) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">AI-Analyse (Live)</h3>

      {SECTIONS.map(({ key, label }) => {
        const value = data?.[key]
        return (
          <div key={key} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {!value && isLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : value ? (
                <div className="size-2 rounded-full bg-green-500" />
              ) : (
                <div className="size-2 rounded-full bg-muted" />
              )}
              {label}
            </div>
            {value && <p className="mt-1 text-sm text-foreground">{value}</p>}
          </div>
        )
      })}

      {data?.reasoning && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-xs font-medium text-accent">Gesamtbewertung</p>
          <p className="mt-1 text-sm text-foreground">{data.reasoning}</p>
        </div>
      )}

      {data?.recommendation_text && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Empfehlung: {data.recommendation}
          </p>
          <p className="mt-1 text-sm text-foreground">{data.recommendation_text}</p>
        </div>
      )}
    </div>
  )
}
