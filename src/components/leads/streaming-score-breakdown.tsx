'use client'

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'

interface StreamingScoreBreakdownProps {
  companyFit?: number
  contactFit?: number
  buyingSignals?: number
  timing?: number
  isLoading?: boolean
  showAnimation?: boolean
}

const categories = [
  { key: 'companyFit', label: 'Company Fit', max: 40, color: 'bg-accent' },
  { key: 'contactFit', label: 'Contact Fit', max: 20, color: 'bg-success' },
  { key: 'buyingSignals', label: 'Buying Signals', max: 25, color: 'bg-warning' },
  { key: 'timing', label: 'Timing', max: 15, color: 'bg-score-qualified' },
] as const

interface ScoreCategory {
  key: keyof Omit<StreamingScoreBreakdownProps, 'isLoading' | 'showAnimation'>
  label: string
  max: number
  color: string
}

export function StreamingScoreBreakdown({
  companyFit = 0,
  contactFit = 0,
  buyingSignals = 0,
  timing = 0,
  isLoading = false,
  showAnimation = true,
}: StreamingScoreBreakdownProps) {
  const scores = useMemo(
    () => ({
      companyFit,
      contactFit,
      buyingSignals,
      timing,
    }),
    [companyFit, contactFit, buyingSignals, timing]
  )

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat, idx) => {
        const value = scores[cat.key as keyof typeof scores] ?? 0
        const widthPercent = (value / cat.max) * 100
        const isStreaming = isLoading && showAnimation && value === 0

        return (
          <div
            key={cat.key}
            className={`flex flex-col gap-1.5 transition-all duration-300 ${
              showAnimation && value > 0 ? 'animate-in fade-in slide-in-from-left-2' : ''
            }`}
            style={{
              animationDelay: showAnimation ? `${idx * 100}ms` : '0ms',
              animationFillMode: 'both',
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
                {isStreaming && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              <span className="text-sm text-muted-foreground">
                {value > 0 ? `${value}/${cat.max}` : '...'}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-2.5 rounded-full ${cat.color} transition-all duration-300 ease-out`}
                style={{
                  width: `${widthPercent}%`,
                  opacity: value > 0 ? 1 : 0.3,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
