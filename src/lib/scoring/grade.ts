import type { ScoreGrade } from '@/types/lead'

/**
 * Three-grade system based on two-phase scoring:
 * - TOP MATCH: Company qualifiziert + starker Ansprechpartner (combined >= 70)
 * - GOOD FIT:  Company qualifiziert, Person ok (combined 40-69)
 * - POOR FIT:  Company nicht qualifiziert oder schwacher Gesamtscore (< 40)
 */
export function getGradeForScore(score: number): ScoreGrade {
  if (score >= 70) return 'TOP_MATCH'
  if (score >= 40) return 'GOOD_FIT'
  return 'POOR_FIT'
}

/** Map legacy 5-grade values from existing DB rows to the new 3-grade system. */
export function mapLegacyGrade(grade: string): ScoreGrade {
  switch (grade) {
    case 'HOT':
    case 'QUALIFIED':
      return 'TOP_MATCH'
    case 'ENGAGED':
    case 'POTENTIAL':
      return 'GOOD_FIT'
    case 'POOR':
    case 'POOR_FIT':
    default:
      return 'POOR_FIT'
  }
}
