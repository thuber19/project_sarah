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
    content.impressumSection ? `Impressum:\n${content.impressumSection}` : '',
    content.teamSection ? `Team/Management:\n${content.teamSection}` : '',
    content.contactEmails.length ? `Gefundene E-Mails: ${content.contactEmails.join(', ')}` : '',
    content.contactPhones.length ? `Gefundene Telefonnummern: ${content.contactPhones.join(', ')}` : '',
    content.bodyText ? `Seitentext:\n${content.bodyText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const { object, usage } = await generateObject({
    model: model,
    system: systemPrompt,
    schema: websiteAnalysisSchema,
    prompt: `Analysiere diesen Website-Inhalt und extrahiere strukturierte Informationen.

WICHTIG — Diese drei Felder MÜSSEN sich inhaltlich klar unterscheiden:
- productsServices: Nur Stichworte der Kernprodukte/Services, max 5. Kein Fließtext.
- companyDescription: Fließtext (2-3 Sätze) der das Unternehmen beschreibt — Kontext, Positionierung, Zielgruppe. Für Outreach nutzbar. NICHT einfach die Produkte auflisten!
- valueProposition: Was macht dieses Unternehmen einzigartig? Kein Produktlisting! Warum kaufen Kunden hier und nicht bei der Konkurrenz?

KONTAKT-EXTRAKTION (DACH Impressumspflicht §5 TMG/ECG):
- contactPerson: Extrahiere den Geschäftsführer/Inhaber aus dem Impressum oder der Team-Seite. Name, Titel, E-Mail und Telefon wenn verfügbar.
- registryInfo: Handelsregister-/Firmenbuch-Nummer aus dem Impressum (z.B. "FN 123456a", "HRB 12345 B").
- estimatedCompanySize: Schätze die Unternehmensgröße basierend auf Team-Seite, Impressum oder Website-Inhalt.

${context.slice(0, 15_000)}

Wenn Informationen nicht eindeutig erkennbar sind, mache sinnvolle Annahmen basierend auf dem Kontext.`,
  })

  return {
    ...object,
    usage: buildUsageMetadata(usage),
  }
}
