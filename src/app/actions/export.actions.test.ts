import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks -----------------------------------------------------------

// Supabase query builder is fully chainable AND thenable (await resolves the query).
// Every method returns the builder. `await builder` resolves via `.then()`.
let queryResultData: { data: unknown[] | null; error: unknown } = { data: [], error: null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryBuilder: Record<string, any> = {}
queryBuilder.select = vi.fn(() => queryBuilder)
queryBuilder.eq = vi.fn(() => queryBuilder)
queryBuilder.ilike = vi.fn(() => queryBuilder)
queryBuilder.limit = vi.fn(() => queryBuilder)
// Make the builder thenable so `await query` works
queryBuilder.then = vi.fn((resolve: (val: unknown) => void) => {
  return Promise.resolve(queryResultData).then(resolve)
})

const mockInsert = vi.fn(() => ({ error: null }))

const mockFrom = vi.fn((table: string) => {
  if (table === 'agent_logs') {
    return { insert: mockInsert }
  }
  return queryBuilder
})

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

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// --- Imports (after mocks) -------------------------------------------

import { exportLeadsAction } from './export.actions'

// --- Helpers ---------------------------------------------------------

function resetSupabaseMocks() {
  mockFrom.mockClear()
  queryBuilder.select.mockClear()
  queryBuilder.eq.mockClear()
  queryBuilder.ilike.mockClear()
  queryBuilder.limit.mockClear()
  queryBuilder.then.mockClear()
  mockInsert.mockClear()

  // Default: empty result
  queryResultData = { data: [], error: null }

  // Restore chain behavior
  queryBuilder.select.mockReturnValue(queryBuilder)
  queryBuilder.eq.mockReturnValue(queryBuilder)
  queryBuilder.ilike.mockReturnValue(queryBuilder)
  queryBuilder.limit.mockReturnValue(queryBuilder)
  queryBuilder.then.mockImplementation((resolve: (val: unknown) => void) =>
    Promise.resolve(queryResultData).then(resolve),
  )
  mockInsert.mockReturnValue({ error: null })
}

function setQueryResult(data: unknown[] | null, error: unknown = null) {
  queryResultData = { data, error }
}

const sampleLeads = [
  {
    company_name: 'Acme GmbH',
    industry: 'SaaS',
    location: 'Wien',
    email: 'contact@acme.at',
    linkedin_url: 'https://linkedin.com/company/acme',
    first_name: 'Maria',
    last_name: 'Huber',
    job_title: 'CTO',
    lead_scores: { total_score: 85, grade: 'HOT' },
  },
  {
    company_name: 'Beta AG',
    industry: 'FinTech',
    location: 'Zürich',
    email: null,
    linkedin_url: null,
    first_name: 'Thomas',
    last_name: null,
    job_title: null,
    lead_scores: [{ total_score: 42, grade: 'POTENTIAL' }],
  },
]

// --- Tests -----------------------------------------------------------

describe('export.actions — exportLeadsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSupabaseMocks()
  })

  // ===================================================================
  // Successful export
  // ===================================================================
  it('returns CSV with correct headers and rows for valid leads', async () => {
    setQueryResult(sampleLeads)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')

    expect(result.data.rowCount).toBe(2)
    expect(result.data.filename).toMatch(/^leads_export_\d{4}-\d{2}-\d{2}\.csv$/)

    // Verify headers
    expect(result.data.csv).toContain('"Firma"')
    expect(result.data.csv).toContain('"Branche"')
    expect(result.data.csv).toContain('"Score"')
    expect(result.data.csv).toContain('"E-Mail"')
    expect(result.data.csv).toContain('"LinkedIn"')
    expect(result.data.csv).toContain('"Kontakt"')
    expect(result.data.csv).toContain('"Position"')

    // Verify row data
    expect(result.data.csv).toContain('"Acme GmbH"')
    expect(result.data.csv).toContain('"85"')
    expect(result.data.csv).toContain('"HOT"')
    expect(result.data.csv).toContain('"Maria Huber"')
    expect(result.data.csv).toContain('"CTO"')

    // Second lead with null values
    expect(result.data.csv).toContain('"Beta AG"')
    expect(result.data.csv).toContain('"42"')
    expect(result.data.csv).toContain('"Thomas"')
  })

  // ===================================================================
  // UTF-8 BOM
  // ===================================================================
  it('includes UTF-8 BOM at start of CSV', async () => {
    setQueryResult(sampleLeads)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')

    expect(result.data.csv.charCodeAt(0)).toBe(0xfeff)
  })

  // ===================================================================
  // Empty result → NOT_FOUND
  // ===================================================================
  it('returns NOT_FOUND when no leads match', async () => {
    setQueryResult([])

    const result = await exportLeadsAction({})

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected failure')
    expect(result.error.code).toBe('NOT_FOUND')
    expect(result.error.message).toBe('Keine Leads zum Exportieren gefunden')
  })

  it('returns NOT_FOUND when data is null', async () => {
    setQueryResult(null)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected failure')
    expect(result.error.code).toBe('NOT_FOUND')
  })

  // ===================================================================
  // CSV injection protection (SEC-016)
  // ===================================================================
  it('escapes cells starting with = + - @ \\t \\r', async () => {
    const maliciousLeads = [
      {
        company_name: '=CMD("calc")',
        industry: '+SUM(A1)',
        location: '-attack',
        email: '@malicious',
        linkedin_url: '\tattack',
        first_name: '\rinjection',
        last_name: 'Safe',
        job_title: 'Normal Title',
        lead_scores: { total_score: 50, grade: 'ENGAGED' },
      },
    ]
    setQueryResult(maliciousLeads)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')

    // Each dangerous cell should be prefixed with single quote inside quotes
    expect(result.data.csv).toContain('"\'=CMD(""calc"")"')
    expect(result.data.csv).toContain('"\'+SUM(A1)"')
    expect(result.data.csv).toContain('"\'-attack"')
    expect(result.data.csv).toContain('"\'@malicious"')
    expect(result.data.csv).toContain('"\'\tattack"')
    expect(result.data.csv).toContain('"\'\rinjection Safe"')
  })

  it('escapes double quotes within cell values', async () => {
    const quotedLeads = [
      {
        company_name: 'Acme "Best" GmbH',
        industry: 'SaaS',
        location: 'Wien',
        email: null,
        linkedin_url: null,
        first_name: null,
        last_name: null,
        job_title: null,
        lead_scores: null,
      },
    ]
    setQueryResult(quotedLeads)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')

    expect(result.data.csv).toContain('"Acme ""Best"" GmbH"')
  })

  // ===================================================================
  // Grade filter
  // ===================================================================
  it('applies grade filter when grade is not ALL', async () => {
    setQueryResult(sampleLeads.slice(0, 1))

    await exportLeadsAction({ grade: 'HOT' })

    // Verify eq was called for grade filtering
    expect(queryBuilder.eq).toHaveBeenCalledWith('lead_scores.grade', 'HOT')
  })

  it('does not apply grade filter when grade is ALL', async () => {
    setQueryResult(sampleLeads)

    await exportLeadsAction({ grade: 'ALL' })

    // queryBuilder.eq should NOT have been called with lead_scores.grade
    const gradeFilterCalls = queryBuilder.eq.mock.calls.filter(
      (call: unknown[]) => call[0] === 'lead_scores.grade',
    )
    expect(gradeFilterCalls).toHaveLength(0)
  })

  // ===================================================================
  // Search query filter
  // ===================================================================
  it('applies search query filter when q is provided', async () => {
    setQueryResult(sampleLeads.slice(0, 1))

    await exportLeadsAction({ q: 'Acme' })

    expect(queryBuilder.ilike).toHaveBeenCalledWith('company_name', '%Acme%')
  })

  // ===================================================================
  // Validation
  // ===================================================================
  it('rejects invalid grade value', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await exportLeadsAction({ grade: 'INVALID' as any })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected failure')
    expect(result.error.code).toBe('VALIDATION_ERROR')
    expect(result.error.message).toBe('Ungültige Export-Parameter')
  })

  it('rejects q string longer than 200 chars', async () => {
    const result = await exportLeadsAction({ q: 'x'.repeat(201) })

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected failure')
    expect(result.error.code).toBe('VALIDATION_ERROR')
  })

  // ===================================================================
  // DB error
  // ===================================================================
  it('returns INTERNAL_ERROR when database query fails', async () => {
    setQueryResult(null, { code: '42501', message: 'RLS policy violation' })

    const result = await exportLeadsAction({})

    expect(result.success).toBe(false)
    if (result.success) throw new Error('Expected failure')
    expect(result.error.code).toBe('INTERNAL_ERROR')
    expect(result.error.message).toBe('Export fehlgeschlagen')
  })

  // ===================================================================
  // Agent log
  // ===================================================================
  it('logs export event to agent_logs', async () => {
    setQueryResult(sampleLeads)

    await exportLeadsAction({ grade: 'HOT', q: 'test' })

    expect(mockFrom).toHaveBeenCalledWith('agent_logs')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-id',
        action_type: 'lead_exported',
        message: '2 Leads als CSV exportiert',
        metadata: { format: 'csv', rowCount: 2, filters: { grade: 'HOT', q: 'test' } },
      }),
    )
  })

  // ===================================================================
  // Handles array vs object lead_scores
  // ===================================================================
  it('handles lead_scores as array (multiple scores)', async () => {
    const leadWithArrayScores = [
      {
        company_name: 'Array Co',
        industry: 'Tech',
        location: 'Berlin',
        email: null,
        linkedin_url: null,
        first_name: 'Test',
        last_name: 'User',
        job_title: 'Dev',
        lead_scores: [
          { total_score: 90, grade: 'HOT' },
          { total_score: 60, grade: 'ENGAGED' },
        ],
      },
    ]
    setQueryResult(leadWithArrayScores)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')
    // Should use the first score entry
    expect(result.data.csv).toContain('"90"')
    expect(result.data.csv).toContain('"HOT"')
  })

  it('handles null lead_scores gracefully', async () => {
    const leadWithNullScores = [
      {
        company_name: 'NoScore GmbH',
        industry: null,
        location: null,
        email: null,
        linkedin_url: null,
        first_name: null,
        last_name: null,
        job_title: null,
        lead_scores: null,
      },
    ]
    setQueryResult(leadWithNullScores)

    const result = await exportLeadsAction({})

    expect(result.success).toBe(true)
    if (!result.success) throw new Error('Expected success')
    expect(result.data.rowCount).toBe(1)
    expect(result.data.csv).toContain('"NoScore GmbH"')
  })
})
