import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, LIMITS } from '@/lib/rate-limiter'

const isDev = process.env.NODE_ENV === 'development'

// ---------------------------------------------------------------------------
// CSP
// ---------------------------------------------------------------------------

function buildCsp(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  let supabaseWs = ''
  try {
    const u = new URL(supabaseUrl)
    supabaseWs = `wss://${u.hostname}`
  } catch {
    // ignore — connect-src will still include the https URL
  }

  const scriptSrc = isDev
    ? `'self' 'unsafe-eval' 'unsafe-inline'` // HMR / React Fast Refresh
    : `'nonce-${nonce}' 'strict-dynamic'`

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self' ${supabaseUrl} ${supabaseWs}`.trimEnd(),
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ]

  return directives.join('; ')
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

function tooManyRequests(result: { limit: number; resetAfterMs: number }): NextResponse {
  const retryAfterSec = Math.ceil(result.resetAfterMs / 1000)
  return new NextResponse(
    JSON.stringify({ error: 'Zu viele Anfragen. Bitte warte kurz und versuche es erneut.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
        'RateLimit-Limit': String(result.limit),
        'RateLimit-Reset': String(Math.ceil((Date.now() + result.resetAfterMs) / 1000)),
      },
    },
  )
}

function applyRateLimit(request: NextRequest, userId: string | null): NextResponse | null {
  const { pathname } = request.nextUrl
  const ip = getIp(request)

  // Auth endpoints — keyed by IP (no session yet)
  if (pathname.startsWith('/auth/')) {
    const result = checkRateLimit(`auth:${ip}`, LIMITS.auth)
    if (!result.allowed) return tooManyRequests(result)
    return null
  }

  // Discovery / scrape pipeline — expensive, strict hourly limit
  if (
    pathname.startsWith('/api/campaign/') ||
    pathname.startsWith('/api/scrape')
  ) {
    const key = userId ? `discovery:${userId}` : `discovery:${ip}`
    const result = checkRateLimit(key, LIMITS.discovery)
    if (!result.allowed) return tooManyRequests(result)
    return null
  }

  // Scoring pipeline
  if (pathname.startsWith('/api/scoring')) {
    const key = userId ? `scoring:${userId}` : `scoring:${ip}`
    const result = checkRateLimit(key, LIMITS.scoring)
    if (!result.allowed) return tooManyRequests(result)
    return null
  }

  // All other API routes
  if (pathname.startsWith('/api/')) {
    const config = userId ? LIMITS.apiAuth : LIMITS.apiAnon
    const key = userId ? `api:${userId}` : `api:${ip}`
    const result = checkRateLimit(key, config)
    if (!result.allowed) return tooManyRequests(result)
    return null
  }

  return null
}

// ---------------------------------------------------------------------------
// Proxy (Next.js 16 middleware entry point)
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rate limiting — runs after session is resolved so we can key by userId
  const rateLimitResponse = applyRateLimit(request, user?.id ?? null)
  if (rateLimitResponse) return rateLimitResponse

  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/auth/')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  supabaseResponse.headers.set('Content-Security-Policy', buildCsp(nonce))

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
