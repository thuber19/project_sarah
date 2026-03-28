'use server'

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'
import { requireAuth } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'

const generateEmailSchema = z.object({
  leadId: z.string().uuid(),
})

export async function generateEmailAction(input: { leadId: string }) {
  const { user, supabase } = await requireAuth()
  const parsed = generateEmailSchema.parse(input)

  const [leadResult, scoreResult, profileResult, icpResult] = await Promise.all([
    supabase.from('leads').select('*').eq('id', parsed.leadId).eq('user_id', user.id).single(),
    supabase.from('lead_scores').select('*').eq('lead_id', parsed.leadId).eq('user_id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('icp_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) {
    return { success: false as const, error: { code: 'NOT_FOUND', message: 'Lead nicht gefunden' } }
  }

  const lead = leadResult.data
  const score = scoreResult.data
  const profile = profileResult.data
  const icp = icpResult.data

  const displayName =
    lead.full_name ?? ([lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Kontakt')

  const commStyle = (profile?.communication_style ?? null) as Record<string, string> | null
  const systemPrompt = buildSystemPrompt('ein Sales-Experte für B2B-Outreach im DACH-Markt', { business: profile, icp })

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250514'),
    system: `${systemPrompt}

Du bist ein Sales-Experte für den DACH-Markt. Erstelle eine professionelle Erstansprache-E-Mail auf Deutsch.
Verwende die "${commStyle?.formality === 'du' ? 'Du' : 'Sie'}"-Anrede. Die E-Mail soll kurz, persönlich und relevant sein.
${commStyle?.writing_style ? `Schreibstil: ${commStyle.writing_style}` : ''}
${commStyle?.example_email ? `Orientiere dich an diesem Beispiel für Ton und Wortwahl:\n${commStyle.example_email}` : ''}
${commStyle?.email_signature ? `Füge folgende Signatur am Ende ein:\n${commStyle.email_signature}` : ''}
${commStyle?.additional_notes ? `Zusätzliche Hinweise: ${commStyle.additional_notes}` : ''}
Formatiere die Ausgabe EXAKT so:
Betreff: [Betreff hier]

[E-Mail-Text hier]`,
    prompt: `Erstelle eine Erstansprache-E-Mail für diesen Lead:

Name: ${displayName}
Firma: ${lead.company_name ?? 'Unbekannt'}
Position: ${lead.job_title ?? lead.title ?? 'Unbekannt'}
Branche: ${lead.industry ?? lead.company_industry ?? 'Unbekannt'}
Standort: ${lead.location ?? lead.country ?? lead.company_country ?? 'Unbekannt'}
${score?.ai_reasoning ? `AI-Begründung: ${score.ai_reasoning}` : ''}
${score?.recommended_action ? `Empfehlung: ${score.recommended_action}` : ''}
${profile?.company_name ? `Absender-Firma: ${profile.company_name}` : ''}
${profile?.description ? `Absender-Beschreibung: ${profile.description}` : ''}`,
  })

  const subjectMatch = text.match(/^Betreff:\s*(.+)/m)
  const subject = subjectMatch?.[1]?.trim() ?? 'Anfrage'
  const body = text.replace(/^Betreff:\s*.+\n\n?/, '').trim()

  return { success: true as const, data: { subject, body } }
}
