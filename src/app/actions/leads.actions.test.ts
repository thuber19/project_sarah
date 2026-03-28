import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  requireAuth: vi.fn(),
}))

// next/navigation redirect is used inside requireAuth; stub it so the import
// does not blow up in a non-Next.js test environment.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { getLeadsAction } from './leads.actions'
import { requireAuth } from '@/lib/supabase/server'
import {
  createMockQueryBuilder,
  createMockSupabaseClient,
  TEST_USER,
  assertSuccess,
} from '@/lib/testing'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sets up a mock Supabase client and wires it into requireAuth().
 *
 * Uses the shared `createMockQueryBuilder` and `createMockSupabaseClient`,
 * then overrides `range` to be a terminal resolver (the leads query ends with
 * `.range()` which must resolve the PostgREST response).
 */
function mockAuth(
  data: unknown[] = [],
  count: number = 0,
  error: null | { message: string } = null,
) {
  const queryBuilder = createMockQueryBuilder({ data, error, count })

  // In the leads action, `.range()` is the terminal call that resolves
  // the query — override the default chainable behavior.
  queryBuilder.range.mockResolvedValue({ data, count, error })

  const supabase = createMockSupabaseClient(queryBuilder)

  vi.mocked(requireAuth).mockResolvedValue({
    user: TEST_USER as never,
    supabase: supabase as never,
  })

  return { supabase, query: queryBuilder }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getLeadsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Auth
  // -----------------------------------------------------------------------

  it('should call requireAuth before doing anything else', async () => {
    mockAuth()
    await getLeadsAction({})
    expect(requireAuth).toHaveBeenCalledOnce()
  })

  // -----------------------------------------------------------------------
  // Zod validation
  // -----------------------------------------------------------------------

  describe('Zod validation', () => {
    it('should use defaults for empty params', async () => {
      const { supabase, query } = mockAuth()
      await getLeadsAction({})

      // Default sort is total_score desc
      expect(supabase.from).toHaveBeenCalledWith('leads')
      expect(query.order).toHaveBeenCalledWith('total_score', {
        ascending: false,
        referencedTable: 'lead_scores',
      })
      // Default page 1 → range(0, 19)
      expect(query.range).toHaveBeenCalledWith(0, 19)
    })

    it('should return validation error for invalid grade value', async () => {
      mockAuth()
      const result = await getLeadsAction({ grade: 'INVALID_GRADE' })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })

    it('should return validation error for negative page number', async () => {
      mockAuth()
      const result = await getLeadsAction({ page: '-1' })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })

    it('should return validation error for page 0', async () => {
      mockAuth()
      const result = await getLeadsAction({ page: '0' })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })

    it('should return validation error for non-numeric page', async () => {
      mockAuth()
      const result = await getLeadsAction({ page: 'abc' })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })

    it('should accept valid params', async () => {
      const { query } = mockAuth()
      await getLeadsAction({
        grade: 'HOT',
        q: 'test',
        sort: 'company_name',
        dir: 'asc',
        page: '2',
      })

      // Should reach the query builder (no early return)
      expect(query.select).toHaveBeenCalled()
    })

    it('should return validation error for q longer than 100 chars', async () => {
      mockAuth()
      const longQ = 'a'.repeat(101)
      const result = await getLeadsAction({ q: longQ })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })

    it('should accept q at exactly 100 chars', async () => {
      const { query } = mockAuth()
      const maxQ = 'a'.repeat(100)
      await getLeadsAction({ q: maxQ })
      expect(query.select).toHaveBeenCalled()
    })

    it('should return validation error for invalid sort field', async () => {
      mockAuth()
      const result = await getLeadsAction({ sort: 'nonexistent_column' })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })

    it('should return validation error for invalid dir value', async () => {
      mockAuth()
      const result = await getLeadsAction({ dir: 'sideways' })
      expect(result).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Ungültige Suchparameter' },
      })
    })
  })

  // -----------------------------------------------------------------------
  // Grade filter
  // -----------------------------------------------------------------------

  describe('grade filter', () => {
    it('should not apply grade filter when grade is ALL', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'ALL' })

      // select should use LEFT JOIN (no !inner)
      const selectArg = query.select.mock.calls[0][0] as string
      expect(selectArg).toContain('lead_scores(')
      expect(selectArg).not.toContain('lead_scores!inner(')

      // eq should only be called once — for user_id, not for grade
      expect(query.eq).toHaveBeenCalledTimes(1)
      expect(query.eq).toHaveBeenCalledWith('user_id', TEST_USER.id)
    })

    it('should use !inner join and eq filter for grade HOT', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'HOT' })

      const selectArg = query.select.mock.calls[0][0] as string
      expect(selectArg).toContain('lead_scores!inner(')

      // eq called twice: user_id + lead_scores.grade
      expect(query.eq).toHaveBeenCalledWith('user_id', TEST_USER.id)
      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'HOT')
    })

    it('should map POOR_FIT to in-filter with POOR and POOR_FIT for DB query', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'POOR_FIT' })

      expect(query.in).toHaveBeenCalledWith('lead_scores.grade', ['POOR', 'POOR_FIT'])
    })

    it('should map TOP_MATCH to in-filter with HOT, QUALIFIED, and TOP_MATCH', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'TOP_MATCH' })

      expect(query.in).toHaveBeenCalledWith('lead_scores.grade', ['HOT', 'QUALIFIED', 'TOP_MATCH'])
    })

    it('should map GOOD_FIT to in-filter with ENGAGED, POTENTIAL, and GOOD_FIT', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'GOOD_FIT' })

      expect(query.in).toHaveBeenCalledWith('lead_scores.grade', ['ENGAGED', 'POTENTIAL', 'GOOD_FIT'])
    })

    it('should pass through legacy QUALIFIED grade unchanged via eq', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'QUALIFIED' })

      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'QUALIFIED')
    })

    it('should pass through legacy ENGAGED grade unchanged via eq', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'ENGAGED' })

      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'ENGAGED')
    })

    it('should pass through legacy POTENTIAL grade unchanged via eq', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'POTENTIAL' })

      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'POTENTIAL')
    })
  })

  // -----------------------------------------------------------------------
  // Text search
  // -----------------------------------------------------------------------

  describe('text search', () => {
    it('should add ilike filter when q is provided', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ q: 'acme' })

      expect(query.or).toHaveBeenCalledWith(
        'company_name.ilike.%acme%,first_name.ilike.%acme%,last_name.ilike.%acme%',
      )
    })

    it('should skip search when q is empty string', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ q: '' })

      expect(query.or).not.toHaveBeenCalled()
    })

    it('should skip search when q is not provided', async () => {
      const { query } = mockAuth()
      await getLeadsAction({})

      expect(query.or).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // Sorting
  // -----------------------------------------------------------------------

  describe('sorting', () => {
    it('should sort by total_score with referencedTable for score sort', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ sort: 'total_score', dir: 'desc' })

      expect(query.order).toHaveBeenCalledWith('total_score', {
        ascending: false,
        referencedTable: 'lead_scores',
      })
    })

    it('should sort by total_score ascending when dir is asc', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ sort: 'total_score', dir: 'asc' })

      expect(query.order).toHaveBeenCalledWith('total_score', {
        ascending: true,
        referencedTable: 'lead_scores',
      })
    })

    it('should sort by company_name without referencedTable', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ sort: 'company_name', dir: 'asc' })

      expect(query.order).toHaveBeenCalledWith('company_name', {
        ascending: true,
      })
    })

    it('should sort by created_at without referencedTable', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ sort: 'created_at', dir: 'desc' })

      expect(query.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      })
    })
  })

  // -----------------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------------

  describe('pagination', () => {
    it('should calculate correct range for page 1', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ page: '1' })

      // page 1 → from=0, to=19
      expect(query.range).toHaveBeenCalledWith(0, 19)
    })

    it('should calculate correct range for page 2', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ page: '2' })

      // page 2 → from=20, to=39
      expect(query.range).toHaveBeenCalledWith(20, 39)
    })

    it('should calculate correct range for page 3', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ page: '3' })

      // page 3 → from=40, to=59
      expect(query.range).toHaveBeenCalledWith(40, 59)
    })
  })

  // -----------------------------------------------------------------------
  // Result mapping
  // -----------------------------------------------------------------------

  describe('result mapping', () => {
    it('should flatten nested lead_scores array into LeadListItem', async () => {
      const dbRow = {
        id: 'lead-1',
        company_name: 'Acme Corp',
        first_name: 'Jane',
        last_name: 'Doe',
        industry: 'SaaS',
        location: 'Vienna',
        updated_at: '2026-03-28T10:00:00Z',
        lead_scores: [{ total_score: 85, grade: 'QUALIFIED' }],
      }

      mockAuth([dbRow], 1)
      const result = await getLeadsAction({})
      const data = assertSuccess(result)

      expect(data.leads).toHaveLength(1)
      expect(data.leads[0]).toEqual({
        id: 'lead-1',
        company_name: 'Acme Corp',
        first_name: 'Jane',
        last_name: 'Doe',
        industry: 'SaaS',
        location: 'Vienna',
        total_score: 85,
        grade: 'QUALIFIED',
        updated_at: '2026-03-28T10:00:00Z',
      })
    })

    it('should flatten lead_scores when returned as object (not array)', async () => {
      const dbRow = {
        id: 'lead-2',
        company_name: 'Beta Inc',
        first_name: 'John',
        last_name: 'Smith',
        industry: 'FinTech',
        location: 'Berlin',
        updated_at: '2026-03-27T12:00:00Z',
        lead_scores: { total_score: 92, grade: 'HOT' },
      }

      mockAuth([dbRow], 1)
      const result = await getLeadsAction({})
      const data = assertSuccess(result)

      expect(data.leads[0]).toMatchObject({
        total_score: 92,
        grade: 'HOT',
      })
    })

    it('should handle leads without scores (null lead_scores)', async () => {
      const dbRow = {
        id: 'lead-3',
        company_name: 'NoScore GmbH',
        first_name: null,
        last_name: null,
        industry: null,
        location: null,
        updated_at: '2026-03-26T08:00:00Z',
        lead_scores: null,
      }

      mockAuth([dbRow], 1)
      const result = await getLeadsAction({})
      const data = assertSuccess(result)

      expect(data.leads[0]).toEqual({
        id: 'lead-3',
        company_name: 'NoScore GmbH',
        first_name: null,
        last_name: null,
        industry: null,
        location: null,
        total_score: null,
        grade: null,
        updated_at: '2026-03-26T08:00:00Z',
      })
    })

    it('should handle empty lead_scores array', async () => {
      const dbRow = {
        id: 'lead-4',
        company_name: 'Empty Array Inc',
        first_name: 'A',
        last_name: 'B',
        industry: null,
        location: null,
        updated_at: '2026-03-25T06:00:00Z',
        lead_scores: [],
      }

      mockAuth([dbRow], 1)
      const result = await getLeadsAction({})
      const data = assertSuccess(result)

      expect(data.leads[0]).toMatchObject({
        total_score: null,
        grade: null,
      })
    })

    it('should return totalCount from query count', async () => {
      mockAuth([], 42)
      const result = await getLeadsAction({})

      expect(assertSuccess(result).totalCount).toBe(42)
    })

    it('should return totalCount 0 when count is null', async () => {
      const { query } = mockAuth()
      query.range.mockResolvedValue({ data: [], count: null, error: null })

      const result = await getLeadsAction({})
      expect(assertSuccess(result).totalCount).toBe(0)
    })

    it('should return empty result on query error', async () => {
      mockAuth([], 0, { message: 'relation "leads" does not exist' })
      const result = await getLeadsAction({})

      expect(result).toEqual({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Leads konnten nicht geladen werden' },
      })
    })

    it('should return empty leads array when data is null', async () => {
      const { query } = mockAuth()
      query.range.mockResolvedValue({ data: null, count: 0, error: null })

      const result = await getLeadsAction({})
      expect(assertSuccess(result).leads).toEqual([])
    })

    it('should map multiple rows correctly', async () => {
      const rows = [
        {
          id: 'a',
          company_name: 'A Corp',
          first_name: 'A',
          last_name: 'A',
          industry: 'Tech',
          location: 'Vienna',
          updated_at: '2026-01-01T00:00:00Z',
          lead_scores: [{ total_score: 95, grade: 'HOT' }],
        },
        {
          id: 'b',
          company_name: 'B Corp',
          first_name: 'B',
          last_name: 'B',
          industry: 'Finance',
          location: 'Berlin',
          updated_at: '2026-01-02T00:00:00Z',
          lead_scores: [{ total_score: 45, grade: 'POTENTIAL' }],
        },
      ]

      mockAuth(rows, 2)
      const result = await getLeadsAction({})
      const data = assertSuccess(result)

      expect(data.leads).toHaveLength(2)
      expect(data.leads[0]!.id).toBe('a')
      expect(data.leads[1]!.id).toBe('b')
      expect(data.totalCount).toBe(2)
    })
  })

  // -----------------------------------------------------------------------
  // Query builder integration (select clause + user_id scoping)
  // -----------------------------------------------------------------------

  describe('query builder', () => {
    it('should always scope query to authenticated user', async () => {
      const { query } = mockAuth()
      await getLeadsAction({})

      expect(query.eq).toHaveBeenCalledWith('user_id', TEST_USER.id)
    })

    it('should request exact count', async () => {
      const { query } = mockAuth()
      await getLeadsAction({})

      expect(query.select).toHaveBeenCalledWith(expect.any(String), {
        count: 'exact',
      })
    })
  })
})
