import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'

export interface NewsItem {
  title: string
  summary: string
  source: string
  url?: string
  event_type: 'funding' | 'expansion' | 'hiring' | 'product_launch' | 'leadership_change' | 'other'
  relevance: string
}

export interface CompanyNewsResult {
  company_name: string
  news: NewsItem[]
  fetched_at: string
}

const newsSchema = z.object({
  news: z.array(
    z.object({
      title: z.string().describe('Titel des News-Artikels auf Deutsch'),
      summary: z.string().describe('Kurze Zusammenfassung auf Deutsch (2-3 Sätze) mit Sales-Relevanz'),
      source: z.string().describe('Quellenname (z.B. Handelsblatt, Der Standard)'),
      url: z.string().optional().describe('URL zum Originalartikel falls bekannt'),
      event_type: z
        .enum(['funding', 'expansion', 'hiring', 'product_launch', 'leadership_change', 'other'])
        .describe('Art des Events'),
      relevance: z.string().describe('Warum ist das für Sales relevant? (1 Satz)'),
    })
  ),
})

const DACH_SOURCES =
  'Handelsblatt, WirtschaftsWoche, Der Standard, NZZ, Trending Topics, APA, pressetext, OTS, Wirtschaftsblatt, Börsen-Zeitung'

export async function fetchCompanyNews(
  companyName: string,
  companyDomain?: string
): Promise<CompanyNewsResult> {
  const companyRef = companyDomain ? `${companyName} (${companyDomain})` : companyName

  const prompt = `Recherchiere aktuelle Neuigkeiten über das Unternehmen "${companyRef}".

Priorisiere DACH-Quellen: ${DACH_SOURCES}.

Fokussiere auf sales-relevante Events:
- Funding-Runden / Investitionen
- Expansion / neue Standorte / neue Märkte
- Einstellungen / Wachstum (Hiring)
- Produkt-Launches / neue Features
- Leadership Changes (CEO, CTO, etc.)
- Partnerschaften / Übernahmen

Liefere bis zu 5 aktuelle News-Items. Falls keine konkreten News bekannt sind, gib ein leeres Array zurück. Erfinde KEINE Artikel.`

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: newsSchema,
    prompt,
  })

  return {
    company_name: companyName,
    news: object.news as NewsItem[],
    fetched_at: new Date().toISOString(),
  }
}
