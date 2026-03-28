import { vi } from 'vitest'

/**
 * Creates a chainable mock Supabase query builder.
 * Supports: select, insert, update, delete, eq, neq, order, range, single, limit
 */
export function createMockQueryBuilder(resolvedValue: {
  data: unknown
  error: unknown
  count?: number
}) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}

  const chainMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'gt',
    'lt',
    'gte',
    'lte',
    'or',
    'in',
    'is',
    'ilike',
    'order',
    'range',
    'limit',
    'single',
    'maybeSingle',
  ] as const

  for (const method of chainMethods) {
    builder[method] = vi.fn()
  }

  // Each method returns the builder (chainable), except terminal ones resolve the value
  for (const method of chainMethods) {
    builder[method].mockReturnValue(builder)
  }

  // Terminal methods resolve the value
  builder.single.mockResolvedValue(resolvedValue)
  builder.maybeSingle.mockResolvedValue(resolvedValue)

  // Make the builder thenable for non-single queries
  const thenableBuilder = Object.assign(builder, {
    then: (resolve: (value: unknown) => void) => resolve(resolvedValue),
  })

  return thenableBuilder
}

/**
 * Creates a mock Supabase client with a `.from()` method.
 */
export function createMockSupabaseClient(
  queryBuilder: ReturnType<typeof createMockQueryBuilder>,
) {
  return {
    from: vi.fn().mockReturnValue(queryBuilder),
  }
}
