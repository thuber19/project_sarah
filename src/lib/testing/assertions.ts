import { expect } from 'vitest'
import type { ApiResponse } from '@/lib/api-response'

/**
 * Asserts that an ApiResponse is successful and returns the data.
 * Throws a descriptive error if the response is a failure.
 */
export function assertSuccess<T>(result: ApiResponse<T>): T {
  if (!result.success) {
    throw new Error(
      `Expected success but got error: ${result.error.code} — ${result.error.message}`,
    )
  }
  return result.data
}

/**
 * Asserts that an ApiResponse is a failure and returns the error.
 */
export function assertFail(
  result: ApiResponse<unknown>,
): { code: string; message: string } {
  expect(result.success).toBe(false)
  if (result.success) throw new Error('Expected failure')
  return result.error
}
