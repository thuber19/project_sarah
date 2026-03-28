// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'

import {
  calculateCompanyScore,
  calculatePersonScore,
  calculateTwoPhaseScore,
  calculateRuleScore,
  totalFromBreakdown,
  combinedScore,
  type ICP,
} from './rule-engine'
import type { Lead, TwoPhaseScore } from '@/types/lead'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-1',
    user_id: 'u-1',
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
    source: 'apollo',
    apollo_id: null,
    raw_data: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

const defaultIcp: ICP = {
  target_industries: ['SaaS', 'FinTech'],
  target_company_sizes: ['11-50', '51-200'],
  target_countries: ['austria', 'germany'],
  target_seniorities: ['cxo', 'director'],
  target_titles: ['CTO', 'Head of Engineering'],
}

// ---------------------------------------------------------------------------
// calculateCompanyScore — Phase 1 (0-100)
// ---------------------------------------------------------------------------

describe('calculateCompanyScore', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // -----------------------------------------------------------------------
  // Industry (max 25)
  // -----------------------------------------------------------------------
  describe('industry scoring', () => {
    it('scores 5 base points for empty lead (unknown industry)', () => {
      const { breakdown } = calculateCompanyScore(makeLead(), defaultIcp)
      expect(breakdown.industry).toBe(5)
    })

    it('gives 25 for matching industry', () => {
      const lead = makeLead({ industry: 'Enterprise SaaS' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.industry).toBe(25)
    })

    it('gives 5 base points for industry with no ICP match', () => {
      const lead = makeLead({ industry: 'Healthcare' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.industry).toBe(5)
    })

    it('industry match is case-insensitive', () => {
      const lead = makeLead({ industry: 'fintech' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.industry).toBe(25)
    })
  })

  // -----------------------------------------------------------------------
  // Company size (max 20)
  // -----------------------------------------------------------------------
  describe('company size scoring', () => {
    it('gives 20 for matching company size from ICP targets', () => {
      const lead = makeLead({ company_size: '11-50' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.company_size).toBe(20)
    })

    it('gives capped non-target size score for non-target size', () => {
      // '51-200' has COMPANY_SIZE_SCORES of 15, but IS in ICP => 20
      // Use a size NOT in ICP to test the fallback
      const icp: ICP = { ...defaultIcp, target_company_sizes: ['1-10'] }
      const lead = makeLead({ company_size: '51-200' })
      const { breakdown } = calculateCompanyScore(lead, icp)
      // Non-target: min(round(15 * 1.3), 12) = min(20, 12) = 12
      expect(breakdown.company_size).toBe(12)
    })

    it('gives lower score for small non-target size', () => {
      const icp: ICP = { ...defaultIcp, target_company_sizes: ['51-200'] }
      const lead = makeLead({ company_size: '1-10' })
      const { breakdown } = calculateCompanyScore(lead, icp)
      // '1-10' has COMPANY_SIZE_SCORES of 5, not in target => min(round(5*1.3), 12) = min(7, 12) = 7
      expect(breakdown.company_size).toBe(7)
    })

    it('scores 5 base points for null company_size', () => {
      const { breakdown } = calculateCompanyScore(makeLead(), defaultIcp)
      expect(breakdown.company_size).toBe(5)
    })
  })

  // -----------------------------------------------------------------------
  // Geography (max 20)
  // -----------------------------------------------------------------------
  describe('geography scoring', () => {
    it('gives 15 for DACH country (Austria)', () => {
      const lead = makeLead({ country: 'austria' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(15)
    })

    it('gives 15 for DACH country using German spelling (Osterreich)', () => {
      const lead = makeLead({ country: 'Österreich' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(15)
    })

    it('gives 15 for DACH country using ISO code (DE)', () => {
      const lead = makeLead({ country: 'DE' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(15)
    })

    it('gives 15 for DACH country (Deutschland)', () => {
      const lead = makeLead({ country: 'Deutschland' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(15)
    })

    it('gives 15 for DACH country (Switzerland)', () => {
      const lead = makeLead({ country: 'Switzerland' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(15)
    })

    it('gives 12 for non-DACH target country', () => {
      const icp: ICP = {
        ...defaultIcp,
        target_countries: ['austria', 'germany', 'netherlands'],
      }
      const lead = makeLead({ country: 'Netherlands' })
      const { breakdown } = calculateCompanyScore(lead, icp)
      expect(breakdown.geography).toBe(12)
    })

    it('gives 5 base points for a country not in DACH and not in ICP targets', () => {
      const lead = makeLead({ country: 'Japan' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(5)
    })

    it('gives 6 for having a domain without country (3 base + 3 domain)', () => {
      const lead = makeLead({ company_domain: 'example.com' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(6)
    })

    it('gives 5 for DACH legal entity in company name without country (3 base + 2 entity)', () => {
      const lead = makeLead({ company_name: 'TechCorp GmbH' })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(5)
    })

    it('caps geography at 20 for DACH country + domain + legal entity', () => {
      const lead = makeLead({
        country: 'Austria',
        company_domain: 'example.at',
        company_name: 'TechCorp GmbH',
      })
      // 15 (DACH) + 3 (domain) + 2 (GmbH) = 20
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.geography).toBe(20)
    })
  })

  // -----------------------------------------------------------------------
  // Signals (max 20)
  // -----------------------------------------------------------------------
  describe('signals scoring', () => {
    it('scores 0 for no raw_data', () => {
      const { breakdown } = calculateCompanyScore(makeLead(), defaultIcp)
      expect(breakdown.signals).toBe(0)
    })

    it('gives 6 for latest_funding_round', () => {
      const lead = makeLead({
        raw_data: { latest_funding_round: 'Series A' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(6)
    })

    it('gives 6 for total_funding', () => {
      const lead = makeLead({
        raw_data: { total_funding: 5_000_000 },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(6)
    })

    it('gives 6 only once even if both funding fields present', () => {
      const lead = makeLead({
        raw_data: { latest_funding_round: 'Series B', total_funding: 20_000_000 },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(6)
    })

    it('gives 5 for is_hiring', () => {
      const lead = makeLead({
        raw_data: { is_hiring: true },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(5)
    })

    it('gives 5 for job_postings', () => {
      const lead = makeLead({
        raw_data: { job_postings: 12 },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(5)
    })

    it('gives 4 for technologies array with entries', () => {
      const lead = makeLead({
        raw_data: { technologies: ['React', 'Node.js'] },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(4)
    })

    it('gives 2 base points for empty technologies array (enriched raw_data)', () => {
      const lead = makeLead({
        raw_data: { technologies: [] },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(2)
    })

    it('gives 2 base points for technologies that is not an array (enriched raw_data)', () => {
      const lead = makeLead({
        raw_data: { technologies: 'React' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(2)
    })

    it('gives 3 for linkedin_url', () => {
      const lead = makeLead({
        raw_data: { linkedin_url: 'https://linkedin.com/company/test' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(3)
    })

    it('gives 3 for twitter_url', () => {
      const lead = makeLead({
        raw_data: { twitter_url: 'https://twitter.com/test' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(3)
    })

    it('gives social score only once even with both linkedin and twitter', () => {
      const lead = makeLead({
        raw_data: {
          linkedin_url: 'https://linkedin.com/company/test',
          twitter_url: 'https://twitter.com/test',
        },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(3)
    })

    it('caps signals at 20 with all signals present', () => {
      const lead = makeLead({
        raw_data: {
          latest_funding_round: 'Series C',
          is_hiring: true,
          technologies: ['TypeScript', 'AWS'],
          linkedin_url: 'https://linkedin.com/company/test',
          businessModel: 'B2B',
        },
      })
      // 6 + 5 + 4 + 3 + 2 = 20
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.signals).toBe(20)
    })
  })

  // -----------------------------------------------------------------------
  // Timing (max 15)
  // -----------------------------------------------------------------------
  describe('timing scoring', () => {
    it('scores 0 for no activity data', () => {
      const { breakdown } = calculateCompanyScore(makeLead(), defaultIcp)
      expect(breakdown.timing).toBe(0)
    })

    it('gives 8 for activity within 30 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2026-03-10T00:00:00Z' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(8)
    })

    it('gives 5 for activity 31-90 days ago', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2026-01-15T00:00:00Z' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(5)
    })

    it('gives 2 for activity 90-180 days ago', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2025-10-15T00:00:00Z' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(2)
    })

    it('gives 0 for activity older than 180 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2025-05-01T00:00:00Z' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(0)
    })

    it('gives 7 for company updated within 60 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { company_updated_at: '2026-02-15T00:00:00Z' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(7)
    })

    it('gives 4 for company updated 60-180 days ago', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { company_updated_at: '2025-12-01T00:00:00Z' },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(4)
    })

    it('caps timing at 15 with recent activity and recent company update', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: {
          last_activity_date: '2026-03-20T00:00:00Z',
          company_updated_at: '2026-03-15T00:00:00Z',
        },
      })
      const { breakdown } = calculateCompanyScore(lead, defaultIcp)
      // 8 + 7 = 15
      expect(breakdown.timing).toBe(15)
    })
  })

  // -----------------------------------------------------------------------
  // Full company score
  // -----------------------------------------------------------------------
  describe('total company score', () => {
    it('scores 13 base points for empty lead (industry=5 + size=5 + geography=3)', () => {
      const { score } = calculateCompanyScore(makeLead(), defaultIcp)
      expect(score).toBe(13)
    })

    it('scores a well-matched company up to 100', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        industry: 'SaaS Platform',
        company_size: '11-50',
        country: 'Austria',
        company_domain: 'example.at',
        company_name: 'TechCorp GmbH',
        raw_data: {
          latest_funding_round: 'Series A',
          is_hiring: true,
          technologies: ['React'],
          linkedin_url: 'https://linkedin.com/company/test',
          businessModel: 'B2B',
          last_activity_date: '2026-03-20T00:00:00Z',
          company_updated_at: '2026-03-15T00:00:00Z',
        },
      })
      const { score, breakdown } = calculateCompanyScore(lead, defaultIcp)
      // industry=25, size=20, geography=20, signals=20, timing=15 = 100
      expect(breakdown.industry).toBe(25)
      expect(breakdown.company_size).toBe(20)
      expect(breakdown.geography).toBe(20)
      expect(breakdown.signals).toBe(20)
      expect(breakdown.timing).toBe(15)
      expect(score).toBe(100)
    })
  })

  // -----------------------------------------------------------------------
  // Exclusion penalties
  // -----------------------------------------------------------------------
  describe('exclusion penalties', () => {
    it('applies -30 penalty for excluded industry', () => {
      const lead = makeLead({ industry: 'Government' })
      const exclusions = {
        excluded_industries: ['Government'],
        excluded_company_sizes: [],
        excluded_countries: [],
        excluded_keywords: [],
      }
      const { penalties, score } = calculateCompanyScore(lead, defaultIcp, exclusions)
      expect(penalties).toHaveLength(1)
      expect(penalties[0]!.penalty).toBe(-30)
      expect(score).toBe(0)
    })

    it('applies -25 penalty for excluded company size', () => {
      const lead = makeLead({ company_size: '5001+', industry: 'SaaS' })
      const exclusions = {
        excluded_industries: [],
        excluded_company_sizes: ['5001+'],
        excluded_countries: [],
        excluded_keywords: [],
      }
      const { penalties } = calculateCompanyScore(lead, defaultIcp, exclusions)
      expect(penalties).toHaveLength(1)
      expect(penalties[0]!.penalty).toBe(-25)
    })

    it('applies no penalties when no exclusion criteria match', () => {
      const lead = makeLead({ industry: 'SaaS' })
      const exclusions = {
        excluded_industries: ['Government'],
        excluded_company_sizes: [],
        excluded_countries: [],
        excluded_keywords: [],
      }
      const { penalties } = calculateCompanyScore(lead, defaultIcp, exclusions)
      expect(penalties).toHaveLength(0)
    })
  })
})

// ---------------------------------------------------------------------------
// calculatePersonScore — Phase 2 (0-100)
// ---------------------------------------------------------------------------

describe('calculatePersonScore', () => {
  describe('decision maker scoring', () => {
    it('scores 0 for no seniority and no title', () => {
      const { breakdown } = calculatePersonScore(makeLead(), defaultIcp)
      expect(breakdown.decision_maker).toBe(0)
    })

    it('gives seniority score capped at 30 for owner', () => {
      const lead = makeLead({ seniority: 'owner' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(30)
    })

    it('gives seniority score capped at 30 for founder', () => {
      const lead = makeLead({ seniority: 'founder' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(30)
    })

    it('gives 28 for cxo seniority capped at 30', () => {
      const lead = makeLead({ seniority: 'cxo' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(28)
    })

    it('gives 14 for manager seniority', () => {
      const lead = makeLead({ seniority: 'manager' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(14)
    })

    it('gives 8 for senior seniority', () => {
      const lead = makeLead({ seniority: 'senior' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(8)
    })

    it('gives 3 for entry seniority', () => {
      const lead = makeLead({ seniority: 'entry' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(3)
    })

    it('gives 0 for an unknown seniority string', () => {
      const lead = makeLead({ seniority: 'intern' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(0)
    })

    it('seniority lookup is case-insensitive', () => {
      const lead = makeLead({ seniority: 'Director' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.decision_maker).toBe(20)
    })

    it('falls back to DACH title seniority for Geschaeftsfuehrer', () => {
      const lead = makeLead({ job_title: 'Geschäftsführer' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      // No seniority set => DACH title fallback: geschäftsführer=30, capped at 30
      expect(breakdown.decision_maker).toBe(30)
    })
  })

  describe('budget authority scoring', () => {
    it('gives 25 for CFO title', () => {
      const lead = makeLead({ job_title: 'CFO' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.budget_authority).toBe(25)
    })

    it('gives 20 for CEO title', () => {
      const lead = makeLead({ job_title: 'CEO' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.budget_authority).toBe(20)
    })

    it('gives 15 for Director title', () => {
      const lead = makeLead({ job_title: 'Director of Sales' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.budget_authority).toBe(15)
    })

    it('gives 8 for Manager title', () => {
      const lead = makeLead({ job_title: 'Marketing Manager' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.budget_authority).toBe(8)
    })

    it('gives 0 for Junior Developer title', () => {
      const lead = makeLead({ job_title: 'Junior Developer' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.budget_authority).toBe(0)
    })
  })

  describe('champion potential scoring', () => {
    it('gives 25 for Head of title', () => {
      const lead = makeLead({ job_title: 'Head of Product' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.champion_potential).toBe(25)
    })

    it('gives 15 for Specialist title', () => {
      const lead = makeLead({ job_title: 'IT Specialist' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.champion_potential).toBe(15)
    })

    it('gives 10 for Senior title', () => {
      const lead = makeLead({ job_title: 'Senior Engineer' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.champion_potential).toBe(10)
    })

    it('gives 0 for unrecognized title', () => {
      const lead = makeLead({ job_title: 'Intern' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.champion_potential).toBe(0)
    })
  })

  describe('title match scoring', () => {
    it('gives 20 for matching ICP title', () => {
      const lead = makeLead({ job_title: 'CTO' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.title_match).toBe(20)
    })

    it('title match is case-insensitive', () => {
      const lead = makeLead({ job_title: 'head of engineering' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.title_match).toBe(20)
    })

    it('gives 0 for non-matching title', () => {
      const lead = makeLead({ job_title: 'Sales Representative' })
      const { breakdown } = calculatePersonScore(lead, defaultIcp)
      expect(breakdown.title_match).toBe(0)
    })
  })

  describe('total person score', () => {
    it('caps total at 100', () => {
      // owner=30, CEO budget=20, Head of champion=25, CTO title match=20 = 95
      // Use a title that triggers multiple high scores
      const lead = makeLead({ seniority: 'owner', job_title: 'CTO & Head of Finance' })
      const { score } = calculatePersonScore(lead, defaultIcp)
      expect(score).toBeLessThanOrEqual(100)
    })
  })
})

// ---------------------------------------------------------------------------
// calculateTwoPhaseScore
// ---------------------------------------------------------------------------

describe('calculateTwoPhaseScore', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not calculate person score when company score <= 50', () => {
    const lead = makeLead({ industry: 'SaaS', seniority: 'owner', job_title: 'CTO' })
    // Only industry=25 for company score, which is <= 50
    const result = calculateTwoPhaseScore(lead, defaultIcp)
    expect(result.company_qualified).toBe(false)
    expect(result.person_score).toBeNull()
    expect(result.person_breakdown).toBeNull()
  })

  it('calculates person score when company score > 50', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

    const lead = makeLead({
      industry: 'SaaS',
      company_size: '11-50',
      country: 'Austria',
      company_domain: 'example.at',
      seniority: 'cxo',
      job_title: 'CTO',
    })
    // Company: industry=25 + size=20 + geography=18 (15+3) = 63 > 50
    const result = calculateTwoPhaseScore(lead, defaultIcp)
    expect(result.company_qualified).toBe(true)
    expect(result.person_score).not.toBeNull()
    expect(result.person_breakdown).not.toBeNull()
    expect(result.person_breakdown!.decision_maker).toBe(28) // cxo
    expect(result.person_breakdown!.title_match).toBe(20) // CTO matches ICP
  })

  it('returns all two-phase score properties', () => {
    const result = calculateTwoPhaseScore(makeLead(), defaultIcp)
    expect(result).toHaveProperty('company_score')
    expect(result).toHaveProperty('company_breakdown')
    expect(result).toHaveProperty('person_score')
    expect(result).toHaveProperty('person_breakdown')
    expect(result).toHaveProperty('exclusion_penalties')
    expect(result).toHaveProperty('company_qualified')
  })
})

// ---------------------------------------------------------------------------
// Legacy API: calculateRuleScore + totalFromBreakdown
// ---------------------------------------------------------------------------

describe('calculateRuleScore (legacy wrapper)', () => {
  it('returns all four breakdown components', () => {
    const breakdown = calculateRuleScore(makeLead(), defaultIcp)
    expect(breakdown).toHaveProperty('company_fit')
    expect(breakdown).toHaveProperty('contact_fit')
    expect(breakdown).toHaveProperty('buying_signals')
    expect(breakdown).toHaveProperty('timing')
  })

  it('scores an empty lead to 11 (base points: company_fit=10, buying_signals=1)', () => {
    const breakdown = calculateRuleScore(makeLead(), defaultIcp)
    expect(breakdown.company_fit).toBe(10) // industry=5 + company_size=5
    expect(breakdown.buying_signals).toBe(1) // round(signals=0 + geography=3 * 0.25) = 1
    expect(breakdown.contact_fit).toBe(0)
    expect(breakdown.timing).toBe(0)
    const total = totalFromBreakdown(breakdown)
    expect(total).toBe(11)
  })

  it('company_fit maps from industry + company_size of company breakdown', () => {
    const lead = makeLead({ industry: 'SaaS', company_size: '11-50' })
    const breakdown = calculateRuleScore(lead, defaultIcp)
    // industry=25, size=20 => company_fit=45
    expect(breakdown.company_fit).toBe(45)
  })

  it('contact_fit is 0 when company does not qualify', () => {
    // Only industry=25 => company score 25, not qualified
    const lead = makeLead({ industry: 'SaaS', seniority: 'owner', job_title: 'CTO' })
    const breakdown = calculateRuleScore(lead, defaultIcp)
    expect(breakdown.contact_fit).toBe(0)
  })

  it('buying_signals maps from signals + geography*0.25', () => {
    const lead = makeLead({
      raw_data: { latest_funding_round: 'Series A' },
      country: 'Austria',
    })
    const breakdown = calculateRuleScore(lead, defaultIcp)
    // signals=6, geography=15 => buying_signals = round(6 + 15*0.25) = round(9.75) = 10
    expect(breakdown.buying_signals).toBe(10)
  })

  it('timing maps directly from company breakdown timing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

    const lead = makeLead({
      raw_data: { last_activity_date: '2026-03-10T00:00:00Z' },
    })
    const breakdown = calculateRuleScore(lead, defaultIcp)
    expect(breakdown.timing).toBe(8)

    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// totalFromBreakdown
// ---------------------------------------------------------------------------

describe('totalFromBreakdown', () => {
  it('sums all four components', () => {
    const result = totalFromBreakdown({
      company_fit: 30,
      contact_fit: 15,
      buying_signals: 20,
      timing: 10,
    })
    expect(result).toBe(75)
  })

  it('returns 0 for all-zero breakdown', () => {
    const result = totalFromBreakdown({
      company_fit: 0,
      contact_fit: 0,
      buying_signals: 0,
      timing: 0,
    })
    expect(result).toBe(0)
  })

  it('handles partial scores correctly', () => {
    const result = totalFromBreakdown({
      company_fit: 15,
      contact_fit: 8,
      buying_signals: 0,
      timing: 5,
    })
    expect(result).toBe(28)
  })
})

// ---------------------------------------------------------------------------
// combinedScore
// ---------------------------------------------------------------------------

describe('combinedScore', () => {
  it('returns 60% of company score when not qualified', () => {
    const twoPhase: TwoPhaseScore = {
      company_score: 40,
      company_breakdown: { industry: 25, company_size: 0, geography: 15, signals: 0, timing: 0, exclusion_penalty: 0 },
      person_score: null,
      person_breakdown: null,
      exclusion_penalties: [],
      company_qualified: false,
    }
    expect(combinedScore(twoPhase)).toBe(24) // round(40 * 0.6)
  })

  it('returns weighted average when qualified', () => {
    const twoPhase: TwoPhaseScore = {
      company_score: 80,
      company_breakdown: { industry: 25, company_size: 20, geography: 20, signals: 10, timing: 5, exclusion_penalty: 0 },
      person_score: 70,
      person_breakdown: { decision_maker: 30, budget_authority: 20, champion_potential: 0, title_match: 20 },
      exclusion_penalties: [],
      company_qualified: true,
    }
    // round(80 * 0.6 + 70 * 0.4) = round(48 + 28) = 76
    expect(combinedScore(twoPhase)).toBe(76)
  })

  it('returns 0 for score of 0 when not qualified', () => {
    const twoPhase: TwoPhaseScore = {
      company_score: 0,
      company_breakdown: { industry: 0, company_size: 0, geography: 0, signals: 0, timing: 0, exclusion_penalty: 0 },
      person_score: null,
      person_breakdown: null,
      exclusion_penalties: [],
      company_qualified: false,
    }
    expect(combinedScore(twoPhase)).toBe(0)
  })
})
