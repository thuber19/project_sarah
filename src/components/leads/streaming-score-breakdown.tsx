'use client'

import {
  Building2,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  MessageSquare,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react'
import type { StreamingScoringData } from '@/hooks/use-streaming-score'

interface StreamingScoreBreakdownProps {
  data: StreamingScoringData | undefined
  isLoading: boolean
  isComplete: boolean
  progress: number
}

const ANALYSIS_SECTIONS = [
  { key: 'company_fit_analysis', label: 'Company Fit Analysis', icon: Building2 },
  { key: 'contact_fit_analysis', label: 'Contact Fit Analysis', icon: User },
  { key: 'buying_signals_analysis', label: 'Buying Signals Analysis', icon: TrendingUp },
  { key: 'timing_analysis', label: 'Timing Analysis', icon: Clock },
] as const

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sofort_kontaktieren: {
    bg: 'bg-score-hot-bg',
    text: 'text-score-hot-text',
    label: 'Sofort kontaktieren',
  },
  nurture: {
    bg: 'bg-score-qualified-bg',
    text: 'text-score-qualified-text',
    label: 'Nurture',
  },
  beobachten: {
    bg: 'bg-score-engaged-bg',
    text: 'text-score-engaged-text',
    label: 'Beobachten',
  },
  skip: {
    bg: 'bg-score-poor-fit-bg',
    text: 'text-score-poor-fit-text',
    label: 'Skip',
  },
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted h-4 ${className}`} />
}

export function StreamingScoreBreakdown({
  data,
  isLoading,
  isComplete,
  progress,
}: StreamingScoreBreakdownProps) {
  if (!data && !isLoading) return null

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Progress Bar — only visible during loading */}
      {isLoading && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              AI-Analyse l&auml;uft...
            </span>
            <span className="text-xs font-semibold text-accent">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Four Analysis Sections */}
      <div className="flex flex-col gap-3">
        {ANALYSIS_SECTIONS.map(({ key, label, icon: Icon }) => {
          const value = data?.[key]
          const hasValue = typeof value === 'string' && value.length > 0

          return (
            <div key={key} className="rounded-lg bg-secondary p-4">
              <div className="flex items-center gap-2 mb-1.5">
                {hasValue ? (
                  <CheckCircle2 className="size-3.5 text-success shrink-0" />
                ) : isLoading ? (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
              {hasValue ? (
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
              ) : isLoading ? (
                <div className="flex flex-col gap-2 mt-1">
                  <SkeletonLine className="w-full" />
                  <SkeletonLine className="w-3/4" />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* 3. AI Reasoning — highlighted box */}
      {(data?.reasoning || isLoading) && (
        <div className="rounded-lg border border-accent/20 bg-accent-light p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="size-3.5 text-accent shrink-0" />
            <span className="text-xs font-medium text-accent">Gesamtbewertung</span>
          </div>
          {data?.reasoning ? (
            <p className="text-sm text-foreground leading-relaxed">{data.reasoning}</p>
          ) : isLoading ? (
            <div className="flex flex-col gap-2 mt-1">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-5/6" />
              <SkeletonLine className="w-2/3" />
            </div>
          ) : null}
        </div>
      )}

      {/* 4. Recommendation — badge-style display */}
      {data?.recommendation && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="size-3.5" />
            Empfehlung
          </span>
          <div className="flex items-start gap-3">
            {(() => {
              const style = RECOMMENDATION_STYLES[data.recommendation] ?? {
                bg: 'bg-secondary',
                text: 'text-foreground',
                label: data.recommendation,
              }
              return (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
                >
                  {style.label}
                </span>
              )
            })()}
          </div>
          {data.recommendation_text && (
            <p className="text-sm text-foreground leading-relaxed">{data.recommendation_text}</p>
          )}
        </div>
      )}

      {/* 5. Key Insights — bulleted list, items appear one by one */}
      {data?.key_insights && data.key_insights.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Lightbulb className="size-3.5" />
            Key Insights
          </span>
          <ul className="flex flex-col gap-1.5">
            {data.key_insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. DACH Notes — optional, only when present */}
      {data?.dach_notes && (
        <div className="rounded-lg bg-secondary p-4">
          <span className="text-xs font-medium text-muted-foreground">DACH-Markt Hinweise</span>
          <p className="mt-1.5 text-sm text-foreground leading-relaxed">{data.dach_notes}</p>
        </div>
      )}

      {/* 7. Confidence — small percentage badge */}
      {typeof data?.confidence === 'number' && (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            {Math.round(data.confidence)}% Konfidenz
          </span>
          {isComplete && (
            <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
              <CheckCircle2 className="size-3" />
              Analyse abgeschlossen
            </span>
          )}
        </div>
      )}
    </div>
  )
}
