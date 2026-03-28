import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { requireAuth } from '@/lib/supabase/server'
import type { ScoreBreakdown } from '@/types/lead'
import type { BusinessProfile, IcpProfile } from '@/types/database'

interface ScoringRequest {
  lead: {
    first_name?: string
    last_name?: string
    title?: string
    seniority?: string
    company_name?: string
    company_industry?: string
    company_size?: string
    company_country?: string
    company_city?: string
  }
  breakdown: ScoreBreakdown
  totalScore: number
  businessProfile?: BusinessProfile | null
  icpProfile?: IcpProfile | null
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth()
    const body: ScoringRequest = await request.json()

    const { lead, breakdown, totalScore, businessProfile, icpProfile } = body

    if (!lead || !breakdown) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: lead, breakdown' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = buildSystemPrompt('ein B2B Sales-Experte für Lead-Bewertung', {
      business: businessProfile,
      icp: icpProfile,
    })

    const prompt = `Analysiere diesen Lead progressiv und gib eine detaillierte Bewertung in strukturiertem Format.

## Lead-Daten
- Name: ${lead.first_name ?? ''} ${lead.last_name ?? ''}
- Titel: ${lead.title ?? 'Unbekannt'}
- Seniority: ${lead.seniority ?? 'Unbekannt'}
- Firma: ${lead.company_name ?? 'Unbekannt'}
- Branche: ${lead.company_industry ?? 'Unbekannt'}
- Firmengröße: ${lead.company_size ?? 'Unbekannt'}
- Land: ${lead.company_country ?? 'Unbekannt'}
- Stadt: ${lead.company_city ?? 'Unbekannt'}

## Aktuelle Scores (Regel-basiert)
- Company Fit: ${breakdown.company_fit}/40
- Contact Fit: ${breakdown.contact_fit}/20
- Buying Signals: ${breakdown.buying_signals}/25
- Timing: ${breakdown.timing}/15
- **Total: ${totalScore}/100**

Antworte mit einem JSON-Objekt mit folgende Struktur:
{
  "company_fit": <number 0-40>,
  "contact_fit": <number 0-20>,
  "buying_signals": <number 0-25>,
  "timing": <number 0-15>,
  "reasoning": "<Ausführliche Begründung auf Deutsch>",
  "recommendation": "<sofort_kontaktieren|nurture|beobachten|skip>",
  "recommendation_text": "<Kurze Handlungsempfehlung auf Deutsch>"
}

Gib zunächst die Scores progressiv, dann die Begründung und Empfehlung.`

    const { textStream } = await streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt,
    })

    const encoder = new TextEncoder()

    // Create a readable stream that formats the output as SSE
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            const message = `data: ${JSON.stringify({ chunk })}\n\n`
            controller.enqueue(encoder.encode(message))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Scoring stream error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Scoring failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
