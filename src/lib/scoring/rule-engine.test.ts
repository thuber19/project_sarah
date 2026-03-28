// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest'

import { calculateRuleScore, totalFromBreakdown, type ICP } from './rule-engine'
import { getGradeForScore, type Lead } from '@/types/lead'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'test-1',
    user_id: 'u-1',
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    title: null,
    seniority: null,
    company_name: null,
    company_domain: null,
    company_industry: null,
    company_size: null,
    company_revenue: null,
    company_country: null,
    company_city: null,
    source: 'apollo',
    source_id: null,
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
// calculateRuleScore
// ---------------------------------------------------------------------------

describe('calculateRuleScore', () => {
  // Use fake timers so timing-related tests are deterministic
  afterEach(() => {
    vi.useRealTimers()
  })

  // -----------------------------------------------------------------------
  // company_fit (max 40)
  // -----------------------------------------------------------------------
  describe('company_fit', () => {
    it('scores 0 for empty lead', () => {
      const breakdown = calculateRuleScore(makeLead(), defaultIcp)
      expect(breakdown.company_fit).toBe(0)
    })

    it('gives 15 for matching industry', () => {
      const lead = makeLead({ company_industry: 'Enterprise SaaS' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(15)
    })

    it('does not score industry when there is no match', () => {
      const lead = makeLead({ company_industry: 'Healthcare' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(0)
    })

    it('industry match is case-insensitive', () => {
      const lead = makeLead({ company_industry: 'fintech' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(15)
    })

    it('gives 10 for DACH country (Austria)', () => {
      const lead = makeLead({ company_country: 'austria' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(10)
    })

    it('gives 10 for DACH country using German spelling (Österreich)', () => {
      const lead = makeLead({ company_country: 'Österreich' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(10)
    })

    it('gives 10 for DACH country using ISO code (DE)', () => {
      const lead = makeLead({ company_country: 'DE' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(10)
    })

    it('gives 10 for DACH country (Deutschland)', () => {
      const lead = makeLead({ company_country: 'Deutschland' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(10)
    })

    it('gives 10 for DACH country (Switzerland)', () => {
      const lead = makeLead({ company_country: 'Switzerland' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(10)
    })

    it('gives 7 for non-DACH target country', () => {
      const icp: ICP = {
        ...defaultIcp,
        target_countries: ['austria', 'germany', 'netherlands'],
      }
      const lead = makeLead({ company_country: 'Netherlands' })
      const breakdown = calculateRuleScore(lead, icp)
      expect(breakdown.company_fit).toBe(7)
    })

    it('gives 0 for a country not in DACH and not in ICP targets', () => {
      const lead = makeLead({ company_country: 'Japan' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(0)
    })

    it('gives 10 for matching company size from ICP targets', () => {
      const lead = makeLead({ company_size: '11-50' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(10)
    })

    it('gives capped size score for non-target size', () => {
      // '51-200' has a COMPANY_SIZE_SCORES of 15, but if it is NOT in ICP targets,
      // it gets min(15, 7) = 7. Let's use a size that is not in the ICP.
      const icp: ICP = { ...defaultIcp, target_company_sizes: ['1-10'] }
      const lead = makeLead({ company_size: '51-200' })
      const breakdown = calculateRuleScore(lead, icp)
      expect(breakdown.company_fit).toBe(7)
    })

    it('gives lower capped size score for small non-target size', () => {
      // '1-10' has COMPANY_SIZE_SCORES of 5, not in target => min(5, 7) = 5
      const icp: ICP = { ...defaultIcp, target_company_sizes: ['51-200'] }
      const lead = makeLead({ company_size: '1-10' })
      const breakdown = calculateRuleScore(lead, icp)
      expect(breakdown.company_fit).toBe(5)
    })

    it('gives 5 for having a domain', () => {
      const lead = makeLead({ company_domain: 'example.com' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(5)
    })

    it('caps company_fit at 40 for a perfect match', () => {
      const lead = makeLead({
        company_industry: 'SaaS Platform',
        company_size: '11-50',
        company_country: 'Austria',
        company_domain: 'example.at',
      })
      // industry=15 + size=10 + DACH=10 + domain=5 = 40
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(40)
    })

    it('does not exceed 40 even with max sub-scores', () => {
      // '51-200' is in ICP targets and has a higher internal score (15)
      // but as a target size it scores 10 regardless. Total: 15+10+10+5=40
      const lead = makeLead({
        company_industry: 'FinTech Solutions',
        company_size: '51-200',
        company_country: 'germany',
        company_domain: 'fintech.de',
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.company_fit).toBe(40)
    })
  })

  // -----------------------------------------------------------------------
  // contact_fit (max 20)
  // -----------------------------------------------------------------------
  describe('contact_fit', () => {
    it('scores 0 for no seniority and no title', () => {
      const breakdown = calculateRuleScore(makeLead(), defaultIcp)
      expect(breakdown.contact_fit).toBe(0)
    })

    it('gives seniority score capped at 12 for owner (raw=20)', () => {
      const lead = makeLead({ seniority: 'owner' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(12)
    })

    it('gives seniority score capped at 12 for founder (raw=20)', () => {
      const lead = makeLead({ seniority: 'founder' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(12)
    })

    it('gives seniority score capped at 12 for cxo (raw=18)', () => {
      const lead = makeLead({ seniority: 'cxo' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(12)
    })

    it('gives seniority of 10 for manager', () => {
      const lead = makeLead({ seniority: 'manager' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(10)
    })

    it('gives seniority of 6 for senior', () => {
      const lead = makeLead({ seniority: 'senior' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(6)
    })

    it('gives seniority of 2 for entry', () => {
      const lead = makeLead({ seniority: 'entry' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(2)
    })

    it('gives 0 for an unknown seniority string', () => {
      const lead = makeLead({ seniority: 'intern' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(0)
    })

    it('gives 8 for matching title from ICP targets', () => {
      const lead = makeLead({ title: 'CTO' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(8)
    })

    it('title match is case-insensitive', () => {
      const lead = makeLead({ title: 'head of engineering' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(8)
    })

    it('gives 5 for executive title not in ICP targets', () => {
      const lead = makeLead({ title: 'CEO' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(5)
    })

    it('gives 17 for Geschaeftsfuehrer title (DACH seniority 12 + executive fallback 5)', () => {
      const lead = makeLead({ title: 'Geschäftsführer' })
      // No seniority set → DACH_TITLE_SENIORITY fallback: geschäftsführer=20, min(20,12)=12
      // Title also matches executive fallback list: +5
      // Total: 12 + 5 = 17
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(17)
    })

    it('gives 8 for Director title that substring-matches CTO in ICP', () => {
      // Note: "director" contains the substring "cto", so the ICP title match fires
      const lead = makeLead({ title: 'Director of Sales' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(8)
    })

    it('gives 5 for VP title not in ICP targets', () => {
      const lead = makeLead({ title: 'VP of Marketing' })
      // 'VP of Marketing' does not match 'CTO' or 'Head of Engineering'
      // but contains 'vp' => executive fallback 5
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(5)
    })

    it('gives 0 for a non-executive title not in ICP', () => {
      const lead = makeLead({ title: 'Junior Developer' })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(0)
    })

    it('caps contact_fit at 20 with max seniority + matching title', () => {
      const lead = makeLead({ seniority: 'owner', title: 'CTO' })
      // seniority: min(20,12)=12, title match=8 => 20
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(20)
    })

    it('does not exceed 20 even with high seniority + executive fallback', () => {
      const lead = makeLead({ seniority: 'founder', title: 'CEO' })
      // seniority: min(20,12)=12, title fallback=5 => 17, capped at 20 => 17
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(17)
    })

    it('seniority lookup is case-insensitive', () => {
      const lead = makeLead({ seniority: 'Director' })
      // 'director' in SENIORITY_SCORES = 14, capped at 12
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.contact_fit).toBe(12)
    })
  })

  // -----------------------------------------------------------------------
  // buying_signals (max 25)
  // -----------------------------------------------------------------------
  describe('buying_signals', () => {
    it('scores 0 for no raw_data', () => {
      const breakdown = calculateRuleScore(makeLead(), defaultIcp)
      expect(breakdown.buying_signals).toBe(0)
    })

    it('scores 0 for empty raw_data', () => {
      const lead = makeLead({ raw_data: {} })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(0)
    })

    it('gives 8 for latest_funding_round', () => {
      const lead = makeLead({
        raw_data: { latest_funding_round: 'Series A' },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(8)
    })

    it('gives 8 for total_funding', () => {
      const lead = makeLead({
        raw_data: { total_funding: 5_000_000 },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(8)
    })

    it('gives 8 only once even if both funding fields present', () => {
      const lead = makeLead({
        raw_data: { latest_funding_round: 'Series B', total_funding: 20_000_000 },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      // funding signal fires once => 8, not 16
      expect(breakdown.buying_signals).toBe(8)
    })

    it('gives 7 for is_hiring', () => {
      const lead = makeLead({
        raw_data: { is_hiring: true },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(7)
    })

    it('gives 7 for job_postings', () => {
      const lead = makeLead({
        raw_data: { job_postings: 12 },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(7)
    })

    it('gives 5 for technologies array with entries', () => {
      const lead = makeLead({
        raw_data: { technologies: ['React', 'Node.js'] },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(5)
    })

    it('gives 0 for empty technologies array', () => {
      const lead = makeLead({
        raw_data: { technologies: [] },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(0)
    })

    it('gives 0 for technologies that is not an array', () => {
      const lead = makeLead({
        raw_data: { technologies: 'React' },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(0)
    })

    it('gives 5 for linkedin_url', () => {
      const lead = makeLead({
        raw_data: { linkedin_url: 'https://linkedin.com/company/test' },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(5)
    })

    it('gives 5 for twitter_url', () => {
      const lead = makeLead({
        raw_data: { twitter_url: 'https://twitter.com/test' },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(5)
    })

    it('gives social score only once even with both linkedin and twitter', () => {
      const lead = makeLead({
        raw_data: {
          linkedin_url: 'https://linkedin.com/company/test',
          twitter_url: 'https://twitter.com/test',
        },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      // social fires once => 5, not 10
      expect(breakdown.buying_signals).toBe(5)
    })

    it('caps buying_signals at 25 with all signals present', () => {
      const lead = makeLead({
        raw_data: {
          latest_funding_round: 'Series C',
          is_hiring: true,
          technologies: ['TypeScript', 'AWS'],
          linkedin_url: 'https://linkedin.com/company/test',
        },
      })
      // 8 + 7 + 5 + 5 = 25
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.buying_signals).toBe(25)
    })
  })

  // -----------------------------------------------------------------------
  // timing (max 15)
  // -----------------------------------------------------------------------
  describe('timing', () => {
    it('scores 0 for no activity data', () => {
      const breakdown = calculateRuleScore(makeLead(), defaultIcp)
      expect(breakdown.timing).toBe(0)
    })

    it('scores 0 for empty raw_data', () => {
      const lead = makeLead({ raw_data: {} })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(0)
    })

    it('gives 8 for activity within 30 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2026-03-10T00:00:00Z' },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(8)
    })

    it('gives 5 for activity 31-90 days ago', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2026-01-15T00:00:00Z' },
      })
      // ~72 days ago => 31-90 bracket
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(5)
    })

    it('gives 2 for activity 90-180 days ago', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2025-10-15T00:00:00Z' },
      })
      // ~164 days ago => 90-180 bracket
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(2)
    })

    it('gives 0 for activity older than 180 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { last_activity_date: '2025-05-01T00:00:00Z' },
      })
      // ~331 days ago => beyond 180 bracket
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(0)
    })

    it('gives 7 for company updated within 60 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { company_updated_at: '2026-02-15T00:00:00Z' },
      })
      // ~41 days ago => within 60
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(7)
    })

    it('gives 4 for company updated 60-180 days ago', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { company_updated_at: '2025-12-01T00:00:00Z' },
      })
      // ~117 days ago => 60-180 bracket
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(4)
    })

    it('gives 0 for company updated older than 180 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: { company_updated_at: '2025-05-01T00:00:00Z' },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(0)
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
      // activity < 30d = 8, company < 60d = 7 => 15
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBe(15)
    })

    it('does not exceed 15 even with both maximum scores', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        raw_data: {
          last_activity_date: '2026-03-27T00:00:00Z',
          company_updated_at: '2026-03-27T00:00:00Z',
        },
      })
      // 8 + 7 = 15, capped at 15
      const breakdown = calculateRuleScore(lead, defaultIcp)
      expect(breakdown.timing).toBeLessThanOrEqual(15)
      expect(breakdown.timing).toBe(15)
    })
  })

  // -----------------------------------------------------------------------
  // Full integration
  // -----------------------------------------------------------------------
  describe('full lead scoring', () => {
    it('returns all four breakdown components', () => {
      const breakdown = calculateRuleScore(makeLead(), defaultIcp)
      expect(breakdown).toHaveProperty('company_fit')
      expect(breakdown).toHaveProperty('contact_fit')
      expect(breakdown).toHaveProperty('buying_signals')
      expect(breakdown).toHaveProperty('timing')
    })

    it('scores a perfect lead to 100', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))

      const lead = makeLead({
        company_industry: 'SaaS',
        company_size: '11-50',
        company_country: 'Austria',
        company_domain: 'example.at',
        seniority: 'owner',
        title: 'CTO',
        raw_data: {
          latest_funding_round: 'Series A',
          is_hiring: true,
          technologies: ['React'],
          linkedin_url: 'https://linkedin.com/company/test',
          last_activity_date: '2026-03-20T00:00:00Z',
          company_updated_at: '2026-03-15T00:00:00Z',
        },
      })
      const breakdown = calculateRuleScore(lead, defaultIcp)
      const total = totalFromBreakdown(breakdown)
      // company_fit=40, contact_fit=20, buying_signals=25, timing=15
      expect(total).toBe(100)
    })

    it('scores an empty lead to 0', () => {
      const breakdown = calculateRuleScore(makeLead(), defaultIcp)
      const total = totalFromBreakdown(breakdown)
      expect(total).toBe(0)
    })
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

  it('returns 100 for max breakdown', () => {
    const result = totalFromBreakdown({
      company_fit: 40,
      contact_fit: 20,
      buying_signals: 25,
      timing: 15,
    })
    expect(result).toBe(100)
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
// getGradeForScore
// ---------------------------------------------------------------------------

describe('getGradeForScore', () => {
  it('returns HOT for score >= 80', () => {
    expect(getGradeForScore(95)).toBe('HOT')
  })

  it('returns QUALIFIED for score 65-79', () => {
    expect(getGradeForScore(70)).toBe('QUALIFIED')
  })

  it('returns ENGAGED for score 48-64', () => {
    expect(getGradeForScore(55)).toBe('ENGAGED')
  })

  it('returns POTENTIAL for score 30-47', () => {
    expect(getGradeForScore(35)).toBe('POTENTIAL')
  })

  it('returns POOR for score < 30', () => {
    expect(getGradeForScore(20)).toBe('POOR')
  })

  // Boundary tests
  it('handles boundary: 80 is HOT', () => {
    expect(getGradeForScore(80)).toBe('HOT')
  })

  it('handles boundary: 79 is QUALIFIED', () => {
    expect(getGradeForScore(79)).toBe('QUALIFIED')
  })

  it('handles boundary: 65 is QUALIFIED', () => {
    expect(getGradeForScore(65)).toBe('QUALIFIED')
  })

  it('handles boundary: 64 is ENGAGED', () => {
    expect(getGradeForScore(64)).toBe('ENGAGED')
  })

  it('handles boundary: 48 is ENGAGED', () => {
    expect(getGradeForScore(48)).toBe('ENGAGED')
  })

  it('handles boundary: 47 is POTENTIAL', () => {
    expect(getGradeForScore(47)).toBe('POTENTIAL')
  })

  it('handles boundary: 30 is POTENTIAL', () => {
    expect(getGradeForScore(30)).toBe('POTENTIAL')
  })

  it('handles boundary: 29 is POOR', () => {
    expect(getGradeForScore(29)).toBe('POOR')
  })

  it('handles boundary: 0 is POOR', () => {
    expect(getGradeForScore(0)).toBe('POOR')
  })

  it('handles boundary: 100 is HOT', () => {
    expect(getGradeForScore(100)).toBe('HOT')
  })
})
