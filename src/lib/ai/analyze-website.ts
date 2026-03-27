import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { websiteAnalysisSchema, type WebsiteAnalysis } from './schemas'
import type { ScrapedContent } from '@/lib/scraper'

export type { WebsiteAnalysis }

export async function analyzeWebsite(content: ScrapedContent): Promise<WebsiteAnalysis> {
  const context = [
    `URL: ${content.url}`,
    content.title ? `Titel: ${content.title}` : '',
    content.metaDescription ? `Meta-Beschreibung: ${content.metaDescription}` : '',
    content.headings.length ? `Überschriften:\n${content.headings.join('\n')}` : '',
    content.aboutSection ? `Über uns:\n${content.aboutSection}` : '',
    content.servicesSection ? `Leistungen/Produkte:\n${content.servicesSection}` : '',
    content.bodyText ? `Seitentext:\n${content.bodyText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: websiteAnalysisSchema,
    prompt: `Du bist ein B2B Sales-Experte für den DACH-Markt. Analysiere diesen Website-Inhalt und extrahiere strukturierte Informationen auf Deutsch.

${context.slice(0, 15_000)}

Wenn Informationen nicht eindeutig erkennbar sind, mache sinnvolle Annahmen basierend auf dem Kontext. Fokussiere auf den DACH-Markt.`,
  })

  return object
}
