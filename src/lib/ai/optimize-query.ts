import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'

const optimizedQuerySchema = z.object({
  apolloParams: z.object({
    personTitles: z.array(z.string()).describe('Jobtitel auf Englisch und Deutsch'),
    personSeniorities: z.array(z.string()).describe('Apollo seniority levels: owner, founder, c_suite, vp, director, manager, senior, entry'),
    organizationSizes: z.array(z.string()).describe('Apollo ranges: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001+'),
    organizationIndustries: z.array(z.string()).describe('Apollo industry tags auf Englisch'),
    organizationLocations: z.array(z.string()).describe('Länder und Städte im DACH-Raum'),
    organizationKeywords: z.array(z.string()).describe('Relevante Keywords für die Zielunternehmen'),
    organizationTechnologies: z.array(z.string()).optional().describe('Technologien die Zielunternehmen nutzen'),
  }),
  googlePlacesQueries: z.array(
    z.object({
      query: z.string().describe('Google Places Suchbegriff auf Deutsch'),
      region: z.string().describe('ISO 3166-1 Alpha-2 Ländercode (at, de, ch)'),
    }),
  ).describe('3-5 verschiedene Suchanfragen für Google Places'),
  reasoning: z.string().describe('Kurze Erklärung der Strategie auf Deutsch (2-3 Sätze)'),
})

export type OptimizedQuery = z.infer<typeof optimizedQuerySchema>

export interface BusinessProfile {
  company_name: string
  industry: string
  description: string
  services: string[]
  target_market: string
  website_url: string
}

export interface ICPProfile {
  target_industries: string[]
  target_company_sizes: string[]
  target_countries: string[]
  target_seniorities: string[]
  target_titles: string[]
  additional_criteria?: string
}

const DACH_CONTEXT = `
## DACH-Markt Kontext
- Deutsche Jobtitel einbeziehen: Geschäftsführer, Leiter, Abteilungsleiter, Inhaber, Vorstand
- Österreich (at), Deutschland (de), Schweiz (ch)
- Branchen auf Englisch für Apollo, auf Deutsch für Google Places
- Bei Google Places lokale Begriffe verwenden (z.B. "Steuerberater Wien" statt "tax consultant Vienna")
`

export async function optimizeSearchQuery(
  businessProfile: BusinessProfile,
  icpProfile: ICPProfile,
): Promise<OptimizedQuery> {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: optimizedQuerySchema,
    prompt: `Du bist ein B2B Sales-Stratege spezialisiert auf den DACH-Markt. Optimiere die Suchparameter für die Lead-Suche.

## Business-Profil
- Firma: ${businessProfile.company_name}
- Branche: ${businessProfile.industry}
- Beschreibung: ${businessProfile.description}
- Services: ${businessProfile.services.join(', ')}
- Zielmarkt: ${businessProfile.target_market}
- Website: ${businessProfile.website_url}

## Ideal Customer Profile (ICP)
- Zielbranchen: ${icpProfile.target_industries.join(', ')}
- Zielgrößen: ${icpProfile.target_company_sizes.join(', ')}
- Zielländer: ${icpProfile.target_countries.join(', ')}
- Ziel-Seniority: ${icpProfile.target_seniorities.join(', ')}
- Ziel-Titel: ${icpProfile.target_titles.join(', ')}
${icpProfile.additional_criteria ? `- Zusätzliche Kriterien: ${icpProfile.additional_criteria}` : ''}

${DACH_CONTEXT}

## Aufgabe
1. Generiere optimale Apollo.io Suchparameter (englische Industry-Tags, Seniority-Levels gemäß Apollo API)
2. Erstelle 3-5 Google Places Suchanfragen auf Deutsch für den DACH-Raum
3. Beziehe sowohl englische als auch deutsche Jobtitel ein
4. Erkläre kurz deine Strategie

Wichtig: Die Parameter müssen direkt mit den Apollo.io und Google Places APIs kompatibel sein.`,
  })

  return object
}
