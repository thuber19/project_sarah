'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RescoreButtonProps {
  leadIds: string[]
  onComplete?: () => void
}

interface ScoringProgress {
  current: number
  total: number
  leadId?: string
  score?: number
  grade?: string
}

export function RescoreButton({ leadIds, onComplete }: RescoreButtonProps) {
  const [isScoring, setIsScoring] = useState(false)
  const [progress, setProgress] = useState<ScoringProgress | null>(null)

  const handleRescore = useCallback(async () => {
    if (leadIds.length === 0) {
      toast.info('Keine Leads zum Bewerten')
      return
    }

    setIsScoring(true)
    setProgress({ current: 0, total: leadIds.length })

    try {
      const response = await fetch('/api/scoring/batch-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      })

      if (!response.ok) {
        throw new Error('Scoring fehlgeschlagen')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setProgress({
                  current: data.current,
                  total: data.total,
                  leadId: data.leadId,
                  score: data.score,
                  grade: data.grade,
                })
              } else if (data.type === 'done') {
                toast.success(`${data.scored} Leads erfolgreich gescored`)
                onComplete?.()
              }
            } catch {
              // Ignore parse errors from incomplete SSE chunks
            }
          }
        }
      }
    } catch {
      toast.error('Scoring fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setIsScoring(false)
      setProgress(null)
    }
  }, [leadIds, onComplete])

  return (
    <div className="space-y-2" aria-busy={isScoring}>
      <button
        onClick={handleRescore}
        disabled={isScoring || leadIds.length === 0}
        aria-disabled={isScoring || leadIds.length === 0}
        className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {isScoring ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        {isScoring ? 'Bewertung läuft...' : 'Regeln aktualisieren'}
      </button>

      <div role="status" aria-live="polite">
        {progress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Lead {progress.current} von {progress.total}
              </span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
