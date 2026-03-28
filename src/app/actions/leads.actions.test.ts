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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_USER = { id: 'user-123', email: 'test@example.com' }

/**
 * Build a chainable mock that mirrors the Supabase PostgREST query builder.
 *
 * Every method returns `this` (chainable) except the terminal `.range()` which
 * resolves with `{ data, count, error }`.
 */
function createMockQuery(
  data: unknown[] = [],
  count: number = 0,
  error: null | { message: string } = null,
) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data, count, error }),
  }
  return query
}

function createMockSupabase(
  data: unknown[] = [],
  count: number = 0,
  error: null | { message: string } = null,
) {
  const query = createMockQuery(data, count, error)
  return {
    supabase: { from: vi.fn().mockReturnValue(query) },
    query,
  }
}

function mockAuth(
  data: unknown[] = [],
  count: number = 0,
  error: null | { message: string } = null,
) {
  const { supabase, query } = createMockSupabase(data, count, error)
  vi.mocked(requireAuth).mockResolvedValue({
    user: TEST_USER as never,
    supabase: supabase as never,
  })
  return { supabase, query }
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

    it('should return empty result for invalid grade value', async () => {
      mockAuth()
      const result = await getLeadsAction({ grade: 'INVALID_GRADE' })
      expect(result).toEqual({ leads: [], totalCount: 0 })
    })

    it('should return empty result for negative page number', async () => {
      mockAuth()
      const result = await getLeadsAction({ page: '-1' })
      expect(result).toEqual({ leads: [], totalCount: 0 })
    })

    it('should return empty result for page 0', async () => {
      mockAuth()
      const result = await getLeadsAction({ page: '0' })
      expect(result).toEqual({ leads: [], totalCount: 0 })
    })

    it('should return empty result for non-numeric page', async () => {
      mockAuth()
      const result = await getLeadsAction({ page: 'abc' })
      expect(result).toEqual({ leads: [], totalCount: 0 })
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

    it('should reject q longer than 100 chars', async () => {
      mockAuth()
      const longQ = 'a'.repeat(101)
      const result = await getLeadsAction({ q: longQ })
      expect(result).toEqual({ leads: [], totalCount: 0 })
    })

    it('should accept q at exactly 100 chars', async () => {
      const { query } = mockAuth()
      const maxQ = 'a'.repeat(100)
      await getLeadsAction({ q: maxQ })
      expect(query.select).toHaveBeenCalled()
    })

    it('should reject invalid sort field', async () => {
      mockAuth()
      const result = await getLeadsAction({ sort: 'nonexistent_column' })
      expect(result).toEqual({ leads: [], totalCount: 0 })
    })

    it('should reject invalid dir value', async () => {
      mockAuth()
      const result = await getLeadsAction({ dir: 'sideways' })
      expect(result).toEqual({ leads: [], totalCount: 0 })
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

    it('should map POOR_FIT to POOR for DB query', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'POOR_FIT' })

      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'POOR')
    })

    it('should pass through QUALIFIED grade unchanged', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'QUALIFIED' })

      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'QUALIFIED')
    })

    it('should pass through ENGAGED grade unchanged', async () => {
      const { query } = mockAuth()
      await getLeadsAction({ grade: 'ENGAGED' })

      expect(query.eq).toHaveBeenCalledWith('lead_scores.grade', 'ENGAGED')
    })

    it('should pass through POTENTIAL grade unchanged', async () => {
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

      expect(result.leads).toHaveLength(1)
      expect(result.leads[0]).toEqual({
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

      expect(result.leads[0]).toMatchObject({
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

      expect(result.leads[0]).toEqual({
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

      expect(result.leads[0]).toMatchObject({
        total_score: null,
        grade: null,
      })
    })

    it('should return totalCount from query count', async () => {
      mockAuth([], 42)
      const result = await getLeadsAction({})

      expect(result.totalCount).toBe(42)
    })

    it('should return totalCount 0 when count is null', async () => {
      const { query } = mockAuth()
      query.range.mockResolvedValue({ data: [], count: null, error: null })

      const result = await getLeadsAction({})
      expect(result.totalCount).toBe(0)
    })

    it('should return empty result on query error', async () => {
      mockAuth([], 0, { message: 'relation "leads" does not exist' })
      const result = await getLeadsAction({})

      expect(result).toEqual({ leads: [], totalCount: 0 })
    })

    it('should return empty leads array when data is null', async () => {
      const { query } = mockAuth()
      query.range.mockResolvedValue({ data: null, count: 0, error: null })

      const result = await getLeadsAction({})
      expect(result.leads).toEqual([])
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

      expect(result.leads).toHaveLength(2)
      expect(result.leads[0]!.id).toBe('a')
      expect(result.leads[1]!.id).toBe('b')
      expect(result.totalCount).toBe(2)
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
