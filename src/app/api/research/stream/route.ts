import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { model } from '@/lib/ai/provider'
import { scrapeWebsite } from '@/lib/scraper'
import { logAgentAction } from '@/lib/agent-log'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { leadId } = (await req.json()) as { leadId?: string }
  if (!leadId) return new Response('leadId required', { status: 400 })

  // Check cache (< 7 days old)
  const { data: cached } = await supabase
    .from('lead_research')
    .select('full_report, updated_at')
    .eq('lead_id', leadId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (cached) {
    const cacheAge = Date.now() - new Date(cached.updated_at).getTime()
    if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
      return new Response(cached.full_report, {
        headers: { 'Content-Type': 'text/plain', 'X-Cached': 'true' },
      })
    }
  }

  // Fetch lead
  const { data: lead } = await supabase
    .from('leads')
    .select('company_name, company_domain, company_website, industry, location, country')
    .eq('id', leadId)
    .eq('user_id', user.id)
    .single()

  if (!lead) return new Response('Lead not found', { status: 404 })

  // Scrape company website
  const baseUrl =
    lead.company_website || (lead.company_domain ? `https://${lead.company_domain}` : null)
  let scrapedContent = ''

  if (baseUrl) {
    try {
      const scraped = await scrapeWebsite(baseUrl)
      scrapedContent = [scraped.title, scraped.metaDescription, scraped.bodyText?.slice(0, 10_000)]
        .filter(Boolean)
        .join('\n\n')
    } catch {
      scrapedContent = 'Website konnte nicht gescraped werden.'
    }
  }

  // Log research start
  await logAgentAction(
    { supabase, userId: user.id },
    'research_started',
    `Research gestartet: ${lead.company_name}`,
    { lead_id: leadId },
  )

  const result = streamText({
    model,
    system: `Du bist ein B2B Research-Analyst für den DACH-Markt. Analysiere Unternehmen detailliert auf Deutsch.

Strukturiere deinen Report in diese Abschnitte:
## Unternehmensprofil
## Tech-Stack (falls erkennbar)
## Stellenangebote & Wachstumssignale
## Preismodell (falls öffentlich)
## News & Aktuelles
## DACH-spezifische Informationen
## Standorte
## Fazit & Empfehlung`,
    prompt: `Erstelle einen detaillierten Research-Report für:

Firma: ${lead.company_name}
Branche: ${lead.industry || 'unbekannt'}
Standort: ${lead.location || lead.country || 'unbekannt'}
Website: ${baseUrl || 'nicht bekannt'}

${scrapedContent ? `Website-Inhalte:\n${scrapedContent}` : 'Keine Website-Daten verfügbar.'}

Analysiere das Unternehmen für B2B-Vertriebszwecke. Fokussiere auf DACH-relevante Aspekte.`,
    async onFinish({ text }) {
      // Persist research results
      await supabase.from('lead_research').upsert(
        {
          lead_id: leadId,
          user_id: user.id,
          full_report: text,
          tech_stack: [],
          sources: baseUrl ? [{ url: baseUrl, scraped_at: new Date().toISOString() }] : [],
          status: 'completed',
        },
        { onConflict: 'lead_id' },
      )

      await logAgentAction(
        { supabase, userId: user.id },
        'research_completed',
        `Research abgeschlossen: ${lead.company_name}`,
        { lead_id: leadId },
      )
    },
  })

  return result.toTextStreamResponse()
}
