import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

const mockUser = { id: 'test-user-id', email: 'test@example.com' }

// Supabase query builder mock with full chaining support
function createMockSupabaseClient(overrides?: {
  upsertResult?: { data: unknown; error: unknown }
}) {
  const defaultResult = { data: { id: 'biz-profile-id' }, error: null }
  const upsertResult = overrides?.upsertResult ?? defaultResult

  const chainable = {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(upsertResult),
  }

  return {
    from: vi.fn().mockReturnValue(chainable),
    _chainable: chainable,
  } as unknown as SupabaseClient
}

let mockSupabase: SupabaseClient

vi.mock('@/lib/supabase/server', () => ({
  requireAuth: vi.fn(async () => ({ user: mockUser, supabase: mockSupabase })),
  createClient: vi.fn(),
}))

vi.mock('@/lib/scraper', () => ({
  scrapeWebsite: vi.fn(),
}))

vi.mock('@/lib/ai/analyze-website', () => ({
  analyzeWebsite: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports — after mocks
// ---------------------------------------------------------------------------

import {
  analyzeWebsiteAction,
  saveOnboardingAction,
  type ProfileData,
  type IcpData,
} from './onboarding.actions'
import { scrapeWebsite } from '@/lib/scraper'
import { analyzeWebsite } from '@/lib/ai/analyze-website'
import { redirect } from 'next/navigation'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const validProfile: ProfileData = {
  website_url: 'https://example.com',
  company_name: 'Acme GmbH',
  description: 'B2B SaaS for sales teams',
  industry: 'SaaS',
  product_summary: 'Lead scoring; CRM integration',
  value_proposition: 'Save 50% time on lead qualification',
  target_market: 'KMU in SaaS, E-Commerce',
  raw_scraped_content: 'Acme GmbH — We help B2B teams.',
}

const validIcp: IcpData = {
  job_titles: ['Head of Sales', 'VP Sales'],
  seniority_levels: ['director', 'vp'],
  industries: ['SaaS', 'E-Commerce'],
  company_sizes: ['11-50', '51-200'],
  regions: ['DACH'],
}

const mockScrapedContent = {
  url: 'https://example.com',
  title: 'Acme GmbH',
  metaDescription: 'B2B SaaS',
  headings: ['Our Product'],
  bodyText: 'We help sales teams.',
  aboutSection: 'About us...',
  servicesSection: 'Services...',
  footerText: 'Footer',
}

const mockAnalysis = {
  companyName: 'Acme GmbH',
  industry: 'SaaS',
  businessModel: 'B2B' as const,
  productsServices: ['Lead scoring', 'CRM integration'],
  tonality: 'Professional' as const,
  valueProposition: 'Save 50% time on lead qualification',
  targetCustomers: {
    industries: ['SaaS', 'E-Commerce'],
    companySize: 'KMU',
    painPoints: ['Manual lead qualification'],
  },
  suggestedJobTitles: ['Head of Sales', 'VP Sales'],
  suggestedSeniorityLevels: ['director', 'vp'],
  suggestedCompanySizes: ['11-50', '51-200'],
  suggestedRegions: ['DACH'],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('onboarding.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  // =========================================================================
  // analyzeWebsiteAction
  // =========================================================================
  describe('analyzeWebsiteAction', () => {
    // -- URL validation -------------------------------------------------------

    it('returns error for empty URL', async () => {
      const result = await analyzeWebsiteAction('')

      expect(result.success).toBe(false)
    })

    it('returns error for obviously invalid URL', async () => {
      const result = await analyzeWebsiteAction('not a url at all !!!')

      expect(result.success).toBe(false)
    })

    it('returns error for URL with spaces', async () => {
      const result = await analyzeWebsiteAction('https://ex ample.com')

      expect(result.success).toBe(false)
    })

    it('returns error for javascript: protocol URL', async () => {
      // javascript:alert(1) should not pass the url() validator
      const result = await analyzeWebsiteAction('javascript:alert(1)')

      // The action prepends https:// when input doesn't start with 'http',
      // so "javascript:alert(1)" becomes "https://javascript:alert(1)" which
      // is still invalid according to Zod's url() check.
      expect(result.success).toBe(false)
    })

    it('accepts valid https URL and calls scrape + analyze', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toHaveProperty('profile')
      expect(result.data).toHaveProperty('icp')
      expect(scrapeWebsite).toHaveBeenCalledWith('https://example.com')
      expect(analyzeWebsite).toHaveBeenCalledWith(mockScrapedContent)
    })

    it('accepts valid http URL', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('http://example.com')

      expect(result.success).toBe(true)
      expect(scrapeWebsite).toHaveBeenCalledWith('http://example.com')
    })

    it('prepends https:// when protocol is missing', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('example.com')

      expect(result.success).toBe(true)
      expect(scrapeWebsite).toHaveBeenCalledWith('https://example.com')
    })

    it('prepends https:// for domain with path but no protocol', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      await analyzeWebsiteAction('example.com/about')

      expect(scrapeWebsite).toHaveBeenCalledWith('https://example.com/about')
    })

    // -- Profile construction -------------------------------------------------

    it('constructs profile data from analysis result', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.profile).toMatchObject({
        website_url: 'https://example.com',
        company_name: 'Acme GmbH',
        industry: 'SaaS',
        description: 'Lead scoring, CRM integration',
        product_summary: 'Lead scoring; CRM integration',
        value_proposition: 'Save 50% time on lead qualification',
        target_market: 'KMU in SaaS, E-Commerce',
      })
    })

    it('builds raw_scraped_content from title, meta, and body', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.profile.raw_scraped_content).toContain('Acme GmbH')
      expect(result.data.profile.raw_scraped_content).toContain('B2B SaaS')
      expect(result.data.profile.raw_scraped_content).toContain('We help sales teams.')
    })

    it('constructs ICP data from analysis result', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.icp).toEqual({
        job_titles: ['Head of Sales', 'VP Sales'],
        seniority_levels: ['director', 'vp'],
        industries: ['SaaS', 'E-Commerce'],
        company_sizes: ['11-50', '51-200'],
        regions: ['DACH'],
      })
    })

    // -- Error handling -------------------------------------------------------

    it('returns error message when scrapeWebsite throws', async () => {
      vi.mocked(scrapeWebsite).mockRejectedValue(new Error('Website nicht erreichbar'))

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Website nicht erreichbar' },
      })
    })

    it('returns error message when analyzeWebsite throws', async () => {
      vi.mocked(scrapeWebsite).mockResolvedValue(mockScrapedContent)
      vi.mocked(analyzeWebsite).mockRejectedValue(new Error('AI service unavailable'))

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'AI service unavailable' },
      })
    })

    // -- Edge cases -----------------------------------------------------------

    it('handles scraped content with missing optional fields', async () => {
      const minimalScraped = {
        url: 'https://example.com',
        title: '',
        metaDescription: '',
        headings: [],
        bodyText: 'Some content here.',
        aboutSection: '',
        servicesSection: '',
        footerText: '',
      }
      vi.mocked(scrapeWebsite).mockResolvedValue(minimalScraped)
      vi.mocked(analyzeWebsite).mockResolvedValue(mockAnalysis)

      const result = await analyzeWebsiteAction('https://example.com')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      // raw_scraped_content should only contain the non-empty bodyText
      expect(result.data.profile.raw_scraped_content).toBe('Some content here.')
    })
  })

  // =========================================================================
  // saveOnboardingAction
  // =========================================================================
  describe('saveOnboardingAction', () => {
    // -- Profile validation ---------------------------------------------------

    it('returns error when profile company_name is empty', async () => {
      const badProfile = { ...validProfile, company_name: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile description is empty', async () => {
      const badProfile = { ...validProfile, description: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile industry is empty', async () => {
      const badProfile = { ...validProfile, industry: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile product_summary is empty', async () => {
      const badProfile = { ...validProfile, product_summary: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile value_proposition is empty', async () => {
      const badProfile = { ...validProfile, value_proposition: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile target_market is empty', async () => {
      const badProfile = { ...validProfile, target_market: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile website_url is empty', async () => {
      const badProfile = { ...validProfile, website_url: '' }

      const result = await saveOnboardingAction(badProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('allows raw_scraped_content to be an empty string', async () => {
      const profileWithEmptyRaw = { ...validProfile, raw_scraped_content: '' }

      const result = await saveOnboardingAction(profileWithEmptyRaw, validIcp)

      // Empty raw_scraped_content is allowed (schema is z.string() without min)
      // Should not fail validation — proceeds to DB call
      expect(result).not.toMatchObject({
        success: false,
        error: { message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile has missing required field', async () => {
      const incomplete = { ...validProfile } as Record<string, unknown>
      delete incomplete.industry

      const result = await saveOnboardingAction(incomplete as unknown as ProfileData, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    it('returns error when profile field has wrong type', async () => {
      const wrongType = { ...validProfile, company_name: 123 }

      const result = await saveOnboardingAction(wrongType as unknown as ProfileData, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Profildaten' },
      })
    })

    // -- ICP validation -------------------------------------------------------

    it('returns error when ICP has wrong type for job_titles', async () => {
      const badIcp = { ...validIcp, job_titles: 'not an array' }

      const result = await saveOnboardingAction(validProfile, badIcp as unknown as IcpData)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige ICP-Daten' },
      })
    })

    it('returns error when ICP is missing a required field', async () => {
      const incomplete = { ...validIcp } as Record<string, unknown>
      delete incomplete.regions

      const result = await saveOnboardingAction(validProfile, incomplete as unknown as IcpData)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige ICP-Daten' },
      })
    })

    it('returns error when ICP arrays contain non-string values', async () => {
      const badIcp = { ...validIcp, industries: [123, 456] }

      const result = await saveOnboardingAction(validProfile, badIcp as unknown as IcpData)

      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige ICP-Daten' },
      })
    })

    it('accepts ICP with empty arrays', async () => {
      const emptyIcp: IcpData = {
        job_titles: [],
        seniority_levels: [],
        industries: [],
        company_sizes: [],
        regions: [],
      }

      const result = await saveOnboardingAction(validProfile, emptyIcp)

      // Empty arrays are valid per the schema — proceeds to DB call
      expect(result).not.toMatchObject({
        success: false,
        error: { message: 'Ungültige ICP-Daten' },
      })
    })

    // -- Supabase interaction -------------------------------------------------

    it('upserts profile and ICP then redirects on success', async () => {
      const upsertResult = { data: { id: 'biz-profile-id' }, error: null }
      mockSupabase = createMockSupabaseClient({ upsertResult })

      // redirect throws to halt execution (Next.js behavior)
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error('NEXT_REDIRECT')
      })

      await expect(saveOnboardingAction(validProfile, validIcp)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith('/dashboard')

      // Verify the supabase calls were made
      const fromMock = mockSupabase.from as ReturnType<typeof vi.fn>
      expect(fromMock).toHaveBeenCalledWith('business_profiles')
      expect(fromMock).toHaveBeenCalledWith('icp_profiles')
    })

    it('returns error when business_profiles upsert fails', async () => {
      mockSupabase = createMockSupabaseClient({
        upsertResult: { data: null, error: { message: 'DB error' } },
      })

      const result = await saveOnboardingAction(validProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Fehler beim Speichern des Profils' },
      })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('returns error when business_profiles upsert returns null data', async () => {
      mockSupabase = createMockSupabaseClient({
        upsertResult: { data: null, error: null },
      })

      const result = await saveOnboardingAction(validProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Fehler beim Speichern des Profils' },
      })
    })

    it('returns error when icp_profiles upsert fails', async () => {
      // First call (business_profiles) succeeds, second call (icp_profiles) fails
      const chainable = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }

      chainable.single
        // business_profiles upsert -> success
        .mockImplementationOnce(() =>
          Promise.resolve({ data: { id: 'biz-profile-id' }, error: null }),
        )

      const icpChainable = {
        upsert: vi.fn().mockResolvedValue({ data: null, error: { message: 'ICP error' } }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      }

      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'business_profiles') return chainable
          return icpChainable
        }),
      } as unknown as SupabaseClient

      const result = await saveOnboardingAction(validProfile, validIcp)

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Fehler beim Speichern des ICP' },
      })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('passes user.id to upsert calls', async () => {
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error('NEXT_REDIRECT')
      })

      const upsertSpy = vi.fn().mockReturnThis()
      const selectSpy = vi.fn().mockReturnThis()
      const singleSpy = vi.fn().mockResolvedValue({
        data: { id: 'biz-123' },
        error: null,
      })

      const icpUpsertSpy = vi.fn().mockResolvedValue({ data: {}, error: null })

      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'business_profiles') {
            return { upsert: upsertSpy, select: selectSpy, single: singleSpy }
          }
          return { upsert: icpUpsertSpy }
        }),
      } as unknown as SupabaseClient

      // The chain: from().upsert().select().single()
      upsertSpy.mockReturnValue({ select: selectSpy })
      selectSpy.mockReturnValue({ single: singleSpy })

      await expect(saveOnboardingAction(validProfile, validIcp)).rejects.toThrow('NEXT_REDIRECT')

      // Verify user_id is passed in business_profiles upsert
      expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'test-user-id' }), {
        onConflict: 'user_id',
      })

      // Verify user_id and business_profile_id in icp_profiles upsert
      expect(icpUpsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          business_profile_id: 'biz-123',
        }),
        { onConflict: 'user_id' },
      )
    })
  })
})
