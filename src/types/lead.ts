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

export type ScoreGrade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'

export interface ScoreBreakdown {
  company_fit: number // max 40
  contact_fit: number // max 20
  buying_signals: number // max 25
  timing: number // max 15
}

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
