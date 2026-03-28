import { generateObject } from 'ai'
import { model } from '@/lib/ai/provider'
import { z } from 'zod/v4'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import type { ScrapedContent } from '@/lib/scraper'

const analysisSchema = z.object({
  company_name: z.string().describe('Name des Unternehmens'),
  description: z.string().describe('Kurze Beschreibung des Unternehmens (2-3 Sätze)'),
  industry: z.string().describe('Branche (z.B. SaaS, E-Commerce, Beratung)'),
  product_summary: z.string().describe('Was das Produkt/die Dienstleistung macht (1-2 Sätze)'),
  value_proposition: z.string().describe('Hauptnutzen für Kunden (1 Satz)'),
  target_market: z.string().describe('Beschreibung der Zielkunden'),
  suggested_job_titles: z.array(z.string()).describe('Typische Job-Titel der Zielkunden (3-6 Stück)'),
  suggested_seniority_levels: z
    .array(z.string())
    .describe('Seniority-Level: owner, founder, cxo, vp, director, manager'),
  suggested_industries: z.array(z.string()).describe('Zielbranchen (3-5 Stück)'),
  suggested_company_sizes: z
    .array(z.string())
    .describe('Unternehmensgrößen aus: 1-10, 11-50, 51-200, 201-500, 501-1000'),
  suggested_regions: z.array(z.string()).describe('Zielregionen (z.B. DACH, Deutschland, Österreich)'),
})

export type WebsiteAnalysis = z.infer<typeof analysisSchema>

export async function analyzeWebsite(content: ScrapedContent): Promise<WebsiteAnalysis> {
  const systemPrompt = buildSystemPrompt('ein B2B Sales-Experte für Website-Analyse und ICP-Ableitung')

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
    model: model,
    system: systemPrompt,
    schema: analysisSchema,
    prompt: `Analysiere diesen Website-Inhalt und extrahiere strukturierte Informationen.

${context.slice(0, 15_000)}

Wenn Informationen nicht eindeutig erkennbar sind, mache sinnvolle Annahmen basierend auf dem Kontext.`,
  })

  return object
}
