'use client'

interface ScoringProgressProps {
  current: number
  total: number
  lastGrade?: string
}

const GRADE_COLORS: Record<string, string> = {
  HOT: 'text-score-hot',
  QUALIFIED: 'text-score-qualified',
  ENGAGED: 'text-score-engaged',
  POTENTIAL: 'text-score-potential',
  POOR: 'text-score-poor-fit',
}

export function ScoringProgress({ current, total, lastGrade }: ScoringProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Scoring: {current}/{total} Leads
          </span>
          {lastGrade && (
            <span
              className={`text-xs font-semibold ${GRADE_COLORS[lastGrade] || 'text-muted-foreground'}`}
            >
              Letzter: {lastGrade}
            </span>
          )}
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{percentage}% abgeschlossen</p>
      </div>
    </div>
  )
}
