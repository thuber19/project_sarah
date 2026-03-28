import { generateObject } from 'ai'
import { model } from '@/lib/ai/provider'
import { z } from 'zod/v4'
import { buildSystemPrompt } from './system-prompt'
import type { BusinessProfile, IcpProfile } from '@/types/database'

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

export async function optimizeSearchQuery(
  businessProfile: BusinessProfile,
  icpProfile: IcpProfile,
): Promise<OptimizedQuery> {
  const systemPrompt = buildSystemPrompt('ein B2B Sales-Stratege für Lead-Recherche', {
    business: businessProfile,
    icp: icpProfile,
  })

  const { object } = await generateObject({
    model: model,
    system: systemPrompt,
    schema: optimizedQuerySchema,
    prompt: `Optimiere die Suchparameter für die Lead-Suche basierend auf dem Unternehmensprofil und ICP.

## Aufgabe
1. Generiere optimale Apollo.io Suchparameter (englische Industry-Tags, Seniority-Levels gemäß Apollo API)
2. Erstelle 3-5 Google Places Suchanfragen auf Deutsch für den DACH-Raum
3. Beziehe sowohl englische als auch deutsche Jobtitel ein
4. Erkläre kurz deine Strategie

Wichtig:
- Die Parameter müssen direkt mit den Apollo.io und Google Places APIs kompatibel sein.
- Bei Google Places lokale Begriffe verwenden (z.B. "Steuerberater Wien" statt "tax consultant Vienna")
- Branchen auf Englisch für Apollo, auf Deutsch für Google Places`,
  })

  return object
}
