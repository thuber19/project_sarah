import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { CookieListItem } from 'next/dist/compiled/@edge-runtime/cookies'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (
      _url: string,
      _key: string,
      options: {
        cookies: {
          getAll: () => CookieListItem[]
          setAll: (cookies: { name: string; value: string; options?: object }[]) => void
        }
      },
    ) => {
      options.cookies.getAll()
      return {
        auth: { getUser: mockGetUser },
        from: mockFrom,
      }
    },
  ),
}))

// Mock rate limiter — always allow
vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, limit: 100, remaining: 99, resetAfterMs: 60000 })),
  LIMITS: {
    auth: { windowMs: 900000, max: 10 },
    discovery: { windowMs: 3600000, max: 10 },
    scoring: { windowMs: 60000, max: 60 },
    apiAuth: { windowMs: 60000, max: 120 },
    apiAnon: { windowMs: 60000, max: 30 },
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRequest(pathname: string): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000')
  return new NextRequest(url)
}

function mockAuthenticatedWithProfile(userId = 'user-123') {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } })
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'biz-1' }, error: null }),
      }),
    }),
  })
}

function mockAuthenticatedWithoutProfile(userId = 'user-123') {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } } })
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  })
}

function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const { proxy } = await import('./proxy')

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Public routes — passthrough
  // -----------------------------------------------------------------------

  describe('public routes', () => {
    it('passes through for / (landing page) without auth', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('passes through for /pricing without auth', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/pricing'))
      expect(response.status).toBe(200)
    })

    it('passes through for /impressum without auth', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/impressum'))
      expect(response.status).toBe(200)
    })

    it('passes through for /api/ routes without auth', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/api/health'))
      expect(response.status).toBe(200)
    })
  })

  // -----------------------------------------------------------------------
  // Gate 1: Authentication
  // -----------------------------------------------------------------------

  describe('auth gate', () => {
    it('redirects to /login when not authenticated on /dashboard', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/dashboard'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/login')
    })

    it('preserves intended destination as redirect param', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/leads/import'))
      const location = new URL(response.headers.get('location')!)
      expect(location.searchParams.get('redirect')).toBe('/leads/import')
    })

    it('redirects to /login for all protected routes when unauthenticated', async () => {
      const protectedPaths = [
        '/dashboard',
        '/leads',
        '/discovery',
        '/scoring',
        '/agent-logs',
        '/export',
        '/settings',
      ]

      for (const path of protectedPaths) {
        vi.clearAllMocks()
        mockUnauthenticated()
        const response = await proxy(buildRequest(path))
        const location = new URL(response.headers.get('location')!)
        expect(location.pathname).toBe('/login')
      }
    })

    it('redirects to /login when unauthenticated on /onboarding/step-1', async () => {
      mockUnauthenticated()
      const response = await proxy(buildRequest('/onboarding/step-1'))
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/login')
    })

    it('redirects logged-in user from /login to /dashboard', async () => {
      mockAuthenticatedWithProfile()
      const response = await proxy(buildRequest('/login'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/dashboard')
    })
  })

  // -----------------------------------------------------------------------
  // Gate 2: Onboarding completion
  // -----------------------------------------------------------------------

  describe('onboarding gate', () => {
    it('allows authenticated users through /onboarding routes without profile check', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      const response = await proxy(buildRequest('/onboarding/step-2'))
      expect(response.status).toBe(200)
      // business_profiles should NOT be queried for onboarding routes
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('redirects to /onboarding/step-1 when no business_profiles exists', async () => {
      mockAuthenticatedWithoutProfile()
      const response = await proxy(buildRequest('/dashboard'))
      expect(response.status).toBe(307)
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/onboarding/step-1')
    })

    it('redirects to /onboarding/step-1 from /leads when no profile', async () => {
      mockAuthenticatedWithoutProfile()
      const response = await proxy(buildRequest('/leads'))
      const location = new URL(response.headers.get('location')!)
      expect(location.pathname).toBe('/onboarding/step-1')
    })

    it('queries business_profiles with correct table', async () => {
      mockAuthenticatedWithProfile('specific-user-789')
      await proxy(buildRequest('/dashboard'))
      expect(mockFrom).toHaveBeenCalledWith('business_profiles')
    })
  })

  // -----------------------------------------------------------------------
  // Fully authenticated + onboarded — passthrough with CSP
  // -----------------------------------------------------------------------

  describe('authenticated with profile', () => {
    it('passes through /dashboard when authenticated with profile', async () => {
      mockAuthenticatedWithProfile()
      const response = await proxy(buildRequest('/dashboard'))
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBeNull()
    })

    it('includes CSP header in response', async () => {
      mockAuthenticatedWithProfile()
      const response = await proxy(buildRequest('/dashboard'))
      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toBeTruthy()
      expect(csp).toContain("default-src 'self'")
    })

    it('passes through /leads/[id] sub-paths when authenticated with profile', async () => {
      mockAuthenticatedWithProfile()
      const response = await proxy(buildRequest('/leads/some-lead-id'))
      expect(response.status).toBe(200)
    })
  })
})
