'use client'

import { Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { useStreamingScore } from '@/hooks/use-streaming-score'
import { StreamingScoreBreakdown } from './streaming-score-breakdown'

interface LeadStreamingAnalysisProps {
  leadId: string
  hasExistingScore: boolean
}

/**
 * A card component that allows users to trigger a detailed AI analysis
 * of a lead's scoring. Shows progressive streaming results.
 */
export function LeadStreamingAnalysis({ leadId, hasExistingScore }: LeadStreamingAnalysisProps) {
  const { data, isLoading, isComplete, progress, scoreLeadStream, reset } = useStreamingScore()

  function handleStart() {
    scoreLeadStream(leadId)
  }

  function handleRerun() {
    reset()
    scoreLeadStream(leadId)
  }

  const showButton = !isComplete
  const showRerun = isComplete && !isLoading

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-base font-semibold text-foreground">KI-Detailanalyse</h3>

      {!hasExistingScore && (
        <p className="mt-2 text-sm text-muted-foreground">
          Score diesen Lead zuerst, um eine detaillierte Analyse zu erhalten.
        </p>
      )}

      {hasExistingScore && showButton && (
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analysiert...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Analyse starten
            </>
          )}
        </button>
      )}

      <div aria-live="polite">
        {(data || isLoading) && (
          <div className="mt-4">
            <StreamingScoreBreakdown
              data={data}
              isLoading={isLoading}
              isComplete={isComplete}
              progress={progress}
            />
          </div>
        )}
      </div>

      {showRerun && (
        <button
          onClick={handleRerun}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Erneut analysieren
        </button>
      )}
    </div>
  )
}
