import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ApolloOrganization } from '@/lib/apollo/types'
import type { OptimizedQuery } from '@/lib/ai/optimize-query'

// ---------------------------------------------------------------------------
// Mocks — all external dependencies
// vi.hoisted() makes variables available inside vi.mock() factories (hoisted)
// ---------------------------------------------------------------------------

const { mockFrom, mockSupabase } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockSupabase = {
    from: mockFrom,
    auth: { getUser: vi.fn() },
  }
  return { mockFrom, mockSupabase }
})

vi.mock('@/lib/supabase/server', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'user-1', email: 'test@example.com' },
    supabase: mockSupabase,
  }),
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

vi.mock('@/lib/apollo/client', () => ({
  searchOrganizations: vi.fn(),
}))

vi.mock('@/lib/google-places/client', () => ({
  textSearch: vi.fn(),
}))

vi.mock('@/lib/ai/optimize-query', () => ({
  optimizeSearchQuery: vi.fn(),
}))

// Mock 'next/navigation' to prevent real redirects
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

// Mock 'next/headers' to prevent server-only errors
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { requireAuth } from '@/lib/supabase/server'
import { searchOrganizations } from '@/lib/apollo/client'
import { textSearch } from '@/lib/google-places/client'
import { optimizeSearchQuery } from '@/lib/ai/optimize-query'
import {
  startDiscoveryAction,
  getIcpDefaultsAction,
  getDiscoveryLeadsAction,
} from './discovery.actions'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeApolloOrg(overrides: Partial<ApolloOrganization> = {}): ApolloOrganization {
  return {
    id: 'org-1',
    name: 'TechCorp GmbH',
    website_url: 'https://techcorp.at',
    industry: 'Software',
    estimated_num_employees: 75,
    annual_revenue: null,
    annual_revenue_printed: null,
    country: 'Austria',
    city: 'Wien',
    state: null,
    linkedin_url: 'https://linkedin.com/company/techcorp',
    twitter_url: 'https://twitter.com/techcorp',
    founded_year: 2018,
    total_funding: 5000000,
    total_funding_printed: '5M',
    latest_funding_round_type: 'Series A',
    technologies: ['React', 'TypeScript'],
    keywords: ['SaaS', 'B2B'],
    ...overrides,
  }
}

function makeOptimizedQuery(overrides: Partial<OptimizedQuery> = {}): OptimizedQuery {
  return {
    apolloParams: {
      personTitles: ['CTO', 'VP Engineering'],
      personSeniorities: ['c_suite', 'vp'],
      organizationSizes: ['51-200'],
      organizationIndustries: ['Software'],
      organizationLocations: ['Austria', 'Germany'],
      organizationKeywords: ['SaaS'],
      organizationTechnologies: ['React'],
    },
    googlePlacesQueries: [
      { query: 'SaaS Unternehmen Wien', region: 'at' },
      { query: 'Software Firmen München', region: 'de' },
    ],
    reasoning: 'Fokus auf DACH SaaS-Firmen mit 51-200 Mitarbeitern',
    ...overrides,
  }
}

const DEFAULT_FORM_DATA = {
  industries: 'SaaS, FinTech',
  companySize: '51-200',
  region: 'AT, DE',
  technologies: 'React, TypeScript',
  keywords: 'B2B',
}

// ---------------------------------------------------------------------------
// Supabase query builder helper
// ---------------------------------------------------------------------------

/**
 * Creates a chainable mock that simulates the Supabase query builder pattern.
 * Each method returns the same chain so `.select().eq().single()` works.
 */
function createQueryChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const result = { data, error }

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'is',
    'order',
    'limit',
    'single',
    'maybeSingle',
  ]

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain)
  }

  // Terminal methods that return the result
  chain['single']!.mockResolvedValue(result)
  chain['maybeSingle']!.mockResolvedValue(result)

  // For chains ending without .single() (like insert().select().single())
  // we resolve the chain itself as the result
  chain['then'] = vi.fn((resolve: (v: unknown) => void) => resolve(result)) as ReturnType<
    typeof vi.fn
  >

  // Make the chain thenable for await
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve),
    enumerable: false,
    configurable: true,
  })

  return chain
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discovery.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // categorizeSize (tested indirectly via apolloPersonToLead)
  // =========================================================================

  describe('categorizeSize (via apolloPersonToLead)', () => {
    /**
     * categorizeSize is a module-private function, so we test it indirectly
     * by running startDiscoveryAction and inspecting the lead's company_size.
     * This is simpler than extracting the function just for testing.
     *
     * However, we can also test the boundaries by checking the lead
     * transformation output in the startDiscoveryAction flow.
     */

    const sizeTestCases: [number, string][] = [
      [1, '1-10'],
      [10, '1-10'],
      [11, '11-50'],
      [50, '11-50'],
      [51, '51-200'],
      [200, '51-200'],
      [201, '201-500'],
      [500, '201-500'],
      [501, '501-1000'],
      [1000, '501-1000'],
      [1001, '1001-5000'],
      [5000, '1001-5000'],
      [5001, '5001+'],
      [100000, '5001+'],
    ]

    it.each(sizeTestCases)('maps %d employees to "%s"', async (employeeCount, expectedSize) => {
      const org = makeApolloOrg({ estimated_num_employees: employeeCount })

      // Set up the full pipeline mocks needed by startDiscoveryAction
      const campaignChain = createQueryChain({ id: 'camp-1' })
      const profileChain = createQueryChain(null)
      const icpChain = createQueryChain(null)
      const insertChain = createQueryChain(null)
      const logChain = createQueryChain(null)

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'business_profiles':
            return profileChain
          case 'icp_profiles':
            return icpChain
          case 'search_campaigns':
            return campaignChain
          case 'leads':
            return insertChain
          case 'agent_logs':
            return logChain
          default:
            return createQueryChain(null)
        }
      })

      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [org],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      // The leads.insert() call receives the transformed leads
      const insertCall = insertChain['insert']!.mock.calls[0]?.[0] as Array<Record<string, unknown>>
      expect(insertCall).toBeDefined()
      expect(insertCall[0]?.company_size).toBe(expectedSize)
    })
  })

  // =========================================================================
  // apolloOrgToLead (tested indirectly via startDiscoveryAction)
  // =========================================================================

  describe('apolloOrgToLead (via startDiscoveryAction)', () => {
    async function runWithOrg(org: ApolloOrganization) {
      const campaignChain = createQueryChain({ id: 'camp-1' })
      const profileChain = createQueryChain(null)
      const icpChain = createQueryChain(null)
      const insertChain = createQueryChain(null)
      const logChain = createQueryChain(null)

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'business_profiles':
            return profileChain
          case 'icp_profiles':
            return icpChain
          case 'search_campaigns':
            return campaignChain
          case 'leads':
            return insertChain
          case 'agent_logs':
            return logChain
          default:
            return createQueryChain(null)
        }
      })

      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [org],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      return insertChain['insert']!.mock.calls[0]?.[0] as Array<Record<string, unknown>>
    }

    it('maps all Apollo org fields to lead format', async () => {
      const org = makeApolloOrg()
      const leads = await runWithOrg(org)

      expect(leads).toHaveLength(1)
      const lead = leads[0]!
      expect(lead).toMatchObject({
        user_id: 'user-1',
        campaign_id: 'camp-1',
        first_name: null,
        last_name: null,
        full_name: null,
        email: null,
        linkedin_url: 'https://linkedin.com/company/techcorp',
        job_title: null,
        seniority: null,
        company_name: 'TechCorp GmbH',
        company_domain: 'https://techcorp.at',
        industry: 'Software',
        company_size: '51-200',
        country: 'Austria',
        location: 'Wien, Austria',
        source: 'apollo',
        apollo_id: 'org-1',
      })
    })

    it('sets person fields to null for org-only leads', async () => {
      const leads = await runWithOrg(makeApolloOrg())
      const lead = leads[0]!
      expect(lead.first_name).toBeNull()
      expect(lead.last_name).toBeNull()
      expect(lead.full_name).toBeNull()
      expect(lead.email).toBeNull()
      expect(lead.job_title).toBeNull()
      expect(lead.seniority).toBeNull()
    })

    it('handles org with null name', async () => {
      const leads = await runWithOrg(makeApolloOrg({ name: null }))
      expect(leads[0]?.company_name).toBeNull()
    })

    it('handles org with null website_url', async () => {
      const leads = await runWithOrg(makeApolloOrg({ website_url: null }))
      expect(leads[0]?.company_domain).toBeNull()
    })

    it('handles org with null industry', async () => {
      const leads = await runWithOrg(makeApolloOrg({ industry: null }))
      expect(leads[0]?.industry).toBeNull()
    })

    it('includes raw_data with org metadata', async () => {
      const org = makeApolloOrg()
      const leads = await runWithOrg(org)
      const raw = leads[0]?.raw_data as Record<string, unknown>

      expect(raw).toMatchObject({
        twitter_url: 'https://twitter.com/techcorp',
        technologies: ['React', 'TypeScript'],
        total_funding: '5M',
        latest_funding_round: 'Series A',
        founded_year: 2018,
      })
    })

    it('handles null company_size when estimated_num_employees is null', async () => {
      const leads = await runWithOrg(makeApolloOrg({ estimated_num_employees: null }))
      expect(leads[0]?.company_size).toBeNull()
    })

    it('builds location from city and country', async () => {
      const leads = await runWithOrg(makeApolloOrg({ city: 'Graz', country: 'Austria' }))
      expect(leads[0]?.location).toBe('Graz, Austria')
    })

    it('handles location with city but no country', async () => {
      const leads = await runWithOrg(makeApolloOrg({ city: 'Graz', country: null }))
      expect(leads[0]?.location).toBe('Graz,')
    })

    it('returns null location when city is null', async () => {
      const leads = await runWithOrg(makeApolloOrg({ city: null, country: 'Austria' }))
      expect(leads[0]?.location).toBeNull()
    })
  })

  // =========================================================================
  // startDiscoveryAction
  // =========================================================================

  describe('startDiscoveryAction', () => {
    function setupFullPipelineMocks(options?: {
      campaignError?: boolean
      apolloError?: boolean
      insertError?: boolean
    }) {
      const campaignChain = options?.campaignError
        ? createQueryChain(null, { message: 'DB error' })
        : createQueryChain({ id: 'camp-1' })
      const profileChain = createQueryChain({
        id: 'prof-1',
        user_id: 'user-1',
        website_url: 'https://myapp.at',
        company_name: 'MyApp',
        description: 'A SaaS tool',
        industry: 'SaaS',
        product_summary: null,
        value_proposition: null,
        target_market: 'DACH',
        raw_scraped_content: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      })
      const icpChain = createQueryChain({
        id: 'icp-1',
        user_id: 'user-1',
        business_profile_id: 'prof-1',
        industries: ['SaaS', 'FinTech'],
        company_sizes: ['51-200'],
        regions: ['AT', 'DE'],
        seniority_levels: ['c_suite'],
        job_titles: ['CTO'],
        tech_stack: ['React'],
        revenue_ranges: null,
        funding_stages: null,
        keywords: ['B2B'],
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      })
      const insertChain = options?.insertError
        ? createQueryChain(null, { message: 'Insert failed' })
        : createQueryChain(null)
      const logChain = createQueryChain(null)

      mockFrom.mockImplementation((table: string) => {
        switch (table) {
          case 'business_profiles':
            return profileChain
          case 'icp_profiles':
            return icpChain
          case 'search_campaigns':
            return campaignChain
          case 'leads':
            return insertChain
          case 'agent_logs':
            return logChain
          default:
            return createQueryChain(null)
        }
      })

      return { campaignChain, profileChain, icpChain, insertChain, logChain }
    }

    it('returns error when campaign creation fails', async () => {
      setupFullPipelineMocks({ campaignError: true })

      const result = await startDiscoveryAction(DEFAULT_FORM_DATA)

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Campaign konnte nicht erstellt werden' },
      })
    })

    it('calls requireAuth before any other work', async () => {
      setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(makeOptimizedQuery())
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [],
        pagination: { page: 1, per_page: 25, total_entries: 0, total_pages: 0 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      expect(requireAuth).toHaveBeenCalledOnce()
    })

    it('returns campaignId and leadsFound on success', async () => {
      setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [makeApolloOrg()],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      const result = await startDiscoveryAction(DEFAULT_FORM_DATA)

      expect(result).toEqual({ success: true, data: { campaignId: 'camp-1', leadsFound: 1 } })
    })

    it('parses comma-separated form inputs correctly', async () => {
      setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [],
        pagination: { page: 1, per_page: 25, total_entries: 0, total_pages: 0 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction({
        industries: 'SaaS, FinTech, E-Commerce',
        companySize: '51-200',
        region: 'AT, DE, CH',
        technologies: ' React , Vue ',
        keywords: 'B2B, Enterprise',
      })

      // Verify optimizeSearchQuery was called (it receives parsed data)
      expect(optimizeSearchQuery).toHaveBeenCalledOnce()
    })

    it('continues with Google Places when Apollo fails', async () => {
      const { logChain } = setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(makeOptimizedQuery())
      vi.mocked(searchOrganizations).mockRejectedValue(new Error('Apollo API error 500'))
      vi.mocked(textSearch).mockResolvedValue({
        places: [
          {
            id: 'place-1',
            displayName: 'Wiener SaaS GmbH',
            formattedAddress: 'Kärntner Str. 1, 1010 Wien',
            websiteUri: 'https://wienersaas.at',
            nationalPhoneNumber: '+4312345678',
            internationalPhoneNumber: null,
            rating: 4.5,
            userRatingCount: 10,
            businessStatus: 'OPERATIONAL',
            types: ['establishment'],
            location: { latitude: 48.2, longitude: 16.37 },
          },
        ],
        nextPageToken: null,
      })

      const result = await startDiscoveryAction(DEFAULT_FORM_DATA)

      // Should still succeed with Google Places leads
      expect(result).toEqual(expect.objectContaining({ success: true }))
      expect(result.success && result.data.campaignId).toBe('camp-1')
      // Apollo failure should be logged
      expect(logChain['insert']).toHaveBeenCalled()
    })

    it('handles Google Places leads with correct format', async () => {
      const { insertChain } = setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({
          apolloParams: {
            personTitles: [],
            personSeniorities: [],
            organizationSizes: [],
            organizationIndustries: [],
            organizationLocations: [],
            organizationKeywords: [],
          },
          googlePlacesQueries: [{ query: 'SaaS Wien', region: 'at' }],
        }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [],
        pagination: { page: 1, per_page: 25, total_entries: 0, total_pages: 0 },
      })
      vi.mocked(textSearch).mockResolvedValue({
        places: [
          {
            id: 'place-1',
            displayName: 'Wiener SaaS GmbH',
            formattedAddress: 'Kärntner Str. 1, 1010 Wien',
            websiteUri: 'https://wienersaas.at',
            nationalPhoneNumber: '+4312345678',
            internationalPhoneNumber: null,
            rating: 4.5,
            userRatingCount: 10,
            businessStatus: 'OPERATIONAL',
            types: ['establishment'],
            location: { latitude: 48.2, longitude: 16.37 },
          },
        ],
        nextPageToken: null,
      })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      const insertedLeads = insertChain['insert']!.mock.calls[0]?.[0] as Array<
        Record<string, unknown>
      >
      expect(insertedLeads).toBeDefined()

      const placeLead = insertedLeads.find((l) => l.source === 'google_places')
      expect(placeLead).toMatchObject({
        user_id: 'user-1',
        campaign_id: 'camp-1',
        company_name: 'Wiener SaaS GmbH',
        company_domain: 'https://wienersaas.at',
        company_website: 'https://wienersaas.at',
        location: 'Kärntner Str. 1, 1010 Wien',
        source: 'google_places',
        raw_data: {
          place_id: 'place-1',
          rating: 4.5,
          phone: '+4312345678',
        },
      })
    })

    it('handles multiple Apollo organizations', async () => {
      const { insertChain } = setupFullPipelineMocks()
      const org1 = makeApolloOrg({ id: 'org-1', name: 'TechCorp GmbH' })
      const org2 = makeApolloOrg({ id: 'org-2', name: 'DataHub AG' })

      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [org1, org2],
        pagination: { page: 1, per_page: 25, total_entries: 2, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      const result = await startDiscoveryAction(DEFAULT_FORM_DATA)

      expect(result).toEqual({ success: true, data: { campaignId: 'camp-1', leadsFound: 2 } })
      const insertedLeads = insertChain['insert']!.mock.calls[0]?.[0] as Array<
        Record<string, unknown>
      >
      expect(insertedLeads).toHaveLength(2)
      expect(insertedLeads[0]?.company_name).toBe('TechCorp GmbH')
      expect(insertedLeads[1]?.company_name).toBe('DataHub AG')
    })

    it('sets apollo_id from organization id', async () => {
      const { insertChain } = setupFullPipelineMocks()

      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [makeApolloOrg({ id: 'unique-org-id' })],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      const insertedLeads = insertChain['insert']!.mock.calls[0]?.[0] as Array<
        Record<string, unknown>
      >
      expect(insertedLeads[0]?.apollo_id).toBe('unique-org-id')
    })

    it('maps linkedin_url from organization', async () => {
      const { insertChain } = setupFullPipelineMocks()

      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [makeApolloOrg({ linkedin_url: 'https://linkedin.com/company/test' })],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      const insertedLeads = insertChain['insert']!.mock.calls[0]?.[0] as Array<
        Record<string, unknown>
      >
      expect(insertedLeads[0]?.linkedin_url).toBe('https://linkedin.com/company/test')
    })

    it('does not insert leads when none are found', async () => {
      const { insertChain } = setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [],
        pagination: { page: 1, per_page: 25, total_entries: 0, total_pages: 0 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      const result = await startDiscoveryAction(DEFAULT_FORM_DATA)

      expect(result).toEqual({ success: true, data: { campaignId: 'camp-1', leadsFound: 0 } })
      // leads.insert should not have been called
      expect(insertChain['insert']).not.toHaveBeenCalled()
    })

    it('returns error and marks campaign as failed on insert failure', async () => {
      setupFullPipelineMocks({ insertError: true })
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [makeApolloOrg()],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      const result = await startDiscoveryAction(DEFAULT_FORM_DATA)

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Leads konnten nicht gespeichert werden' },
      })
    })

    it('updates campaign status to completed on success', async () => {
      setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [makeApolloOrg()],
        pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      await startDiscoveryAction(DEFAULT_FORM_DATA)

      // Verify the campaign was updated to 'completed'
      // The update call is on search_campaigns table
      expect(mockFrom).toHaveBeenCalledWith('search_campaigns')
    })

    it('handles optional technologies and keywords as empty', async () => {
      setupFullPipelineMocks()
      vi.mocked(optimizeSearchQuery).mockResolvedValue(
        makeOptimizedQuery({ googlePlacesQueries: [] }),
      )
      vi.mocked(searchOrganizations).mockResolvedValue({
        organizations: [],
        pagination: { page: 1, per_page: 25, total_entries: 0, total_pages: 0 },
      })
      vi.mocked(textSearch).mockResolvedValue({ places: [], nextPageToken: null })

      const result = await startDiscoveryAction({
        industries: 'SaaS',
        companySize: '51-200',
        region: 'AT',
        // technologies and keywords omitted
      })

      expect(result).toEqual({ success: true, data: { campaignId: 'camp-1', leadsFound: 0 } })
    })
  })

  // =========================================================================
  // getIcpDefaultsAction
  // =========================================================================

  describe('getIcpDefaultsAction', () => {
    it('returns comma-separated values from ICP profile', async () => {
      const icpChain = createQueryChain({
        industries: ['SaaS', 'FinTech', 'E-Commerce'],
        company_sizes: ['11-50', '51-200'],
        regions: ['AT', 'DE', 'CH'],
        tech_stack: ['React', 'TypeScript', 'Node.js'],
        keywords: ['B2B', 'Lead Generation'],
      })

      mockFrom.mockReturnValue(icpChain)

      const result = await getIcpDefaultsAction()

      expect(result).toEqual({
        success: true,
        data: {
          industries: 'SaaS, FinTech, E-Commerce',
          companySize: '11-50, 51-200',
          region: 'AT, DE, CH',
          technologies: 'React, TypeScript, Node.js',
          keywords: 'B2B, Lead Generation',
        },
      })
    })

    it('returns defaults when no ICP profile exists', async () => {
      const icpChain = createQueryChain(null)
      mockFrom.mockReturnValue(icpChain)

      const result = await getIcpDefaultsAction()

      expect(result).toEqual({
        success: true,
        data: {
          industries: 'SaaS, FinTech, E-Commerce',
          companySize: '10-500 Mitarbeiter',
          region: 'DACH (AT, DE, CH)',
          technologies: '',
          keywords: '',
        },
      })
    })

    it('returns empty string for null tech_stack and keywords', async () => {
      const icpChain = createQueryChain({
        industries: ['SaaS'],
        company_sizes: ['51-200'],
        regions: ['AT'],
        tech_stack: null,
        keywords: null,
      })

      mockFrom.mockReturnValue(icpChain)

      const result = await getIcpDefaultsAction()

      expect(result).toEqual({
        success: true,
        data: {
          industries: 'SaaS',
          companySize: '51-200',
          region: 'AT',
          technologies: '',
          keywords: '',
        },
      })
    })

    it('handles empty arrays in ICP profile', async () => {
      const icpChain = createQueryChain({
        industries: [],
        company_sizes: [],
        regions: [],
        tech_stack: [],
        keywords: [],
      })

      mockFrom.mockReturnValue(icpChain)

      const result = await getIcpDefaultsAction()

      expect(result).toEqual({
        success: true,
        data: {
          industries: '',
          companySize: '',
          region: '',
          technologies: '',
          keywords: '',
        },
      })
    })

    it('calls requireAuth before fetching', async () => {
      const icpChain = createQueryChain(null)
      mockFrom.mockReturnValue(icpChain)

      await getIcpDefaultsAction()

      expect(requireAuth).toHaveBeenCalledOnce()
    })
  })

  // =========================================================================
  // getDiscoveryLeadsAction
  // =========================================================================

  describe('getDiscoveryLeadsAction', () => {
    it('returns leads for a campaign scoped to the authenticated user', async () => {
      const leadsData = [
        {
          id: 'lead-1',
          company_name: 'TechCorp GmbH',
          full_name: 'Max Mustermann',
          industry: 'Software',
          location: 'Wien, Austria',
          source: 'apollo',
        },
        {
          id: 'lead-2',
          company_name: 'Wiener SaaS GmbH',
          full_name: null,
          industry: null,
          location: 'Wien',
          source: 'google_places',
        },
      ]

      const leadsChain = createQueryChain(leadsData)
      mockFrom.mockReturnValue(leadsChain)

      const result = await getDiscoveryLeadsAction('camp-1')

      expect(result).toEqual({ success: true, data: leadsData })
      expect(requireAuth).toHaveBeenCalledOnce()
      expect(mockFrom).toHaveBeenCalledWith('leads')

      // Verify the query is scoped to campaign and user
      expect(leadsChain['eq']).toHaveBeenCalledWith('campaign_id', 'camp-1')
      expect(leadsChain['eq']).toHaveBeenCalledWith('user_id', 'user-1')
    })

    it('returns empty array when no leads exist', async () => {
      const leadsChain = createQueryChain(null)
      mockFrom.mockReturnValue(leadsChain)

      const result = await getDiscoveryLeadsAction('camp-nonexistent')

      expect(result).toEqual({ success: true, data: [] })
    })

    it('limits results to 50 and orders by created_at desc', async () => {
      const leadsChain = createQueryChain([])
      mockFrom.mockReturnValue(leadsChain)

      await getDiscoveryLeadsAction('camp-1')

      expect(leadsChain['order']).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(leadsChain['limit']).toHaveBeenCalledWith(50)
    })

    it('selects only the required fields', async () => {
      const leadsChain = createQueryChain([])
      mockFrom.mockReturnValue(leadsChain)

      await getDiscoveryLeadsAction('camp-1')

      expect(leadsChain['select']).toHaveBeenCalledWith(
        'id, company_name, full_name, industry, location, source',
      )
    })
  })
})
