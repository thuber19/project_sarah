import { NextResponse } from 'next/server'
import { scrapeWebsite } from '@/lib/scraper'

export async function POST(request: Request) {
  const body = await request.json()
  const url: string | undefined = body.url

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL ist erforderlich' }, { status: 400 })
  }

  try {
    const content = await scrapeWebsite(url)
    return NextResponse.json(content)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'

    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json({ error: 'Website nicht erreichbar (Timeout nach 10s)' }, { status: 504 })
    }

    return NextResponse.json({ error: `Scraping fehlgeschlagen: ${message}` }, { status: 502 })
  }
}
