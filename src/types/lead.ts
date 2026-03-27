export interface Lead {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  title: string | null
  seniority: string | null
  company_name: string | null
  company_domain: string | null
  company_industry: string | null
  company_size: string | null
  company_revenue: string | null
  company_country: string | null
  company_city: string | null
  source: 'apollo' | 'google_places' | 'manual'
  source_id: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type ScoreGrade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR_FIT'

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
  total_score: number // 0-100
  grade: ScoreGrade
  breakdown: ScoreBreakdown
  ai_reasoning: string | null
  ai_recommendation: string | null
  scored_at: string
}

export interface AgentLog {
  id: string
  user_id: string
  event_type: 'lead_discovered' | 'lead_scored' | 'lead_enriched' | 'pipeline_started' | 'pipeline_completed' | 'error'
  message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export function getGradeForScore(score: number): ScoreGrade {
  if (score >= 90) return 'HOT'
  if (score >= 75) return 'QUALIFIED'
  if (score >= 60) return 'ENGAGED'
  if (score >= 40) return 'POTENTIAL'
  return 'POOR_FIT'
}
