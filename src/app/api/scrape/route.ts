import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scrapeWebsite } from '@/lib/scraper'

const MAX_BODY_BYTES = 10_240 // 10 KB
const MAX_URL_LENGTH = 2_048

export async function POST(request: Request) {
  // Auth check — endpoint must not be publicly accessible
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Body size limit
  const rawBody = await request.text()
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request zu groß' }, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  const url = (body as Record<string, unknown>).url
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL ist erforderlich' }, { status: 400 })
  }

  // URL length limit
  if (url.length > MAX_URL_LENGTH) {
    return NextResponse.json({ error: 'URL zu lang' }, { status: 400 })
  }

  try {
    const content = await scrapeWebsite(url)
    return NextResponse.json(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'

    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json({ error: 'Website nicht erreichbar (Timeout nach 10s)' }, { status: 504 })
    }

    return NextResponse.json({ error: 'Scraping fehlgeschlagen' }, { status: 502 })
  }
}
