import { withRetry, type RetryOptions } from './retry'

export class HttpRetryableError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpRetryableError'
  }
}

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export interface FetchRetryOptions extends RetryOptions {
  onRateLimited?: (retryAfterSeconds: number) => void
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: FetchRetryOptions,
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, init)
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after') || 60)
        options?.onRateLimited?.(retryAfter)
        throw new HttpRetryableError(429, 'Rate limited')
      }
      if (!response.ok && response.status >= 500) {
        throw new HttpRetryableError(response.status, await response.text())
      }
      if (!response.ok) {
        throw new HttpError(response.status, await response.text())
      }
      return response
    },
    {
      ...options,
      shouldRetry: (error) => error instanceof HttpRetryableError,
    },
  )
}
