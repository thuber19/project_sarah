import { cn } from '@/lib/utils'
import { mapLegacyGrade } from '@/lib/scoring/grade'
import type { ScoreGrade } from '@/types/lead'

export type Grade = ScoreGrade | 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR' | 'POOR_FIT'

const gradeStyles: Record<ScoreGrade, string> = {
  TOP_MATCH: 'bg-score-hot-bg text-score-hot-text',
  GOOD_FIT: 'bg-score-qualified-bg text-score-qualified-text',
  POOR_FIT: 'bg-score-poor-fit-bg text-score-poor-fit-text',
}

const gradeLabels: Record<ScoreGrade, string> = {
  TOP_MATCH: 'TOP MATCH',
  GOOD_FIT: 'GOOD FIT',
  POOR_FIT: 'POOR FIT',
}

interface ScoreBadgeProps {
  grade: Grade
  className?: string
}

export function ScoreBadge({ grade, className }: ScoreBadgeProps) {
  // Map legacy grades to new system
  const mapped = (['TOP_MATCH', 'GOOD_FIT', 'POOR_FIT'] as string[]).includes(grade)
    ? (grade as ScoreGrade)
    : mapLegacyGrade(grade)

  return (
    <span
      role="status"
      aria-label={`Lead score: ${gradeLabels[mapped]}`}
      className={cn(
        'inline-flex shrink-0 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-semibold',
        gradeStyles[mapped],
        className,
      )}
    >
      {gradeLabels[mapped]}
    </span>
  )
}
