interface ScoreDistributionProps {
  counts: Record<string, number>
  total: number
}

const gradeConfig = [
  { key: 'HOT', label: 'HOT', textColor: 'text-score-hot', barColor: 'bg-score-hot' },
  {
    key: 'QUALIFIED',
    label: 'QUALIFIED',
    textColor: 'text-score-qualified',
    barColor: 'bg-score-qualified',
  },
  {
    key: 'ENGAGED',
    label: 'ENGAGED',
    textColor: 'text-score-engaged',
    barColor: 'bg-score-engaged',
  },
  {
    key: 'POTENTIAL',
    label: 'POTENTIAL',
    textColor: 'text-score-potential',
    barColor: 'bg-score-potential',
  },
  {
    key: 'POOR',
    label: 'POOR FIT',
    textColor: 'text-score-poor-fit',
    barColor: 'bg-score-poor-fit',
  },
]

export function ScoreDistribution({ counts, total }: ScoreDistributionProps) {
  return (
    <div className="flex w-full flex-col rounded-[--radius-card] border border-border bg-white lg:w-[340px]">
      <div className="border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">Lead Score Verteilung</span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-5">
        {total === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Noch keine bewerteten Leads</p>
        ) : (
          gradeConfig.map(({ key, label, textColor, barColor }) => {
            const count = counts[key] ?? 0
            const percent = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <div key={key} className="flex items-center gap-2.5">
                <span className={`w-[80px] shrink-0 text-xs font-semibold ${textColor}`}>
                  {label}
                </span>
                <div className="h-3 flex-1 rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">{count} Leads</span>
                <span className="w-8 text-right text-xs text-muted-foreground">{percent}%</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
