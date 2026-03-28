import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Only allow same-origin relative paths.
 * Blocks: absolute URLs, protocol-relative (//evil.com), javascript: etc.
 */
function isSafeRedirect(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false // protocol-relative
  // Ensure it parses as a valid relative path (no embedded absolute URLs)
  try {
    const parsed = new URL(path, 'http://localhost')
    return parsed.host === 'localhost'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = isSafeRedirect(searchParams.get('next')) ? searchParams.get('next')! : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_fehler`)
}
