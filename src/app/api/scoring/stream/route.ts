import { streamText, Output } from 'ai'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { model } from '@/lib/ai/provider'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'

/**
 * Enhanced schema for progressive AI scoring analysis.
 * Each field streams incrementally so the client can show partial results.
 */
export const streamingScoringSchema = z.object({
  company_fit_analysis: z.string().describe('Analyse der Firmenbewertung'),
  contact_fit_analysis: z.string().describe('Analyse der Kontaktbewertung'),
  buying_signals_analysis: z.string().describe('Analyse der Kaufsignale'),
  timing_analysis: z.string().describe('Analyse des Timings'),
  reasoning: z.string().describe('Gesamtbewertung auf Deutsch'),
  recommendation: z
    .enum(['sofort_kontaktieren', 'nurture', 'beobachten', 'skip'])
    .describe('Empfohlene Aktion'),
  recommendation_text: z.string().describe('Begründung der Empfehlung auf Deutsch'),
  confidence: z.number().min(0).max(1).describe('Konfidenz der AI-Bewertung'),
  dach_notes: z.string().optional().describe('DACH-spezifische Hinweise'),
  key_insights: z.array(z.string()).describe('Wichtigste Erkenntnisse'),
})

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Nicht authentifiziert', { status: 401 })
  }

  const body = await req.json()
  const { leadId } = body as { leadId?: string }

  if (!leadId || typeof leadId !== 'string') {
    return new Response('leadId required', { status: 400 })
  }

  // Fetch lead data (scoped to user via RLS + explicit filter)
  const { data: lead } = await supabase
    .from('leads')
    .select(
      'company_name, industry, company_size, location, country, job_title, seniority, email, company_domain',
    )
    .eq('id', leadId)
    .eq('user_id', user.id)
    .single()

  if (!lead) {
    return new Response('Lead nicht gefunden', { status: 404 })
  }

  // Fetch ICP + business profile for context (parallel)
  const [icpResult, profileResult] = await Promise.all([
    supabase
      .from('icp_profiles')
      .select('industries, company_sizes, regions, job_titles, seniority_levels')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('business_profiles')
      .select(
        'company_name, industry, description, product_summary, value_proposition, target_market, website_url',
      )
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const icp = icpResult.data
  const business = profileResult.data

  // Fetch rule-based score if exists
  const { data: ruleScore } = await supabase
    .from('lead_scores')
    .select(
      'total_score, company_fit_score, contact_fit_score, buying_signals_score, timing_score, grade',
    )
    .eq('lead_id', leadId)
    .maybeSingle()

  const systemPrompt = buildSystemPrompt(
    'ein B2B Lead-Scoring-Experte für detaillierte Lead-Analyse',
    { business, icp },
  )

  const result = streamText({
    model,
    system: systemPrompt,
    output: Output.object({ schema: streamingScoringSchema }),
    prompt: `Analysiere diesen Lead detailliert für ein B2B SaaS im DACH-Markt.

## Lead-Daten
- Firma: ${lead.company_name ?? 'Unbekannt'} (${lead.industry ?? 'Branche unbekannt'})
- Standort: ${lead.location ?? lead.country ?? 'unbekannt'}
- Kontakt: ${lead.job_title ?? 'unbekannt'} (${lead.seniority ?? 'unbekannt'})
- Firmengröße: ${lead.company_size ?? 'unbekannt'}
- Domain: ${lead.company_domain ?? 'unbekannt'}

${
  ruleScore
    ? `## Regel-basierter Score: ${ruleScore.total_score}/100 (${ruleScore.grade})
- Company Fit: ${ruleScore.company_fit_score}/40
- Contact Fit: ${ruleScore.contact_fit_score}/20
- Buying Signals: ${ruleScore.buying_signals_score}/25
- Timing: ${ruleScore.timing_score}/15`
    : '## Kein Regel-Score vorhanden.'
}

${
  icp
    ? `## ICP-Kriterien
- Branchen: ${icp.industries?.join(', ') ?? 'nicht definiert'}
- Firmengrößen: ${icp.company_sizes?.join(', ') ?? 'nicht definiert'}
- Regionen: ${icp.regions?.join(', ') ?? 'nicht definiert'}`
    : ''
}

Gib eine detaillierte Analyse auf Deutsch. Berücksichtige DACH-spezifische Faktoren (GmbH/AG, österreichische/deutsche/Schweizer Marktbedingungen). Analysiere jeden Bereich einzeln und gib konkrete Handlungsempfehlungen.`,
    abortSignal: req.signal,
  })

  return result.toTextStreamResponse()
}
