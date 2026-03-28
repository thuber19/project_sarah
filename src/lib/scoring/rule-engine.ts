import type {
  Lead,
  ScoreBreakdown,
  TwoPhaseScore,
  CompanyScoreBreakdown,
  PersonScoreBreakdown,
  ExclusionPenalty,
  ExclusionCriteria,
} from '@/types/lead'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DACH_COUNTRIES = [
  'austria', 'germany', 'switzerland',
  'österreich', 'deutschland', 'schweiz',
  'at', 'de', 'ch',
]

const DACH_LEGAL_ENTITY_PATTERNS = [
  'gmbh', ' ag', ' kg', ' og', 'gesmbh', 'e.u.', ' se', ' eg', 'ewiv',
]

const COMPANY_SIZE_SCORES: Record<string, number> = {
  '1-10': 5,
  '11-50': 10,
  '51-200': 15,
  '201-500': 12,
  '501-1000': 8,
  '1001-5000': 5,
  '5001+': 3,
}

const SENIORITY_SCORES: Record<string, number> = {
  owner: 30, founder: 30, cxo: 28, c_suite: 28,
  vp: 24, director: 20, head: 18, manager: 14, senior: 8, entry: 3,
}

const DACH_TITLE_SENIORITY: Array<[string, number]> = [
  ['geschäftsführer', 30], ['geschäftsführerin', 30],
  ['inhaber', 30], ['inhaberin', 30],
  ['gesellschafter', 28], ['gesellschafterin', 28],
  ['vorstand', 28], ['vorstandsmitglied', 28],
  ['prokurist', 20], ['prokuristin', 20],
  ['bereichsleiter', 18], ['bereichsleiterin', 18],
  ['abteilungsleiter', 14], ['abteilungsleiterin', 14],
  ['teamleiter', 14], ['teamleiterin', 14],
]

/** Titles that signal budget authority */
const BUDGET_TITLE_KEYWORDS = [
  'cfo', 'finance', 'finanzen', 'controlling', 'procurement', 'einkauf',
  'purchasing', 'budget', 'commercial', 'kaufmännisch',
]

/** Titles that signal champion potential (internal advocate, not top exec) */
const CHAMPION_TITLE_KEYWORDS = [
  'head of', 'leiter', 'leiterin', 'lead', 'principal', 'senior manager',
  'team lead', 'architect', 'evangelist', 'strategist', 'transformation',
]

// ---------------------------------------------------------------------------
// ICP Interface
// ---------------------------------------------------------------------------

export interface ICP {
  target_industries: string[]
  target_company_sizes: string[]
  target_countries: string[]
  target_seniorities: string[]
  target_titles: string[]
}

// ---------------------------------------------------------------------------
// Phase 1: Company Score (0-100)
// ---------------------------------------------------------------------------

function scoreCompanyIndustry(lead: Lead, icp: ICP): number {
  if (!lead.industry) return 0
  const industry = lead.industry.toLowerCase()
  if (icp.target_industries.some((t) => industry.includes(t.toLowerCase()))) return 25
  return 0
}

function scoreCompanySize(lead: Lead, icp: ICP): number {
  if (!lead.company_size) return 0
  const sizeScore = COMPANY_SIZE_SCORES[lead.company_size]
  if (!sizeScore) return 0
  const isTarget = icp.target_company_sizes.includes(lead.company_size)
  return isTarget ? 20 : Math.min(Math.round(sizeScore * 1.3), 12)
}

function scoreCompanyGeography(lead: Lead, icp: ICP): number {
  let score = 0
  if (lead.country) {
    const country = lead.country.toLowerCase()
    if (DACH_COUNTRIES.includes(country)) {
      score += 15
    } else if (icp.target_countries.some((c) => country.includes(c.toLowerCase()))) {
      score += 12
    }
  }
  if (lead.company_domain) score += 3
  if (lead.company_name) {
    const name = lead.company_name.toLowerCase()
    if (DACH_LEGAL_ENTITY_PATTERNS.some((p) => name.includes(p))) score += 2
  }
  return Math.min(score, 20)
}

function scoreCompanySignals(lead: Lead): number {
  let score = 0
  const raw = lead.raw_data ?? {}

  if (raw.latest_funding_round || raw.total_funding) score += 6
  if (raw.is_hiring || raw.job_postings) score += 5
  const technologies = raw.technologies ?? raw.detectedTechnologies
  if (technologies && Array.isArray(technologies) && technologies.length > 0) score += 4
  if (raw.linkedin_url || raw.twitter_url) score += 3
  if (raw.businessModel === 'B2B' || raw.businessModel === 'B2B2C') score += 2

  return Math.min(score, 20)
}

function scoreCompanyTiming(lead: Lead): number {
  let score = 0
  const raw = lead.raw_data ?? {}

  if (raw.last_activity_date) {
    const daysSince = (Date.now() - new Date(raw.last_activity_date as string).getTime()) / 86_400_000
    if (daysSince < 30) score += 8
    else if (daysSince < 90) score += 5
    else if (daysSince < 180) score += 2
  }
  if (raw.company_updated_at) {
    const daysSince = (Date.now() - new Date(raw.company_updated_at as string).getTime()) / 86_400_000
    if (daysSince < 60) score += 7
    else if (daysSince < 180) score += 4
  }

  return Math.min(score, 15)
}

function applyExclusions(
  lead: Lead,
  exclusions: ExclusionCriteria | undefined,
): ExclusionPenalty[] {
  if (!exclusions) return []
  const penalties: ExclusionPenalty[] = []

  // Excluded industries
  if (lead.industry && exclusions.excluded_industries.length > 0) {
    const industry = lead.industry.toLowerCase()
    const match = exclusions.excluded_industries.find((ex) =>
      industry.includes(ex.toLowerCase()),
    )
    if (match) {
      penalties.push({ rule: `Ausgeschlossene Branche: ${match}`, penalty: -30 })
    }
  }

  // Excluded company sizes
  if (lead.company_size && exclusions.excluded_company_sizes.includes(lead.company_size)) {
    penalties.push({ rule: `Ausgeschlossene Größe: ${lead.company_size}`, penalty: -25 })
  }

  // Excluded countries
  if (lead.country && exclusions.excluded_countries.length > 0) {
    const country = lead.country.toLowerCase()
    const match = exclusions.excluded_countries.find((ex) =>
      country.includes(ex.toLowerCase()),
    )
    if (match) {
      penalties.push({ rule: `Ausgeschlossenes Land: ${match}`, penalty: -30 })
    }
  }

  // Excluded keywords in company name
  if (lead.company_name && exclusions.excluded_keywords.length > 0) {
    const name = lead.company_name.toLowerCase()
    for (const keyword of exclusions.excluded_keywords) {
      if (name.includes(keyword.toLowerCase())) {
        penalties.push({ rule: `Ausgeschlossenes Keyword: ${keyword}`, penalty: -20 })
      }
    }
  }

  return penalties
}

export function calculateCompanyScore(
  lead: Lead,
  icp: ICP,
  exclusions?: ExclusionCriteria,
): { score: number; breakdown: CompanyScoreBreakdown; penalties: ExclusionPenalty[] } {
  const industry = scoreCompanyIndustry(lead, icp)
  const companySize = scoreCompanySize(lead, icp)
  const geography = scoreCompanyGeography(lead, icp)
  const signals = scoreCompanySignals(lead)
  const timing = scoreCompanyTiming(lead)

  const penalties = applyExclusions(lead, exclusions)
  const totalPenalty = penalties.reduce((sum, p) => sum + p.penalty, 0)

  const rawScore = industry + companySize + geography + signals + timing
  const score = Math.max(0, Math.min(100, rawScore + totalPenalty))

  return {
    score,
    breakdown: {
      industry,
      company_size: companySize,
      geography,
      signals,
      timing,
      exclusion_penalty: totalPenalty,
    },
    penalties,
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Person Score (0-100) — only if company_score > 50
// ---------------------------------------------------------------------------

function scoreDecisionMaker(lead: Lead): number {
  let score = 0

  // Seniority enum from Apollo
  if (lead.seniority) {
    const seniorityScore = SENIORITY_SCORES[lead.seniority.toLowerCase()]
    if (seniorityScore) score = Math.min(seniorityScore, 30)
  }

  // DACH title fallback
  if (score === 0 && lead.job_title) {
    const title = lead.job_title.toLowerCase()
    for (const [keyword, s] of DACH_TITLE_SENIORITY) {
      if (title.includes(keyword)) {
        score = Math.min(s, 30)
        break
      }
    }
  }

  return score
}

function scoreBudgetAuthority(lead: Lead): number {
  if (!lead.job_title) return 0
  const title = lead.job_title.toLowerCase()

  // Direct budget titles
  if (BUDGET_TITLE_KEYWORDS.some((k) => title.includes(k))) return 25

  // C-level and VP generally have budget authority
  if (['ceo', 'coo', 'cmo', 'geschäftsführer', 'vorstand', 'inhaber'].some((k) => title.includes(k))) {
    return 20
  }

  // Directors often have budget
  if (['director', 'bereichsleiter', 'prokurist'].some((k) => title.includes(k))) return 15

  // Managers sometimes
  if (['manager', 'abteilungsleiter'].some((k) => title.includes(k))) return 8

  return 0
}

function scoreChampionPotential(lead: Lead): number {
  if (!lead.job_title) return 0
  const title = lead.job_title.toLowerCase()

  // Champion = someone who can advocate internally but isn't necessarily the final decision maker
  if (CHAMPION_TITLE_KEYWORDS.some((k) => title.includes(k))) return 25

  // Mid-level with domain expertise
  if (['manager', 'specialist', 'spezialist', 'consultant', 'berater'].some((k) => title.includes(k))) {
    return 15
  }

  // Senior individual contributors
  if (['senior', 'expert', 'experte'].some((k) => title.includes(k))) return 10

  return 0
}

function scoreTitleMatch(lead: Lead, icp: ICP): number {
  if (!lead.job_title) return 0
  const title = lead.job_title.toLowerCase()
  if (icp.target_titles.some((t) => title.includes(t.toLowerCase()))) return 20
  return 0
}

export function calculatePersonScore(
  lead: Lead,
  icp: ICP,
): { score: number; breakdown: PersonScoreBreakdown } {
  const decisionMaker = scoreDecisionMaker(lead)
  const budgetAuthority = scoreBudgetAuthority(lead)
  const championPotential = scoreChampionPotential(lead)
  const titleMatch = scoreTitleMatch(lead, icp)

  const score = Math.min(100, decisionMaker + budgetAuthority + championPotential + titleMatch)

  return {
    score,
    breakdown: {
      decision_maker: decisionMaker,
      budget_authority: budgetAuthority,
      champion_potential: championPotential,
      title_match: titleMatch,
    },
  }
}

// ---------------------------------------------------------------------------
// Two-Phase Combined Scoring
// ---------------------------------------------------------------------------

const COMPANY_QUALIFICATION_THRESHOLD = 50

export function calculateTwoPhaseScore(
  lead: Lead,
  icp: ICP,
  exclusions?: ExclusionCriteria,
): TwoPhaseScore {
  const company = calculateCompanyScore(lead, icp, exclusions)

  const companyQualified = company.score > COMPANY_QUALIFICATION_THRESHOLD

  let personScore: number | null = null
  let personBreakdown: PersonScoreBreakdown | null = null

  if (companyQualified) {
    const person = calculatePersonScore(lead, icp)
    personScore = person.score
    personBreakdown = person.breakdown
  }

  return {
    company_score: company.score,
    company_breakdown: company.breakdown,
    person_score: personScore,
    person_breakdown: personBreakdown,
    exclusion_penalties: company.penalties,
    company_qualified: companyQualified,
  }
}

// ---------------------------------------------------------------------------
// Legacy API — maps to old 4-category breakdown for backward compatibility
// ---------------------------------------------------------------------------

export function calculateRuleScore(lead: Lead, icp: ICP): ScoreBreakdown {
  const twoPhase = calculateTwoPhaseScore(lead, icp)

  return {
    company_fit: Math.round(twoPhase.company_breakdown.industry + twoPhase.company_breakdown.company_size),
    contact_fit: twoPhase.person_breakdown
      ? Math.round((twoPhase.person_breakdown.decision_maker + twoPhase.person_breakdown.title_match) * 0.4)
      : 0,
    buying_signals: Math.round(twoPhase.company_breakdown.signals + twoPhase.company_breakdown.geography * 0.25),
    timing: twoPhase.company_breakdown.timing,
  }
}

export function totalFromBreakdown(breakdown: ScoreBreakdown): number {
  return breakdown.company_fit + breakdown.contact_fit + breakdown.buying_signals + breakdown.timing
}

/** Combined score: weighted average of company (60%) and person (40%). */
export function combinedScore(twoPhase: TwoPhaseScore): number {
  if (!twoPhase.company_qualified || twoPhase.person_score === null) {
    return Math.round(twoPhase.company_score * 0.6)
  }
  return Math.round(twoPhase.company_score * 0.6 + twoPhase.person_score * 0.4)
}
