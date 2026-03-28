export interface Lead {
  id: string
  user_id: string
  campaign_id: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  linkedin_url: string | null
  photo_url: string | null
  job_title: string | null
  seniority: string | null
  company_name: string | null
  company_domain: string | null
  company_website: string | null
  industry: string | null
  company_size: string | null
  revenue_range: string | null
  funding_stage: string | null
  location: string | null
  country: string | null
  source: 'apollo' | 'google_places' | 'enriched' | null
  apollo_id: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type ScoreGrade = 'TOP_MATCH' | 'GOOD_FIT' | 'POOR_FIT'

/** @deprecated Legacy grades — map to new grades via mapLegacyGrade() */
export type LegacyScoreGrade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'

export interface ScoreBreakdown {
  company_fit: number // max 40
  contact_fit: number // max 20
  buying_signals: number // max 25
  timing: number // max 15
}

/** Two-phase scoring: Company first, then Person (only if company qualifies). */
export interface TwoPhaseScore {
  company_score: number // 0-100
  company_breakdown: CompanyScoreBreakdown
  person_score: number | null // 0-100, null if company_score <= 50
  person_breakdown: PersonScoreBreakdown | null
  exclusion_penalties: ExclusionPenalty[]
  company_qualified: boolean // company_score > 50
}

export interface CompanyScoreBreakdown {
  industry: number // max 25
  company_size: number // max 20
  geography: number // max 20
  signals: number // max 20 (funding, hiring, tech, social)
  timing: number // max 15
  exclusion_penalty: number // negative, reduces score
}

export interface PersonScoreBreakdown {
  decision_maker: number // max 30 — seniority / Entscheidungsträger
  budget_authority: number // max 25 — budget holder signals
  champion_potential: number // max 25 — internal advocate
  title_match: number // max 20 — ICP title match
}

export interface ExclusionPenalty {
  rule: string // e.g. "Excluded industry: Government"
  penalty: number // negative value applied
}

/** User-defined exclusion criteria that reduce the company score. */
export interface ExclusionCriteria {
  excluded_industries: string[]
  excluded_company_sizes: string[]
  excluded_countries: string[]
  excluded_keywords: string[] // matched against company_name
}

/** User-defined contact preferences — asked before person scoring. */
export interface ContactPreferences {
  /** Ideale Jobtitel der Ansprechpartner */
  ideal_titles: string[]
  /** Gewünschte Seniority-Level */
  ideal_seniority: string[]
  /** Abteilungen / Fachbereiche die relevant sind */
  ideal_departments: string[]
  /** Bevorzugte Kontakt-Kanäle — Gewichtung beeinflusst den Erreichbarkeits-Score */
  preferred_channels: ContactChannel[]
}

export type ContactChannel = 'email' | 'linkedin' | 'phone' | 'xing'

export interface PersonScoreBreakdownV2 {
  decision_power: number // max 30
  budget_access: number // max 25
  domain_relevance: number // max 25
  reachability: number // max 20
  persona_tag: PersonaTag | null
}

export type PersonaTag = 'entscheider' | 'budget_holder' | 'champion' | 'influencer'

export interface LeadScore {
  id: string
  lead_id: string
  user_id: string
  campaign_id: string | null
  total_score: number // 0-100
  company_fit_score: number
  contact_fit_score: number
  buying_signals_score: number
  timing_score: number
  grade: ScoreGrade
  ai_reasoning: string | null
  recommended_action: string | null
  confidence: number | null
  dach_notes: string | null
  key_insights: string[] | null
  created_at: string
  updated_at: string
}

// --- Lead List types (for leads page) ---
export interface LeadListItem {
  id: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  industry: string | null
  location: string | null
  total_score: number | null
  grade: string | null
  updated_at: string
}

export interface LeadListResult {
  leads: LeadListItem[]
  totalCount: number
}

export type LeadSortField = 'total_score' | 'company_name' | 'created_at'
export type SortDirection = 'asc' | 'desc'
