'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Search, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface LeadResearchProps {
  leadId: string
  cachedReport?: string | null
}

export function LeadResearch({ leadId, cachedReport }: LeadResearchProps) {
  const [report, setReport] = useState(cachedReport || '')
  const [isCached, setIsCached] = useState(!!cachedReport)

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/research/stream',
    body: { leadId },
    onFinish: (_prompt, completion) => {
      setReport(completion)
      setIsCached(false)
    },
    onError: () => toast.error('Research konnte nicht durchgeführt werden'),
  })

  const displayText = isLoading ? completion : report

  function handleResearch() {
    setIsCached(false)
    complete('')
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6" aria-busy={isLoading}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Lead-Recherche</h3>
        <button
          onClick={handleResearch}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" role="status" aria-label="Recherche läuft" />
          ) : report ? (
            <RefreshCw className="size-3.5" />
          ) : (
            <Search className="size-3.5" />
          )}
          {report ? 'Erneut recherchieren' : 'Lead recherchieren'}
        </button>
      </div>

      {isCached && report && (
        <p className="mt-2 text-xs text-muted-foreground">Gespeicherter Report (max. 7 Tage alt)</p>
      )}

      {displayText && (
        <div
          className="mt-4 max-h-96 overflow-auto rounded-xl border border-border bg-muted/50 p-4"
          aria-live="polite"
        >
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {displayText}
          </pre>
        </div>
      )}

      {!displayText && !isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">
          Klicke auf &quot;Lead recherchieren&quot; für eine detaillierte Unternehmensanalyse.
        </p>
      )}
    </div>
  )
}
