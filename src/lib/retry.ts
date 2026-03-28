export interface RetryOptions {
  maxRetries?: number // default: 2
  baseDelayMs?: number // default: 1000
  maxDelayMs?: number // default: 30_000
  jitter?: boolean // default: true
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    jitter = true,
    shouldRetry = () => true,
    onRetry,
  } = options ?? {}

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries || !shouldRetry(error, attempt)) throw error
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
      const jitterMs = jitter ? Math.random() * baseDelayMs : 0
      const delay = Math.min(exponentialDelay + jitterMs, maxDelayMs)
      onRetry?.(error, attempt, delay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('withRetry: unreachable')
}
