interface ScoreBreakdownProps {
  companyFit: number
  contactFit: number
  buyingSignals: number
  timing: number
}

const categories = [
  { key: 'companyFit', label: 'Company Fit', max: 40, color: 'bg-accent' },
  { key: 'contactFit', label: 'Contact Fit', max: 20, color: 'bg-success' },
  { key: 'buyingSignals', label: 'Buying Signals', max: 25, color: 'bg-warning' },
  { key: 'timing', label: 'Timing', max: 15, color: 'bg-score-qualified' },
] as const

export function ScoreBreakdown(props: ScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const value = props[cat.key as keyof ScoreBreakdownProps]
        const widthPercent = (value / cat.max) * 100

        return (
          <div key={cat.key} className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-foreground">{cat.label}</span>
              <span className="text-sm text-muted-foreground">
                {value}/{cat.max}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={cat.label}
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={cat.max}
              className="h-2.5 rounded-full bg-secondary"
            >
              <div
                className={`h-2.5 rounded-full ${cat.color}`}
                style={{ width: `${widthPercent}%` }}
              />
              <span className="sr-only">
                {cat.label}: {value} out of {cat.max}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
