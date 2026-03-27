import { cn } from '@/lib/utils'

export type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR' | 'POOR_FIT'

const gradeStyles: Record<Grade, string> = {
  HOT: 'bg-score-hot text-white',
  QUALIFIED: 'bg-score-qualified text-white',
  ENGAGED: 'bg-score-engaged text-white',
  POTENTIAL: 'bg-score-potential text-white',
  POOR: 'bg-score-poor-fit text-white',
  POOR_FIT: 'bg-score-poor-fit text-white',
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
      className={cn(
        'inline-flex rounded-full px-3.5 py-1 text-xs font-semibold',
        gradeStyles[grade],
        className,
      )}
    >
      {gradeLabels[grade]}
    </span>
  )
}
