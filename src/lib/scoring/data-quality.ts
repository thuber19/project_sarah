import type { Lead } from '@/types/lead'

/**
 * Calculates a data quality score (0-100) measuring how complete a lead record is.
 * Higher score = more data available for outreach and scoring.
 */
export function calculateDataQuality(lead: Lead): number {
  let score = 0
  const raw = lead.raw_data ?? {}

  // Contact data (high value for outreach)
  if (lead.email) score += 15
  if (raw.phone || raw.international_phone) score += 10
  if (lead.job_title) score += 10
  if (lead.seniority) score += 10

  // Company identification
  if (lead.company_domain) score += 5
  if (lead.industry) score += 5
  if (lead.company_size) score += 5
  if (lead.country) score += 5

  // Social & professional presence
  if (lead.linkedin_url) score += 5
  if (lead.revenue_range) score += 5

  // Enrichment completeness
  if (raw.website_analyzed_at) score += 10

  // Deep research completed (checked via raw_data flag, not join)
  if (raw.research_completed) score += 15

  return Math.min(score, 100)
}
