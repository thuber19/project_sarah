import { streamText } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { model } from '@/lib/ai/provider'

const requestSchema = z.object({
  leadId: z.string(),
  template: z.enum(['initial_contact', 'follow_up', 'meeting_proposal']),
})

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 })
  }

  const { leadId, template } = parsed.data

  // Fetch lead data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(
      'company_name, first_name, last_name, job_title, industry, location, country, email, company_domain',
    )
    .eq('id', leadId)
    .eq('user_id', user.id)
    .single()

  if (leadError || !lead) {
    return new Response('Lead not found', { status: 404 })
  }

  // Fetch score and business profile in parallel
  const [scoreResult, profileResult] = await Promise.all([
    supabase
      .from('lead_scores')
      .select('total_score, grade, ai_reasoning')
      .eq('lead_id', leadId)
      .maybeSingle(),
    supabase
      .from('business_profiles')
      .select('company_name, industry, value_proposition, product_summary')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const score = scoreResult.data
  const profile = profileResult.data

  const templateInstructions: Record<string, string> = {
    initial_contact: `Erstansprache: Formelle "Sehr geehrte/r" Anrede. Referenz auf Firma und Branche des Leads. Verbindung zur eigenen Value Proposition. Kurz, professionell, max 200 Wörter.`,
    follow_up: `Follow-up: Bezug auf vorherigen Kontaktversuch. Neuen Mehrwert bieten (z.B. Branchen-Insight). Höflich nachfassen. Max 150 Wörter.`,
    meeting_proposal: `Terminvorschlag: Direkter Vorschlag für ein 15-minütiges Kennenlerngespräch. 2-3 Zeitslot-Optionen vorschlagen. Link-Platzhalter für Kalender. Max 150 Wörter.`,
  }

  const contactName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'unbekannt'
  const greetingStyle =
    lead.country === 'austria' || lead.country === 'AT'
      ? 'Österreichische Grußformel (Mit freundlichen Grüßen)'
      : 'Deutsche Grußformel'

  const result = streamText({
    model,
    system: `Du bist ein B2B Outreach-Spezialist für den DACH-Markt. Du verfasst professionelle E-Mails auf Deutsch mit Sie-Ansprache.

Regeln:
- Immer formell (Sie-Ansprache)
- Kein aggressiver Verkaufston
- DSGVO-konform: Am Ende jeder E-Mail folgender Hinweis: "Sollten Sie keinen weiteren Kontakt wünschen, antworten Sie bitte kurz mit 'Abmelden'."
- Betreffzeile mitliefern (als erste Zeile: "Betreff: ...")
- ${greetingStyle}`,
    prompt: `${templateInstructions[template]}

Lead-Informationen:
- Firma: ${lead.company_name ?? 'unbekannt'}
- Kontakt: ${contactName}
- Position: ${lead.job_title ?? 'unbekannt'}
- Branche: ${lead.industry ?? 'unbekannt'}
- Standort: ${lead.location ?? lead.country ?? 'unbekannt'}

${score ? `Score: ${score.total_score}/100 (${score.grade})\nAI-Einschätzung: ${score.ai_reasoning ?? 'keine'}` : ''}

${profile ? `Absender-Firma: ${profile.company_name}\nValue Proposition: ${profile.value_proposition ?? profile.product_summary ?? 'nicht angegeben'}` : ''}

Generiere jetzt die E-Mail auf Deutsch.`,
  })

  return result.toTextStreamResponse()
}
