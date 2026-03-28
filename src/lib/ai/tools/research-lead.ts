import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { scrapeWebsite, type TechSignals } from '@/lib/scraper'
import { detectTechStack, type TechStackResult } from '@/lib/ai/tools/detect-tech-stack'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import type { Lead } from '@/types/lead'

interface ResearchReport {
  tech_stack: string[]
  detected_technologies: TechStackResult | null
  hiring_activity: string
  growth_signals: string
  dach_data: {
    impressum?: string
    headquarters?: string
    employees_registered?: string
    locations?: string[]
  }
  full_report: string
}

export type { ResearchReport }

export async function researchLead(
  lead: Lead,
  businessUrl?: string
): Promise<AsyncGenerator<string, ResearchReport>> {
  const websiteUrl =
    businessUrl ||
    lead.company_domain ||
    `https://${lead.company_name?.toLowerCase().replace(/\s+/g, '')}.de`

  // Scrape the website
  let scrapedContent = ''
  let techSignals: TechSignals | null = null
  try {
    const scraped = await scrapeWebsite(websiteUrl)
    scrapedContent = [scraped.title, scraped.metaDescription, scraped.bodyText]
      .filter(Boolean)
      .join('\n\n')
    techSignals = scraped.techSignals
  } catch (error) {
    console.warn(`Failed to scrape ${websiteUrl}:`, error)
    scrapedContent = `Website nicht erreichbar: ${websiteUrl}`
  }

  // Pattern-based tech detection from HTML signals
  const rawData = lead.raw_data as Record<string, unknown> | null
  const apolloTech = rawData?.technologies as string[] | undefined
  const detectedTech = techSignals ? detectTechStack(techSignals, apolloTech) : null

  const systemPrompt = buildSystemPrompt('ein Lead Research Specialist für B2B SaaS', {})

  const prompt = `Analysiere diese Lead-Firma tiefgehend basierend auf der Website und generiere einen Research Report.

## Lead-Daten
- Name: ${lead.first_name} ${lead.last_name}
- Titel: ${lead.title}
- Firma: ${lead.company_name}
- Branche: ${lead.company_industry}
- Firmengröße: ${lead.company_size}
- Land: ${lead.company_country}
- Website: ${websiteUrl}

## Gescrapte Website-Inhalte
${scrapedContent.substring(0, 3000)}

## Automatisch erkannte Technologien (HTML-Analyse)
${detectedTech ? detectedTech.summary.join(', ') || 'Keine erkannt' : 'Website nicht erreichbar'}

## Deine Aufgabe

Analysiere die Website und gib einen strukturierten Research Report auf Deutsch mit folgenden Abschnitten:

1. **Tech Stack** (Liste 5-10 identifizierte Technologien)
   - Welche Tools/Technologien nutzt die Firma?
   - Welche Frameworks, Hosting-Plattformen, Services?

2. **Hiring-Aktivität** (1-2 Sätze)
   - Gibt es Stellenausschreibungen?
   - Wie viele offene Positionen? Wachstumssignale?

3. **Growth Signals** (1-2 Sätze)
   - Neue Produkte/Features?
   - Blog-Aktivität, Release Notes?
   - Investitionen, Partnerschaften, Expansionspläne?

4. **DACH-Daten** (falls verfügbar)
   - Impressum-Informationen
   - Registrierte Mitarbeiterzahl (Handelsregister)
   - Bürostandorte in DACH-Region

5. **Executive Summary** (3-4 Sätze)
   - Gesamteinschätzung: Ist die Firma in Wachstum/Reife/Gründung?
   - Salesreadiness für diese Region/Branche

Antworte mit klarem Markdown-Formatting.`

  async function* researchGenerator() {
    const { textStream } = await streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt,
    })

    let fullText = ''

    for await (const chunk of textStream) {
      fullText += chunk
      yield chunk
    }

    // Parse the report into structured data
    // Merge AI-extracted tech with pattern-detected tech
    const aiTech = extractTechStack(fullText)
    const mergedTech = detectedTech
      ? [...new Set([...detectedTech.summary, ...aiTech])]
      : aiTech

    const report: ResearchReport = {
      tech_stack: mergedTech,
      detected_technologies: detectedTech,
      hiring_activity: extractSection(fullText, 'Hiring-Aktivität'),
      growth_signals: extractSection(fullText, 'Growth Signals'),
      dach_data: extractDACHData(fullText),
      full_report: fullText,
    }

    return report
  }

  return researchGenerator()
}

function extractTechStack(text: string): string[] {
  const techSection = extractSection(text, 'Tech Stack')
  // Extract markdown list items
  const matches = techSection.match(/[-*]\s+(.+?)(?=\n|$)/g) || []
  return matches
    .map((m) => m.replace(/^[-*]\s+/, '').trim())
    .filter((m) => m.length > 0)
    .slice(0, 10)
}

function extractDACHData(text: string): ResearchReport['dach_data'] {
  const dachSection = extractSection(text, 'DACH-Daten')
  const data: ResearchReport['dach_data'] = {}

  const impressumMatch = dachSection.match(/Impressum[:\s]+([^\n]+)/i)
  if (impressumMatch) data.impressum = impressumMatch[1].trim()

  const hqMatch = dachSection.match(/Standort[:\s]+([^\n]+)/i)
  if (hqMatch) data.headquarters = hqMatch[1].trim()

  const employeeMatch = dachSection.match(/Mitarbeiter[:\s]+([^\n]+)/i)
  if (employeeMatch) data.employees_registered = employeeMatch[1].trim()

  const locationsMatch = dachSection.match(/Büros?[:\s]+([^\n]+)/i)
  if (locationsMatch) {
    data.locations = locationsMatch[1]
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  }

  return data
}

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`##?\\s*${sectionName}[^#]*(?=##|$)`, 'i')
  const match = text.match(regex)
  return match ? match[0] : ''
}
