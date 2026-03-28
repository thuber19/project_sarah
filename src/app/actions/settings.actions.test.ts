import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks -----------------------------------------------------------

// Supabase query builder chain: from(table).select('*').eq(col, val).single()
// and: from(table).update({...}).eq(col, val)
const mockSingle = vi.fn()
const mockSelectEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }))

const mockUpdateEq = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const mockUpdate = vi.fn((_payload: any) => ({ eq: mockUpdateEq })) // _payload accessed via mock.calls

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}))

const mockSupabase = {
  from: mockFrom,
  auth: {
    getUser: vi.fn(),
  },
}

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
}

vi.mock('@/lib/supabase/server', () => ({
  requireAuth: vi.fn(async () => ({
    user: mockUser,
    supabase: mockSupabase,
  })),
}))

// next/navigation — redirect is called by requireAuth on auth failure
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// --- Imports (after mocks) -------------------------------------------

import { loadSettingsData, updateProfileAction, updateIcpAction } from './settings.actions'

// --- Helpers ---------------------------------------------------------

function resetSupabaseMocks() {
  mockFrom.mockClear()
  mockSelect.mockClear()
  mockSelectEq.mockClear()
  mockSingle.mockClear()
  mockUpdate.mockClear()
  mockUpdateEq.mockClear()
}

// --- Tests -----------------------------------------------------------

describe('settings.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSupabaseMocks()
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

      mockSingle
        .mockResolvedValueOnce({ data: profileData, error: null })
        .mockResolvedValueOnce({ data: icpData, error: null })

      const result = await loadSettingsData()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.profile).toEqual(profileData)
      expect(result.data.icp).toEqual(icpData)
      expect(result.data.email).toBe('test@example.com')

      // Verify correct tables were queried
      expect(mockFrom).toHaveBeenCalledWith('business_profiles')
      expect(mockFrom).toHaveBeenCalledWith('icp_profiles')
    })

    it('returns null profile when none exists', async () => {
      mockSingle
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        .mockResolvedValueOnce({
          data: { industries: ['Tech'], company_sizes: [] },
          error: null,
        })

      const result = await loadSettingsData()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.profile).toBeNull()
      expect(result.data.icp).toEqual({ industries: ['Tech'], company_sizes: [] })
      expect(result.data.email).toBe('test@example.com')
    })

    it('returns null icp when none exists', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: { company_name: 'Test Co' },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } })

      const result = await loadSettingsData()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.profile).toEqual({ company_name: 'Test Co' })
      expect(result.data.icp).toBeNull()
      expect(result.data.email).toBe('test@example.com')
    })

    it('returns empty string email when user email is undefined', async () => {
      // Temporarily override the mock user email
      const originalEmail = mockUser.email
      ;(mockUser as Record<string, string | undefined>).email = undefined

      mockSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const result = await loadSettingsData()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.email).toBe('')

      // Restore
      ;(mockUser as Record<string, string | undefined>).email = originalEmail
    })
  })

  // =====================================================================
  // updateProfileAction
  // =====================================================================
  describe('updateProfileAction', () => {
    it('validates required company_name — rejects empty string', async () => {
      const result = await updateProfileAction({
        company_name: '',
        industry: 'SaaS',
      })

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Profildaten')
      // Should not attempt DB update
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('validates required company_name — rejects missing field', async () => {
      // Cast to bypass TS to test runtime validation
      const result = await updateProfileAction({} as Parameters<typeof updateProfileAction>[0])

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Profildaten')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('accepts valid profile data and returns success', async () => {
      mockUpdateEq.mockResolvedValueOnce({ error: null })

      const result = await updateProfileAction({
        company_name: 'Acme GmbH',
        industry: 'SaaS',
        description: 'We build things',
        target_market: 'DACH',
        website_url: 'https://acme.at',
      })

      expect(result).toEqual({ success: true, data: null })

      expect(mockFrom).toHaveBeenCalledWith('business_profiles')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Acme GmbH',
          industry: 'SaaS',
          description: 'We build things',
          target_market: 'DACH',
          website_url: 'https://acme.at',
        }),
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'test-user-id')
    })

    it('accepts minimal valid data with only company_name', async () => {
      mockUpdateEq.mockResolvedValueOnce({ error: null })

      const result = await updateProfileAction({
        company_name: 'Minimal Co',
      })

      expect(result).toEqual({ success: true, data: null })
      expect(mockUpdate).toHaveBeenCalledWith(
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
      mockUpdateEq.mockResolvedValueOnce({
        error: { code: '42501', message: 'RLS policy violation' },
      })

      const result = await updateProfileAction({
        company_name: 'Acme GmbH',
      })

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('Profil konnte nicht gespeichert werden')
    })

    it('sets updated_at timestamp on update', async () => {
      mockUpdateEq.mockResolvedValueOnce({ error: null })

      const before = new Date().toISOString()
      await updateProfileAction({ company_name: 'Test' })

      const updatePayload = mockUpdate.mock.calls[0]?.[0] as Record<string, string> | undefined
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
      tech_stack: ['React', 'Node.js'],
    }

    it('accepts valid ICP arrays and returns success', async () => {
      mockUpdateEq.mockResolvedValueOnce({ error: null })

      const result = await updateIcpAction(validIcp)

      expect(result).toEqual({ success: true, data: null })

      expect(mockFrom).toHaveBeenCalledWith('icp_profiles')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          industries: ['SaaS', 'FinTech'],
          company_sizes: ['11-50', '51-200'],
          regions: ['DACH', 'Nordics'],
          job_titles: ['CTO', 'VP Engineering'],
          seniority_levels: ['C-Level', 'VP'],
          tech_stack: ['React', 'Node.js'],
        }),
      )
      expect(mockUpdateEq).toHaveBeenCalledWith('user_id', 'test-user-id')
    })

    it('accepts empty arrays', async () => {
      mockUpdateEq.mockResolvedValueOnce({ error: null })

      const emptyIcp = {
        industries: [],
        company_sizes: [],
        regions: [],
        job_titles: [],
        seniority_levels: [],
        tech_stack: [],
      }

      const result = await updateIcpAction(emptyIcp)

      expect(result).toEqual({ success: true, data: null })
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          industries: [],
          company_sizes: [],
          regions: [],
          job_titles: [],
          seniority_levels: [],
          tech_stack: [],
        }),
      )
    })

    it('returns error on DB failure', async () => {
      mockUpdateEq.mockResolvedValueOnce({
        error: { code: '42501', message: 'RLS policy violation' },
      })

      const result = await updateIcpAction(validIcp)

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('ICP konnte nicht gespeichert werden')
    })

    it('rejects invalid data — missing required arrays', async () => {
      const result = await updateIcpAction({
        industries: ['SaaS'],
      } as Parameters<typeof updateIcpAction>[0])

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige ICP-Daten')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('rejects invalid data — wrong types in arrays', async () => {
      const result = await updateIcpAction({
        industries: [123 as unknown as string],
        company_sizes: ['OK'],
        regions: ['OK'],
        job_titles: ['OK'],
        seniority_levels: ['OK'],
        tech_stack: ['OK'],
      })

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige ICP-Daten')
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('sets updated_at timestamp on update', async () => {
      mockUpdateEq.mockResolvedValueOnce({ error: null })

      const before = new Date().toISOString()
      await updateIcpAction(validIcp)

      const updatePayload = mockUpdate.mock.calls[0]?.[0] as Record<string, string> | undefined
      expect(updatePayload).toHaveProperty('updated_at')
      expect(new Date(updatePayload!.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime() - 1000,
      )
    })
  })
})
