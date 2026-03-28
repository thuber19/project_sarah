/**
 * In-memory sliding window rate limiter.
 *
 * NOTE: Resets on cold starts (each Vercel function instance has its own store).
 * Replace with Upstash Redis (@upstash/ratelimit) for persistent limits across instances.
 */

interface RateLimitConfig {
  limit: number
  windowMs: number
}

// Map<key, timestamps[]>
const store = new Map<string, number[]>()

// Prune the whole store every 5 minutes to prevent unbounded memory growth
let lastPrune = Date.now()
function maybePrune(now: number) {
  if (now - lastPrune < 5 * 60 * 1000) return
  lastPrune = now
  for (const [key, timestamps] of store) {
    if (timestamps.length === 0) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAfterMs: number
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  maybePrune(now)

  const windowStart = now - config.windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  const allowed = timestamps.length < config.limit

  if (allowed) {
    timestamps.push(now)
    store.set(key, timestamps)
  }

  const oldest = timestamps[0] ?? now
  const resetAfterMs = Math.max(0, oldest + config.windowMs - now)

  return {
    allowed,
    limit: config.limit,
    remaining: Math.max(0, config.limit - timestamps.length),
    resetAfterMs,
  }
}

// Configurable limits — override via environment variables
export const LIMITS = {
  auth: {
    limit: Number(process.env.RATE_LIMIT_AUTH ?? 10),
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  discovery: {
    limit: Number(process.env.RATE_LIMIT_DISCOVERY ?? 10),
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  scoring: {
    limit: Number(process.env.RATE_LIMIT_SCORING ?? 60),
    windowMs: 60 * 1000, // 1 minute
  },
  apiAuth: {
    limit: Number(process.env.RATE_LIMIT_API_AUTHED ?? 120),
    windowMs: 60 * 1000,
  },
  apiAnon: {
    limit: Number(process.env.RATE_LIMIT_API_ANON ?? 30),
    windowMs: 60 * 1000,
  },
} satisfies Record<string, RateLimitConfig>
