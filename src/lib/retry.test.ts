import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry } from './retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should succeed on first try without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const result = await withRetry(fn)

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry on failure and succeed on second try', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('recovered')

    const promise = withRetry(fn, { jitter: false })

    // First call fails, advance past retry delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should exhaust retries and throw the last error', async () => {
    const error = new Error('persistent failure')
    const fn = vi.fn().mockRejectedValue(error)

    const promise = withRetry(fn, { maxRetries: 2, jitter: false })

    // Attach rejection handler immediately to prevent unhandled rejection
    const catchPromise = promise.catch((e: unknown) => e)

    // Advance through retry delays: attempt 0 delay = 1000ms, attempt 1 delay = 2000ms
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(2000)

    const caught = await catchPromise
    expect(caught).toBe(error)
    expect((caught as Error).message).toBe('persistent failure')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should respect shouldRetry returning false and stop early', async () => {
    const nonRetryableError = new Error('not retryable')
    const fn = vi.fn().mockRejectedValue(nonRetryableError)
    const shouldRetry = vi.fn().mockReturnValue(false)

    await expect(withRetry(fn, { maxRetries: 3, shouldRetry })).rejects.toThrow('not retryable')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledWith(nonRetryableError, 0)
  })

  it('should apply exponential backoff with increasing delays', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const onRetry = vi.fn()

    const promise = withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 1000,
      jitter: false,
      onRetry,
    })

    // Attach rejection handler immediately to prevent unhandled rejection
    const catchPromise = promise.catch((e: unknown) => e)

    // Attempt 0 fails -> delay = 1000 * 2^0 = 1000ms
    await vi.advanceTimersByTimeAsync(1000)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 0, 1000)

    // Attempt 1 fails -> delay = 1000 * 2^1 = 2000ms
    await vi.advanceTimersByTimeAsync(2000)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 2000)

    // Attempt 2 fails -> delay = 1000 * 2^2 = 4000ms
    await vi.advanceTimersByTimeAsync(4000)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 4000)

    // Attempt 3 fails -> throws (no more retries)
    const caught = await catchPromise
    expect((caught as Error).message).toBe('fail')
    expect(fn).toHaveBeenCalledTimes(4)
    expect(onRetry).toHaveBeenCalledTimes(3)
  })

  it('should cap delay at maxDelayMs', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const onRetry = vi.fn()

    const promise = withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 10_000,
      maxDelayMs: 15_000,
      jitter: false,
      onRetry,
    })

    // Attach rejection handler immediately to prevent unhandled rejection
    const catchPromise = promise.catch((e: unknown) => e)

    // Attempt 0: 10_000 * 2^0 = 10_000 (under cap)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 0, 10_000)

    // Attempt 1: 10_000 * 2^1 = 20_000 -> capped to 15_000
    await vi.advanceTimersByTimeAsync(15_000)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 15_000)

    // Attempt 2: 10_000 * 2^2 = 40_000 -> capped to 15_000
    await vi.advanceTimersByTimeAsync(15_000)
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 2, 15_000)

    const caught = await catchPromise
    expect((caught as Error).message).toBe('fail')
  })

  it('should call onRetry callback with correct arguments', async () => {
    const error = new Error('temporary')
    const fn = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('ok')
    const onRetry = vi.fn()

    const promise = withRetry(fn, { jitter: false, onRetry })

    await vi.advanceTimersByTimeAsync(1000)
    const result = await promise

    expect(result).toBe('ok')
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(error, 0, 1000)
  })

  it('should add jitter when enabled', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const onRetry = vi.fn()

    const promise = withRetry(fn, {
      maxRetries: 1,
      baseDelayMs: 1000,
      jitter: true,
      onRetry,
    })

    // Attach rejection handler immediately to prevent unhandled rejection
    const catchPromise = promise.catch((e: unknown) => e)

    // Attempt 0: 1000 * 2^0 + 0.5 * 1000 = 1500ms
    await vi.advanceTimersByTimeAsync(1500)

    const caught = await catchPromise
    expect((caught as Error).message).toBe('fail')
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 0, 1500)

    vi.spyOn(Math, 'random').mockRestore()
  })

  it('should use default options when none provided', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok')

    const promise = withRetry(fn)

    // Default: baseDelayMs=1000, jitter=true, so delay is between 1000-2000ms
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
