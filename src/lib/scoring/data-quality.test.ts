import { describe, it, expect } from 'vitest'
import { calculateDataQuality } from './data-quality'
import type { Lead } from '@/types/lead'

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    user_id: 'user-1',
    campaign_id: null,
    first_name: null,
    last_name: null,
    full_name: null,
    email: null,
    linkedin_url: null,
    photo_url: null,
    job_title: null,
    seniority: null,
    company_name: null,
    company_domain: null,
    company_website: null,
    industry: null,
    company_size: null,
    revenue_range: null,
    funding_stage: null,
    location: null,
    country: null,
    source: null,
    apollo_id: null,
    raw_data: null,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

describe('calculateDataQuality', () => {
  it('returns 0 for a completely empty lead', () => {
    expect(calculateDataQuality(makeLead())).toBe(0)
  })

  it('scores email at 15 points', () => {
    expect(calculateDataQuality(makeLead({ email: 'test@example.com' }))).toBe(15)
  })

  it('scores phone from raw_data at 10 points', () => {
    expect(calculateDataQuality(makeLead({ raw_data: { phone: '+431234567' } }))).toBe(10)
  })

  it('scores job_title at 10 points', () => {
    expect(calculateDataQuality(makeLead({ job_title: 'CEO' }))).toBe(10)
  })

  it('scores seniority at 10 points', () => {
    expect(calculateDataQuality(makeLead({ seniority: 'c_suite' }))).toBe(10)
  })

  it('scores company identification fields', () => {
    const lead = makeLead({
      company_domain: 'example.com',
      industry: 'SaaS',
      company_size: '51-200',
      country: 'Austria',
    })
    expect(calculateDataQuality(lead)).toBe(20)
  })

  it('scores linkedin_url at 5 points', () => {
    expect(calculateDataQuality(makeLead({ linkedin_url: 'https://linkedin.com/in/test' }))).toBe(5)
  })

  it('scores website_analyzed_at at 10 points', () => {
    const lead = makeLead({ raw_data: { website_analyzed_at: '2026-01-01' } })
    expect(calculateDataQuality(lead)).toBe(10)
  })

  it('scores research_completed at 15 points', () => {
    const lead = makeLead({ raw_data: { research_completed: true } })
    expect(calculateDataQuality(lead)).toBe(15)
  })

  it('caps at 100 for a fully enriched lead', () => {
    const lead = makeLead({
      email: 'ceo@example.com',
      job_title: 'Geschäftsführer',
      seniority: 'owner',
      company_domain: 'example.com',
      industry: 'SaaS',
      company_size: '51-200',
      country: 'Austria',
      linkedin_url: 'https://linkedin.com/in/test',
      revenue_range: '1M-10M',
      raw_data: {
        phone: '+431234567',
        website_analyzed_at: '2026-01-01',
        research_completed: true,
      },
    })
    expect(calculateDataQuality(lead)).toBe(100)
  })

  it('handles a typical Apollo org-only lead', () => {
    const lead = makeLead({
      company_domain: 'https://techcorp.at',
      industry: 'Software',
      company_size: '51-200',
      country: 'Austria',
      linkedin_url: 'https://linkedin.com/company/techcorp',
      raw_data: {
        twitter_url: 'https://twitter.com/techcorp',
        technologies: ['React'],
        total_funding: '5M',
      },
    })
    // domain(5) + industry(5) + size(5) + country(5) + linkedin(5) = 25
    expect(calculateDataQuality(lead)).toBe(25)
  })

  it('handles a typical Google Places lead', () => {
    const lead = makeLead({
      company_domain: 'https://restaurant.at',
      country: 'Austria',
      raw_data: { phone: '+431234567', rating: 4.5 },
    })
    // domain(5) + country(5) + phone(10) = 20
    expect(calculateDataQuality(lead)).toBe(20)
  })
})
