import { mapLegacyGrade } from '@/lib/scoring/grade'

interface ScoreDistributionProps {
  counts: Record<string, number>
  total: number
}

const gradeConfig = [
  { key: 'TOP_MATCH', label: 'TOP MATCH', range: 'Company ≥70', textColor: 'text-score-hot', barColor: 'bg-score-hot' },
  { key: 'GOOD_FIT', label: 'GOOD FIT', range: 'Company 40-69', textColor: 'text-score-qualified', barColor: 'bg-score-qualified' },
  { key: 'POOR_FIT', label: 'POOR FIT', range: 'Company <40', textColor: 'text-score-poor-fit', barColor: 'bg-score-poor-fit' },
]

/** Remap legacy 5-grade counts to the new 3-grade system */
function remapCounts(counts: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = { TOP_MATCH: 0, GOOD_FIT: 0, POOR_FIT: 0 }
  for (const [grade, count] of Object.entries(counts)) {
    const mapped = mapLegacyGrade(grade)
    result[mapped] = (result[mapped] ?? 0) + count
  }
  return result
}

export function ScoreDistribution({ counts, total }: ScoreDistributionProps) {
  const mapped = remapCounts(counts)

  return (
    <div className="flex w-full flex-col rounded-[--radius-card] border border-border bg-white lg:w-[340px]">
      <div className="border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">Lead Score Verteilung</span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 px-5 py-5">
        {total === 0 ? (
          <p className="text-center text-sm text-muted-foreground">Noch keine bewerteten Leads</p>
        ) : (
          gradeConfig.map(({ key, label, range, textColor, barColor }) => {
            const count = mapped[key] ?? 0
            const percent = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <div key={key} className="flex items-center gap-2.5">
                <span className={`w-[90px] shrink-0 text-xs font-semibold ${textColor}`}>
                  {label}
                </span>
                <span className="w-10 shrink-0 text-xs text-muted-foreground">{range}</span>
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
