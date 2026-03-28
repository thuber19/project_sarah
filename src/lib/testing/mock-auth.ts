import { vi } from 'vitest'

/**
 * Default test user for mocking requireAuth().
 */
export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
} as const

/**
 * Creates a mock for requireAuth() that returns a user and supabase client.
 */
export function mockRequireAuth(supabaseClient: unknown, user = TEST_USER) {
  return vi.fn().mockResolvedValue({
    user,
    supabase: supabaseClient,
  })
}
