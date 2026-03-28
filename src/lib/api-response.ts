/**
 * Canonical API response envelope for all server actions.
 * Use `ok()` and `fail()` helpers to construct responses.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

/** Construct a successful response. */
export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

/** Construct an error response. */
export function fail(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } }
}
