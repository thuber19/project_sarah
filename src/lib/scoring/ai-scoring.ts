import { generateObject } from 'ai'
import { model } from '@/lib/ai/provider'
import { z } from 'zod/v4'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { withRetry } from '@/lib/retry'
import type { Lead, ScoreBreakdown } from '@/types/lead'
import type { ICP } from './rule-engine'
import type { BusinessProfile, IcpProfile } from '@/types/database'
import type { TokenUsage } from '@/lib/ai/usage-tracker'
import { buildUsageMetadata } from '@/lib/ai/usage-tracker'

const aiScoringSchema = z.object({
  reasoning: z.string().describe('Ausführliche Begründung des Scores auf Deutsch (2-3 Sätze)'),
  recommendation: z
    .enum(['sofort_kontaktieren', 'nurture', 'beobachten', 'skip'])
    .describe('Empfohlene Aktion'),
  recommendation_text: z.string().describe('Kurze Handlungsempfehlung auf Deutsch (1 Satz)'),
})

export type AIScoringResult = z.infer<typeof aiScoringSchema> & {
  usage?: TokenUsage
}

export async function getAIScoring(
  lead: Lead,
  breakdown: ScoreBreakdown,
  totalScore: number,
  _icp: ICP,
  context?: { business?: BusinessProfile | null; icp?: IcpProfile | null },
): Promise<AIScoringResult> {
  const systemPrompt = buildSystemPrompt('ein B2B Sales-Experte für Lead-Bewertung', {
    business: context?.business,
    icp: context?.icp,
  })

  return withRetry(async () => {
    const { object, usage } = await generateObject({
      model: model,
      system: systemPrompt,
      schema: aiScoringSchema,
      prompt: `Analysiere diesen Lead und gib eine Bewertung.

## Lead-Daten
- Name: ${lead.first_name} ${lead.last_name}
- Titel: ${lead.job_title ?? 'Unbekannt'}
- Seniority: ${lead.seniority ?? 'Unbekannt'}
- Firma: ${lead.company_name ?? 'Unbekannt'}
- Branche: ${lead.industry ?? 'Unbekannt'}
- Firmengröße: ${lead.company_size ?? 'Unbekannt'}
- Land: ${lead.country ?? 'Unbekannt'}
- Stadt: ${lead.location ?? 'Unbekannt'}

## Regel-basierter Score: ${totalScore}/100
- Company Fit: ${breakdown.company_fit}/40
- Contact Fit: ${breakdown.contact_fit}/20
- Buying Signals: ${breakdown.buying_signals}/25
- Timing: ${breakdown.timing}/15

Gib eine kurze, prägnante Begründung warum dieser Lead gut oder schlecht passt, und eine klare Handlungsempfehlung.`,
    })

    return {
      ...object,
      usage: buildUsageMetadata(usage),
    }
  })
}
