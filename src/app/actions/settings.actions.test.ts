import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks -----------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  requireAuth: vi.fn(),
}))

// next/navigation — redirect is called by requireAuth on auth failure
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// --- Imports (after mocks) -------------------------------------------

import {
  loadSettingsData,
  updateProfileAction,
  updateIcpAction,
  saveCommunicationStyleAction,
  getCommunicationStyleAction,
} from './settings.actions'
import { requireAuth } from '@/lib/supabase/server'
import {
  createMockQueryBuilder,
  TEST_USER,
  assertSuccess,
  assertFail,
} from '@/lib/testing'

// --- Helpers ---------------------------------------------------------

/**
 * Sets up mock Supabase client with separate query builders per table.
 * Routes `from('business_profiles')` and `from('icp_profiles')` to
 * different query builders, each with their own resolved values.
 */
function mockLoadAuth(
  profileResult: { data: unknown; error: unknown },
  icpResult: { data: unknown; error: unknown },
) {
  const profileBuilder = createMockQueryBuilder(profileResult)
  const icpBuilder = createMockQueryBuilder(icpResult)

  const mockFrom = vi.fn((table: string) => {
    if (table === 'business_profiles') return profileBuilder
    if (table === 'icp_profiles') return icpBuilder
    return profileBuilder // fallback
  })

  const supabase = { from: mockFrom }

  vi.mocked(requireAuth).mockResolvedValue({
    user: TEST_USER as never,
    supabase: supabase as never,
  })

  return { supabase, profileBuilder, icpBuilder }
}

/**
 * Sets up mock for update actions (updateProfileAction, updateIcpAction).
 * The `update().eq()` chain resolves the terminal value.
 */
function mockUpdateAuth(updateResult: { error: unknown }) {
  const queryBuilder = createMockQueryBuilder({ data: null, error: null })

  // Override eq to resolve the update result (terminal call after update)
  queryBuilder.eq.mockResolvedValue(updateResult)

  const supabase = { from: vi.fn().mockReturnValue(queryBuilder) }

  vi.mocked(requireAuth).mockResolvedValue({
    user: TEST_USER as never,
    supabase: supabase as never,
  })

  return { supabase, queryBuilder }
}

// --- Tests -----------------------------------------------------------

describe('settings.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =====================================================================
  // loadSettingsData
  // =====================================================================
  describe('loadSettingsData', () => {
    it('returns profile, icp, and email when both exist', async () => {
      const profileData = {
        id: '1',
        user_id: 'test-user-id',
        company_name: 'Acme GmbH',
        industry: 'SaaS',
      }
      const icpData = {
        id: '2',
        user_id: 'test-user-id',
        industries: ['SaaS'],
        company_sizes: ['51-200'],
      }

      const { supabase } = mockLoadAuth(
        { data: profileData, error: null },
        { data: icpData, error: null },
      )

      const result = await loadSettingsData()
      const data = assertSuccess(result)

      expect(data.profile).toEqual(profileData)
      expect(data.icp).toEqual(icpData)
      expect(data.email).toBe('test@example.com')

      // Verify correct tables were queried
      expect(supabase.from).toHaveBeenCalledWith('business_profiles')
      expect(supabase.from).toHaveBeenCalledWith('icp_profiles')
    })

    it('returns null profile when none exists', async () => {
      mockLoadAuth(
        { data: null, error: { code: 'PGRST116', message: 'not found' } },
        { data: { industries: ['Tech'], company_sizes: [] }, error: null },
      )

      const result = await loadSettingsData()
      const data = assertSuccess(result)

      expect(data.profile).toBeNull()
      expect(data.icp).toEqual({ industries: ['Tech'], company_sizes: [] })
      expect(data.email).toBe('test@example.com')
    })

    it('returns null icp when none exists', async () => {
      mockLoadAuth(
        { data: { company_name: 'Test Co' }, error: null },
        { data: null, error: { code: 'PGRST116', message: 'not found' } },
      )

      const result = await loadSettingsData()
      const data = assertSuccess(result)

      expect(data.profile).toEqual({ company_name: 'Test Co' })
      expect(data.icp).toBeNull()
      expect(data.email).toBe('test@example.com')
    })

    it('returns empty string email when user email is undefined', async () => {
      // Use a custom user with no email
      const userNoEmail = { ...TEST_USER, email: undefined }

      const profileBuilder = createMockQueryBuilder({ data: null, error: null })
      const icpBuilder = createMockQueryBuilder({ data: null, error: null })

      const mockFrom = vi.fn((table: string) => {
        if (table === 'business_profiles') return profileBuilder
        if (table === 'icp_profiles') return icpBuilder
        return profileBuilder
      })

      vi.mocked(requireAuth).mockResolvedValue({
        user: userNoEmail as never,
        supabase: { from: mockFrom } as never,
      })

      const result = await loadSettingsData()
      const data = assertSuccess(result)

      expect(data.email).toBe('')
    })
  })

  // =====================================================================
  // updateProfileAction
  // =====================================================================
  describe('updateProfileAction', () => {
    it('validates required company_name — rejects empty string', async () => {
      mockUpdateAuth({ error: null })

      const result = await updateProfileAction({
        company_name: '',
        industry: 'SaaS',
      })

      const error = assertFail(result)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Ungültige Profildaten')
    })

    it('validates required company_name — rejects missing field', async () => {
      mockUpdateAuth({ error: null })

      // Cast to bypass TS to test runtime validation
      const result = await updateProfileAction({} as Parameters<typeof updateProfileAction>[0])

      const error = assertFail(result)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Ungültige Profildaten')
    })

    it('accepts valid profile data and returns success', async () => {
      const { supabase, queryBuilder } = mockUpdateAuth({ error: null })

      const result = await updateProfileAction({
        company_name: 'Acme GmbH',
        industry: 'SaaS',
        description: 'We build things',
        target_market: 'DACH',
        website_url: 'https://acme.at',
      })

      expect(result).toEqual({ success: true, data: null })

      expect(supabase.from).toHaveBeenCalledWith('business_profiles')
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Acme GmbH',
          industry: 'SaaS',
          description: 'We build things',
          target_market: 'DACH',
          website_url: 'https://acme.at',
        }),
      )
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    })

    it('accepts minimal valid data with only company_name', async () => {
      const { queryBuilder } = mockUpdateAuth({ error: null })

      const result = await updateProfileAction({
        company_name: 'Minimal Co',
      })

      expect(result).toEqual({ success: true, data: null })
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Minimal Co',
          industry: null,
          description: null,
          target_market: null,
          website_url: null,
        }),
      )
    })

    it('returns error on DB failure', async () => {
      mockUpdateAuth({
        error: { code: '42501', message: 'RLS policy violation' },
      })

      const result = await updateProfileAction({
        company_name: 'Acme GmbH',
      })

      const error = assertFail(result)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.message).toBe('Profil konnte nicht gespeichert werden')
    })

    it('sets updated_at timestamp on update', async () => {
      const { queryBuilder } = mockUpdateAuth({ error: null })

      const before = new Date().toISOString()
      await updateProfileAction({ company_name: 'Test' })

      const updatePayload = queryBuilder.update.mock.calls[0]?.[0] as
        | Record<string, string>
        | undefined
      expect(updatePayload).toHaveProperty('updated_at')
      expect(new Date(updatePayload!.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000,
      )
    })
  })

  // =====================================================================
  // updateIcpAction
  // =====================================================================
  describe('updateIcpAction', () => {
    const validIcp = {
      industries: ['SaaS', 'FinTech'],
      company_sizes: ['11-50', '51-200'],
      regions: ['DACH', 'Nordics'],
      job_titles: ['CTO', 'VP Engineering'],
      seniority_levels: ['C-Level', 'VP'],
    }

    it('accepts valid ICP arrays and returns success', async () => {
      const { supabase, queryBuilder } = mockUpdateAuth({ error: null })

      const result = await updateIcpAction(validIcp)

      expect(result).toEqual({ success: true, data: null })

      expect(supabase.from).toHaveBeenCalledWith('icp_profiles')
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          industries: ['SaaS', 'FinTech'],
          company_sizes: ['11-50', '51-200'],
          regions: ['DACH', 'Nordics'],
          job_titles: ['CTO', 'VP Engineering'],
          seniority_levels: ['C-Level', 'VP'],
          additional_info: null,
        }),
      )
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    })

    it('accepts empty arrays', async () => {
      const { queryBuilder } = mockUpdateAuth({ error: null })

      const emptyIcp = {
        industries: [],
        company_sizes: [],
        regions: [],
        job_titles: [],
        seniority_levels: [],
      }

      const result = await updateIcpAction(emptyIcp)

      expect(result).toEqual({ success: true, data: null })
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          industries: [],
          company_sizes: [],
          regions: [],
          job_titles: [],
          seniority_levels: [],
          additional_info: null,
        }),
      )
    })

    it('returns error on DB failure', async () => {
      mockUpdateAuth({
        error: { code: '42501', message: 'RLS policy violation' },
      })

      const result = await updateIcpAction(validIcp)

      const error = assertFail(result)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.message).toBe('ICP konnte nicht gespeichert werden')
    })

    it('rejects invalid data — missing required arrays', async () => {
      mockUpdateAuth({ error: null })

      const result = await updateIcpAction({
        industries: ['SaaS'],
      } as Parameters<typeof updateIcpAction>[0])

      const error = assertFail(result)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Ungültige ICP-Daten')
    })

    it('rejects invalid data — wrong types in arrays', async () => {
      mockUpdateAuth({ error: null })

      const result = await updateIcpAction({
        industries: [123 as unknown as string],
        company_sizes: ['OK'],
        regions: ['OK'],
        job_titles: ['OK'],
        seniority_levels: ['OK'],
      })

      const error = assertFail(result)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Ungültige ICP-Daten')
    })

    it('sets updated_at timestamp on update', async () => {
      const { queryBuilder } = mockUpdateAuth({ error: null })

      const before = new Date().toISOString()
      await updateIcpAction(validIcp)

      const updatePayload = queryBuilder.update.mock.calls[0]?.[0] as
        | Record<string, string>
        | undefined
      expect(updatePayload).toHaveProperty('updated_at')
      expect(new Date(updatePayload!.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000,
      )
    })

    it('should persist additional_info field', async () => {
      const { supabase, queryBuilder } = mockUpdateAuth({ error: null })

      const icpWithAdditionalInfo = {
        industries: ['SaaS'],
        company_sizes: ['11-50'],
        regions: ['DACH'],
        job_titles: ['CTO'],
        seniority_levels: ['C-Level'],
        additional_info: 'kein Franchise, mind. 2 Jahre am Markt',
      }

      const result = await updateIcpAction(icpWithAdditionalInfo)

      expect(result).toEqual({ success: true, data: null })
      expect(supabase.from).toHaveBeenCalledWith('icp_profiles')
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          additional_info: 'kein Franchise, mind. 2 Jahre am Markt',
        }),
      )
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    })
  })

  // =====================================================================
  // saveCommunicationStyleAction
  // =====================================================================
  describe('saveCommunicationStyleAction', () => {
    const validStyle = {
      email_example: 'Hallo Herr Müller, ...',
      email_signature: 'Mit freundlichen Grüßen, Sarah',
      writing_style: 'formal',
      salutation_preference: 'sie' as const,
      voice_example: 'Guten Tag, hier ist Sarah von...',
      speaking_style: 'freundlich und professionell',
      opening_phrase: 'Darf ich Ihnen kurz vorstellen...',
      call_to_action: 'Wollen wir einen Termin vereinbaren?',
      additional_notes: 'DACH-Markt, immer Sie-Ansprache',
    }

    it('saves valid communication style data and returns success', async () => {
      const { supabase, queryBuilder } = mockUpdateAuth({ error: null })

      const result = await saveCommunicationStyleAction(validStyle)

      expect(result).toEqual({ success: true, data: null })
      expect(supabase.from).toHaveBeenCalledWith('business_profiles')
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          communication_style: validStyle,
        }),
      )
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    })

    it('accepts empty/minimal data with defaults applied', async () => {
      const { queryBuilder } = mockUpdateAuth({ error: null })

      const result = await saveCommunicationStyleAction({})

      expect(result).toEqual({ success: true, data: null })
      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          communication_style: {
            email_example: '',
            email_signature: '',
            writing_style: '',
            salutation_preference: 'sie',
            voice_example: '',
            speaking_style: '',
            opening_phrase: '',
            call_to_action: '',
            additional_notes: '',
          },
        }),
      )
    })

    it('rejects invalid salutation_preference value', async () => {
      mockUpdateAuth({ error: null })

      const result = await saveCommunicationStyleAction({
        salutation_preference: 'ihr' as 'du' | 'sie',
      })

      const error = assertFail(result)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Ungültige Kommunikationsstil-Daten')
    })

    it('returns error on DB failure', async () => {
      mockUpdateAuth({
        error: { code: '42501', message: 'RLS policy violation' },
      })

      const result = await saveCommunicationStyleAction(validStyle)

      const error = assertFail(result)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.message).toBe('Kommunikationsstil konnte nicht gespeichert werden')
    })

    it('sets updated_at timestamp on update', async () => {
      const { queryBuilder } = mockUpdateAuth({ error: null })

      const before = new Date().toISOString()
      await saveCommunicationStyleAction(validStyle)

      const updatePayload = queryBuilder.update.mock.calls[0]?.[0] as
        | Record<string, string>
        | undefined
      expect(updatePayload).toHaveProperty('updated_at')
      expect(new Date(updatePayload!.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000,
      )
    })
  })

  // =====================================================================
  // getCommunicationStyleAction
  // =====================================================================
  describe('getCommunicationStyleAction', () => {
    /**
     * Sets up mock for getCommunicationStyleAction.
     * The `select().eq().single()` chain resolves the terminal value.
     */
    function mockGetAuth(selectResult: { data: unknown; error: unknown }) {
      const queryBuilder = createMockQueryBuilder(selectResult)

      const supabase = { from: vi.fn().mockReturnValue(queryBuilder) }

      vi.mocked(requireAuth).mockResolvedValue({
        user: TEST_USER as never,
        supabase: supabase as never,
      })

      return { supabase, queryBuilder }
    }

    it('returns communication style data when it exists', async () => {
      const styleData = {
        email_example: 'Hallo...',
        salutation_preference: 'du',
        writing_style: 'casual',
      }
      const { supabase } = mockGetAuth({
        data: { communication_style: styleData },
        error: null,
      })

      const result = await getCommunicationStyleAction()
      const data = assertSuccess(result)

      expect(data).toEqual(styleData)
      expect(supabase.from).toHaveBeenCalledWith('business_profiles')
    })

    it('returns empty object when communication_style is null', async () => {
      mockGetAuth({
        data: { communication_style: null },
        error: null,
      })

      const result = await getCommunicationStyleAction()
      const data = assertSuccess(result)

      expect(data).toEqual({})
    })

    it('returns empty object when communication_style is undefined', async () => {
      mockGetAuth({
        data: {},
        error: null,
      })

      const result = await getCommunicationStyleAction()
      const data = assertSuccess(result)

      expect(data).toEqual({})
    })

    it('returns error on DB failure', async () => {
      mockGetAuth({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      })

      const result = await getCommunicationStyleAction()

      const error = assertFail(result)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.message).toBe('Kommunikationsstil konnte nicht geladen werden')
    })
  })
})
