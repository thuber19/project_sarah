import { describe, it, expect } from 'vitest'
import { normalizeDomain, deduplicateLeads } from './dedup'
import type { Database } from '@/types/database'

type LeadInsert = Database['public']['Tables']['leads']['Insert']

function makeLead(overrides: Partial<LeadInsert> = {}): LeadInsert {
  return {
    user_id: 'user-1',
    campaign_id: 'camp-1',
    source: 'apollo',
    ...overrides,
  }
}

describe('normalizeDomain', () => {
  it('strips https protocol', () => {
    expect(normalizeDomain('https://example.com')).toBe('example.com')
  })

  it('strips http protocol', () => {
    expect(normalizeDomain('http://example.com')).toBe('example.com')
  })

  it('strips www prefix', () => {
    expect(normalizeDomain('https://www.example.com')).toBe('example.com')
  })

  it('strips trailing path', () => {
    expect(normalizeDomain('https://example.com/about/team')).toBe('example.com')
  })

  it('strips port', () => {
    expect(normalizeDomain('https://example.com:8080')).toBe('example.com')
  })

  it('lowercases', () => {
    expect(normalizeDomain('HTTPS://Example.COM')).toBe('example.com')
  })

  it('handles bare domain', () => {
    expect(normalizeDomain('example.com')).toBe('example.com')
  })

  it('handles domain with trailing slash', () => {
    expect(normalizeDomain('https://example.com/')).toBe('example.com')
  })
})

describe('deduplicateLeads', () => {
  it('returns all leads when no duplicates', () => {
    const leads = [
      makeLead({ company_domain: 'https://a.com', company_name: 'A' }),
      makeLead({ company_domain: 'https://b.com', company_name: 'B' }),
    ]
    expect(deduplicateLeads(leads)).toHaveLength(2)
  })

  it('merges leads with matching domains', () => {
    const apollo = makeLead({
      company_domain: 'https://example.com',
      company_name: 'Example GmbH',
      industry: 'SaaS',
      source: 'apollo',
    })
    const google = makeLead({
      company_domain: 'https://www.example.com',
      company_name: 'Example GmbH',
      location: 'Wien, Österreich',
      source: 'google_places',
      raw_data: { phone: '+431234567' },
    })

    const result = deduplicateLeads([apollo, google])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      company_name: 'Example GmbH',
      industry: 'SaaS',
      location: 'Wien, Österreich',
      source: 'apollo',
    })
  })

  it('keeps leads without domains separately', () => {
    const withDomain = makeLead({ company_domain: 'https://a.com', company_name: 'A' })
    const noDomain1 = makeLead({ company_name: 'NoDomain1' })
    const noDomain2 = makeLead({ company_name: 'NoDomain2' })

    const result = deduplicateLeads([withDomain, noDomain1, noDomain2])
    expect(result).toHaveLength(3)
  })

  it('fills missing fields from duplicate', () => {
    const lead1 = makeLead({
      company_domain: 'https://example.com',
      company_name: 'Example',
      industry: 'SaaS',
      email: null,
    })
    const lead2 = makeLead({
      company_domain: 'https://example.com',
      email: 'info@example.com',
      industry: null,
    })

    const result = deduplicateLeads([lead1, lead2])
    expect(result).toHaveLength(1)
    expect(result[0]?.industry).toBe('SaaS')
    expect(result[0]?.email).toBe('info@example.com')
  })

  it('prefers apollo source over google_places', () => {
    const google = makeLead({ company_domain: 'https://example.com', source: 'google_places' })
    const apollo = makeLead({ company_domain: 'https://example.com', source: 'apollo' })

    const result = deduplicateLeads([google, apollo])
    expect(result).toHaveLength(1)
    expect(result[0]?.source).toBe('apollo')
  })

  it('merges raw_data from both leads', () => {
    const lead1 = makeLead({
      company_domain: 'https://example.com',
      raw_data: { technologies: ['React'], total_funding: '5M' },
    })
    const lead2 = makeLead({
      company_domain: 'https://example.com',
      raw_data: { phone: '+431234567', rating: 4.5 },
    })

    const result = deduplicateLeads([lead1, lead2])
    const raw = result[0]?.raw_data as Record<string, unknown>
    expect(raw.technologies).toEqual(['React'])
    expect(raw.total_funding).toBe('5M')
    expect(raw.phone).toBe('+431234567')
  })

  it('handles company_website fallback when company_domain is null', () => {
    const lead1 = makeLead({ company_website: 'https://example.com', company_name: 'A' })
    const lead2 = makeLead({ company_domain: 'https://example.com', company_name: 'B' })

    const result = deduplicateLeads([lead1, lead2])
    expect(result).toHaveLength(1)
  })
})
