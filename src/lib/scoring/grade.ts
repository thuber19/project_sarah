import type { ScoreGrade } from '@/types/lead'

/**
 * Grade basiert NUR auf dem Company Score:
 * - TOP MATCH: Company Score >= 70 (starker Firmen-Fit)
 * - GOOD FIT:  Company Score 40-69 (akzeptabler Firmen-Fit)
 * - POOR FIT:  Company Score < 40 (Firma passt nicht)
 *
 * Der Person Score ist eine separate Dimension und beeinflusst das Grade NICHT.
 */
export function getGradeForScore(companyScore: number): ScoreGrade {
  if (companyScore >= 70) return 'TOP_MATCH'
  if (companyScore >= 40) return 'GOOD_FIT'
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
