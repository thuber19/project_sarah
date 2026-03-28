import { generateText } from 'ai'
import { model } from '@/lib/ai/provider'
import { createClient } from '@/lib/supabase/server'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech'
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam — neutral, multilingual
const MAX_SCRIPT_WORDS = 150

function getElevenLabsKey(): string {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set')
  return key
}

function getVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID
}

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  let leadId: string
  let tone: 'professional' | 'friendly'

  try {
    const body = (await req.json()) as { leadId: string; tone?: 'professional' | 'friendly' }
    leadId = body.leadId
    tone = body.tone ?? 'professional'
    if (!leadId) return new Response('leadId is required', { status: 400 })
  } catch {
    return new Response('Invalid request body', { status: 400 })
  }

  const [leadResult, profileResult] = await Promise.all([
    supabase
      .from('leads')
      .select(
        'first_name, last_name, full_name, job_title, company_name, industry, company_size, location, country',
      )
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('business_profiles')
      .select('company_name, industry, value_proposition, product_summary')
      .eq('user_id', user.id)
      .single(),
  ])

  if (leadResult.error || !leadResult.data) {
    return new Response('Lead not found', { status: 404 })
  }

  const lead = leadResult.data
  const profile = profileResult.data

  const joinedName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  const leadName = (lead.full_name ?? joinedName) || 'Kontakt'
  const greeting = tone === 'friendly' ? 'du' : 'Sie'
  const senderCompany = profile?.company_name ?? 'unser Unternehmen'
  const valueProposition = profile?.value_proposition ?? profile?.product_summary ?? ''

  const scriptPrompt = `Du bist ein B2B Sales-Experte für den DACH-Markt. Schreibe ein kurzes, professionelles Voice-Message-Skript auf Deutsch.

## Empfänger
- Name: ${leadName}
- Position: ${lead.job_title ?? 'Entscheidungsträger'}
- Unternehmen: ${lead.company_name ?? 'deren Unternehmen'}
- Branche: ${lead.industry ?? 'unbekannt'}

## Absender
- Unternehmen: ${senderCompany}
${valueProposition ? `- Nutzen: ${valueProposition}` : ''}

## Anforderungen
- Anrede: ${greeting === 'du' ? 'Du-Form' : 'Sie-Form'}
- Länge: maximal ${MAX_SCRIPT_WORDS} Wörter (~60 Sekunden)
- Stil: ${tone === 'friendly' ? 'freundlich, persönlich' : 'professionell, sachlich'}
- DACH-spezifisch: evidence-basiert, nicht aufdringlich, klar und direkt
- Kein Smalltalk, direkt zum Punkt
- Mit konkretem Call-to-Action (kurzes Gespräch vereinbaren)
- Kein Betreff, nur den gesprochenen Text

Schreibe NUR das Skript, keine Erklärungen oder Anmerkungen.`

  let script: string
  try {
    const result = await generateText({
      model: model,
      prompt: scriptPrompt,
    })
    script = result.text.trim()
  } catch (err) {
    console.error('[voice] Script generation failed:', err)
    return new Response('Fehler bei der Script-Generierung', { status: 500 })
  }

  let audioBuffer: ArrayBuffer
  try {
    const elevenLabsRes = await fetch(`${ELEVENLABS_API_URL}/${getVoiceId()}`, {
      method: 'POST',
      headers: {
        'xi-api-key': getElevenLabsKey(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!elevenLabsRes.ok) {
      const errorText = await elevenLabsRes.text()
      console.error('[ElevenLabs] API error:', elevenLabsRes.status, errorText)
      return new Response('Fehler bei der Audio-Generierung', { status: 502 })
    }

    audioBuffer = await elevenLabsRes.arrayBuffer()
  } catch (err) {
    console.error('[voice] ElevenLabs fetch failed:', err)
    return new Response('ElevenLabs nicht erreichbar', { status: 502 })
  }

  const filename = `voice-message-${lead.company_name?.toLowerCase().replace(/\s+/g, '-') ?? 'lead'}.mp3`

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Script': encodeURIComponent(script),
    },
  })
}
