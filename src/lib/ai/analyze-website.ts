import { generateObject } from 'ai'
import { model } from '@/lib/ai/provider'
import { websiteAnalysisSchema, type WebsiteAnalysis } from './schemas'
import { buildSystemPrompt } from './system-prompt'
import type { ScrapedContent } from '@/lib/scraper'
import type { TokenUsage } from '@/lib/ai/usage-tracker'
import { buildUsageMetadata } from '@/lib/ai/usage-tracker'

export type { WebsiteAnalysis }

export type WebsiteAnalysisResult = WebsiteAnalysis & {
  usage?: TokenUsage
}

export async function analyzeWebsite(content: ScrapedContent): Promise<WebsiteAnalysisResult> {
  const systemPrompt = buildSystemPrompt('ein B2B Sales-Experte für Website-Analyse')

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

  const { object, usage } = await generateObject({
    model: model,
    system: systemPrompt,
    schema: websiteAnalysisSchema,
    prompt: `Analysiere diesen Website-Inhalt und extrahiere strukturierte Informationen.

${context.slice(0, 15_000)}

Wenn Informationen nicht eindeutig erkennbar sind, mache sinnvolle Annahmen basierend auf dem Kontext.`,
  })

  return {
    ...object,
    usage: buildUsageMetadata(usage),
  }
}
