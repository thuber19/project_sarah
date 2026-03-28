'use client'

import { useState, useTransition } from 'react'
import { Lightbulb, Loader2, Check, ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import {
  analyzeIcpRefinementAction,
  applyIcpSuggestionAction,
  type IcpSuggestion,
  type IcpRefinementResult,
} from '@/app/actions/icp-refinement.actions'
import { toast } from 'sonner'

const fieldLabels: Record<string, string> = {
  industries: 'Branchen',
  company_sizes: 'Unternehmensgröße',
  regions: 'Regionen',
  job_titles: 'Jobtitel',
  seniority_levels: 'Seniority',
  tech_stack: 'Tech-Stack',
}

const actionLabels: Record<string, string> = {
  add: 'Hinzufügen',
  remove: 'Entfernen',
  replace: 'Ersetzen',
}

const impactColors: Record<string, string> = {
  high: 'bg-score-hot/10 text-score-hot',
  medium: 'bg-score-engaged/10 text-score-engaged',
  low: 'bg-secondary text-muted-foreground',
}

export function IcpRefinementWidget() {
  const [isAnalyzing, startAnalysis] = useTransition()
  const [result, setResult] = useState<IcpRefinementResult | null>(null)
  const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set())
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null)

  function handleAnalyze() {
    startAnalysis(async () => {
      const res = await analyzeIcpRefinementAction()
      if (res.success) {
        setResult(res.data)
        setAppliedIndices(new Set())
      } else {
        toast.error(res.error)
      }
    })
  }

  async function handleApply(suggestion: IcpSuggestion, index: number) {
    setApplyingIndex(index)
    const res = await applyIcpSuggestionAction({
      field: suggestion.field,
      action: suggestion.action,
      suggested_value: suggestion.suggested_value,
      current_value: suggestion.current_value,
    })

    if (res.error) {
      toast.error(res.error)
    } else {
      setAppliedIndices((prev) => new Set([...prev, index]))
      toast.success('ICP-Vorschlag übernommen')
    }
    setApplyingIndex(null)
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">ICP-Optimierung</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          AI analysiert Ihre Lead-Qualität und schlägt bessere ICP-Parameter vor.
        </p>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysiere...
            </>
          ) : (
            <>
              <Lightbulb className="h-4 w-4" />
              ICP analysieren
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">ICP-Optimierung</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Qualität: <span className="font-semibold text-foreground">{result.quality_score}/100</span>
          </span>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
            title="Erneut analysieren"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{result.summary}</p>

      <div className="flex flex-col gap-2">
        {result.suggestions.map((suggestion, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">
                  {fieldLabels[suggestion.field] ?? suggestion.field}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${impactColors[suggestion.impact]}`}>
                  {suggestion.impact}
                </span>
                {suggestion.action === 'add' && <ArrowUpRight className="h-3 w-3 text-green-600" />}
                {suggestion.action === 'remove' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {actionLabels[suggestion.action]}: <span className="font-medium text-foreground">{suggestion.suggested_value}</span>
                {suggestion.current_value && suggestion.action === 'replace' && (
                  <> (statt {suggestion.current_value})</>
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{suggestion.reasoning}</p>
            </div>

            <button
              type="button"
              onClick={() => handleApply(suggestion, i)}
              disabled={appliedIndices.has(i) || applyingIndex === i}
              className="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-default"
            >
              {appliedIndices.has(i) ? (
                <>
                  <Check className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Übernommen</span>
                </>
              ) : applyingIndex === i ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  Übernehmen
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
