import { cn } from '@/lib/utils'

export type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR' | 'POOR_FIT'

const gradeStyles: Record<Grade, string> = {
  HOT: 'bg-score-hot-bg text-score-hot-text',
  QUALIFIED: 'bg-score-qualified-bg text-score-qualified-text',
  ENGAGED: 'bg-score-engaged-bg text-score-engaged-text',
  POTENTIAL: 'bg-score-potential-bg text-score-potential-text',
  POOR: 'bg-score-poor-fit-bg text-score-poor-fit-text',
  POOR_FIT: 'bg-score-poor-fit-bg text-score-poor-fit-text',
}

const gradeLabels: Record<Grade, string> = {
  HOT: 'HOT',
  QUALIFIED: 'QUALIFIED',
  ENGAGED: 'ENGAGED',
  POTENTIAL: 'POTENTIAL',
  POOR: 'POOR FIT',
  POOR_FIT: 'POOR FIT',
}

interface ScoreBadgeProps {
  grade: Grade
  className?: string
}

export function ScoreBadge({ grade, className }: ScoreBadgeProps) {
  return (
    <span
      role="status"
      aria-label={`Lead score: ${gradeLabels[grade]}`}
      className={cn(
        'inline-flex shrink-0 whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-semibold',
        gradeStyles[grade],
        className,
      )}
    >
      {gradeLabels[grade]}
    </span>
  )
}
