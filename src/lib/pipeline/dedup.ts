import type { Database, Json } from '@/types/database'

type LeadInsert = Database['public']['Tables']['leads']['Insert']

/**
 * Normalize a domain/URL to a bare domain for deduplication.
 * "https://www.example.com/about" → "example.com"
 */
export function normalizeDomain(rawDomain: string): string {
  let domain = rawDomain.toLowerCase().trim()

  // Strip protocol
  domain = domain.replace(/^https?:\/\//, '')
  // Strip www.
  domain = domain.replace(/^www\./, '')
  // Strip trailing path/slash
  domain = domain.replace(/\/.*$/, '')
  // Strip port
  domain = domain.replace(/:\d+$/, '')

  return domain
}

/**
 * Deduplicate leads by normalized domain within a single batch.
 * When two leads share the same domain, the one with more data wins.
 * Missing fields from the loser are merged into the winner.
 */
export function deduplicateLeads(leads: LeadInsert[]): LeadInsert[] {
  const byDomain = new Map<string, LeadInsert>()
  const noDomain: LeadInsert[] = []

  for (const lead of leads) {
    const rawDomain = lead.company_domain ?? lead.company_website
    if (!rawDomain) {
      noDomain.push(lead)
      continue
    }

    const domain = normalizeDomain(rawDomain)
    const existing = byDomain.get(domain)

    if (!existing) {
      byDomain.set(domain, lead)
      continue
    }

    // Merge: fill missing fields from the less-complete lead
    byDomain.set(domain, mergeLeads(existing, lead))
  }

  return [...byDomain.values(), ...noDomain]
}

/**
 * Merge two leads for the same company. Prefers non-null values from either.
 * Apollo leads generally have better company data; Google Places has phone/address.
 */
function mergeLeads(a: LeadInsert, b: LeadInsert): LeadInsert {
  return {
    ...a,
    first_name: a.first_name ?? b.first_name,
    last_name: a.last_name ?? b.last_name,
    full_name: a.full_name ?? b.full_name,
    email: a.email ?? b.email,
    linkedin_url: a.linkedin_url ?? b.linkedin_url,
    job_title: a.job_title ?? b.job_title,
    seniority: a.seniority ?? b.seniority,
    company_name: a.company_name ?? b.company_name,
    company_domain: a.company_domain ?? b.company_domain,
    company_website: a.company_website ?? b.company_website,
    industry: a.industry ?? b.industry,
    company_size: a.company_size ?? b.company_size,
    revenue_range: a.revenue_range ?? b.revenue_range,
    funding_stage: a.funding_stage ?? b.funding_stage,
    location: a.location ?? b.location,
    country: a.country ?? b.country,
    // Prefer apollo source (has more data)
    source: a.source === 'apollo' ? a.source : b.source === 'apollo' ? b.source : a.source,
    apollo_id: a.apollo_id ?? b.apollo_id,
    // Merge raw_data objects
    raw_data: {
      ...((b.raw_data ?? {}) as Record<string, Json | undefined>),
      ...((a.raw_data ?? {}) as Record<string, Json | undefined>),
    },
  }
}
