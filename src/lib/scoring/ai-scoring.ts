import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'
import type { Lead, ScoreBreakdown } from '@/types/lead'
import type { ICP } from './rule-engine'

const aiScoringSchema = z.object({
  reasoning: z.string().describe('Ausführliche Begründung des Scores auf Deutsch (2-3 Sätze)'),
  recommendation: z.enum(['sofort_kontaktieren', 'nurture', 'beobachten', 'skip']).describe('Empfohlene Aktion'),
  recommendation_text: z.string().describe('Kurze Handlungsempfehlung auf Deutsch (1 Satz)'),
})

export type AIScoringResult = z.infer<typeof aiScoringSchema>

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === retries) throw error
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
    }
  }
  throw new Error('Unreachable')
}

export async function getAIScoring(
  lead: Lead,
  breakdown: ScoreBreakdown,
  totalScore: number,
  icp: ICP,
): Promise<AIScoringResult> {
  return withRetry(async () => {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: aiScoringSchema,
      prompt: `Du bist ein B2B Sales-Experte für den DACH-Markt. Analysiere diesen Lead und gib eine Bewertung auf Deutsch.

## Lead-Daten
- Name: ${lead.first_name} ${lead.last_name}
- Titel: ${lead.title ?? 'Unbekannt'}
- Seniority: ${lead.seniority ?? 'Unbekannt'}
- Firma: ${lead.company_name ?? 'Unbekannt'}
- Branche: ${lead.company_industry ?? 'Unbekannt'}
- Firmengröße: ${lead.company_size ?? 'Unbekannt'}
- Land: ${lead.company_country ?? 'Unbekannt'}
- Stadt: ${lead.company_city ?? 'Unbekannt'}

## Regel-basierter Score: ${totalScore}/100
- Company Fit: ${breakdown.company_fit}/40
- Contact Fit: ${breakdown.contact_fit}/20
- Buying Signals: ${breakdown.buying_signals}/25
- Timing: ${breakdown.timing}/15

## Ideal Customer Profile (ICP)
- Zielbranchen: ${icp.target_industries.join(', ')}
- Zielgrößen: ${icp.target_company_sizes.join(', ')}
- Zielländer: ${icp.target_countries.join(', ')}
- Ziel-Seniority: ${icp.target_seniorities.join(', ')}
- Ziel-Titel: ${icp.target_titles.join(', ')}

Gib eine kurze, prägnante Begründung warum dieser Lead gut oder schlecht passt, und eine klare Handlungsempfehlung.`,
    })

    return object
  })
}
