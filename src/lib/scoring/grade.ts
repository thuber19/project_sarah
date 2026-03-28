import type { ScoreGrade } from '@/types/lead'

export function getGradeForScore(score: number): ScoreGrade {
  if (score >= 80) return 'HOT'
  if (score >= 65) return 'QUALIFIED'
  if (score >= 48) return 'ENGAGED'
  if (score >= 30) return 'POTENTIAL'
  return 'POOR'
}
