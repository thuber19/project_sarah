import type { Lead, ScoreBreakdown } from '@/types/lead'

const DACH_COUNTRIES = ['austria', 'germany', 'switzerland', 'österreich', 'deutschland', 'schweiz', 'at', 'de', 'ch']

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
  owner: 20,
  founder: 20,
  cxo: 18,
  c_suite: 18,
  vp: 16,
  director: 14,
  head: 12,
  manager: 10,
  senior: 6,
  entry: 2,
}

export interface ICP {
  target_industries: string[]
  target_company_sizes: string[]
  target_countries: string[]
  target_seniorities: string[]
  target_titles: string[]
}

function scoreCompanyFit(lead: Lead, icp: ICP): number {
  let score = 0

  // Industry match (0-15)
  if (lead.company_industry) {
    const industry = lead.company_industry.toLowerCase()
    if (icp.target_industries.some((t) => industry.includes(t.toLowerCase()))) {
      score += 15
    }
  }

  // Company size (0-10)
  if (lead.company_size) {
    const sizeScore = COMPANY_SIZE_SCORES[lead.company_size]
    if (sizeScore) {
      const isTargetSize = icp.target_company_sizes.includes(lead.company_size)
      score += isTargetSize ? 10 : Math.min(sizeScore, 7)
    }
  }

  // Geography - DACH bonus (0-10)
  if (lead.company_country) {
    const country = lead.company_country.toLowerCase()
    if (DACH_COUNTRIES.includes(country)) {
      score += 10
    } else if (icp.target_countries.some((c) => country.includes(c.toLowerCase()))) {
      score += 7
    }
  }

  // Has domain / web presence (0-5)
  if (lead.company_domain) {
    score += 5
  }

  return Math.min(score, 40)
}

function scoreContactFit(lead: Lead, icp: ICP): number {
  let score = 0

  // Seniority (0-12)
  if (lead.seniority) {
    const seniority = lead.seniority.toLowerCase()
    const seniorityScore = SENIORITY_SCORES[seniority]
    if (seniorityScore) {
      score += Math.min(seniorityScore, 12)
    }
  }

  // Title match (0-8)
  if (lead.title) {
    const title = lead.title.toLowerCase()
    if (icp.target_titles.some((t) => title.includes(t.toLowerCase()))) {
      score += 8
    } else if (['ceo', 'cto', 'cfo', 'head', 'director', 'vp', 'geschäftsführer'].some((t) => title.includes(t))) {
      score += 5
    }
  }

  return Math.min(score, 20)
}

function scoreBuyingSignals(lead: Lead): number {
  let score = 0
  const raw = lead.raw_data ?? {}

  // Has funding info
  if (raw.latest_funding_round || raw.total_funding) score += 8

  // Is hiring (signals growth)
  if (raw.is_hiring || raw.job_postings) score += 7

  // Has technology data (potential tech migration)
  if (raw.technologies && Array.isArray(raw.technologies) && raw.technologies.length > 0) score += 5

  // Has social presence (engaged company)
  if (raw.linkedin_url || raw.twitter_url) score += 5

  return Math.min(score, 25)
}

function scoreTiming(lead: Lead): number {
  let score = 0
  const raw = lead.raw_data ?? {}

  // Recently updated contact
  if (raw.last_activity_date) {
    const lastActivity = new Date(raw.last_activity_date as string)
    const daysSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 30) score += 8
    else if (daysSince < 90) score += 5
    else if (daysSince < 180) score += 2
  }

  // Company recently updated
  if (raw.company_updated_at) {
    const updated = new Date(raw.company_updated_at as string)
    const daysSince = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince < 60) score += 7
    else if (daysSince < 180) score += 4
  }

  return Math.min(score, 15)
}

export function calculateRuleScore(lead: Lead, icp: ICP): ScoreBreakdown {
  return {
    company_fit: scoreCompanyFit(lead, icp),
    contact_fit: scoreContactFit(lead, icp),
    buying_signals: scoreBuyingSignals(lead),
    timing: scoreTiming(lead),
  }
}

export function totalFromBreakdown(breakdown: ScoreBreakdown): number {
  return breakdown.company_fit + breakdown.contact_fit + breakdown.buying_signals + breakdown.timing
}
