import { requireAuth } from '@/lib/supabase/server'
import { researchLead } from '@/lib/ai/tools/research-lead'

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAuth()

    const { leadId, websiteUrl } = await request.json()

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'Missing leadId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if we already have recent research (< 7 days old)
    const { data: existingResearch } = await supabase
      .from('lead_research')
      .select('*')
      .eq('user_id', user.id)
      .eq('lead_id', leadId)
      .gte('research_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle()

    if (existingResearch) {
      return new Response(
        JSON.stringify({
          cached: true,
          research: existingResearch,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the research
    const encoder = new TextEncoder()
    const generator = await researchLead(lead, websiteUrl)

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            const message = `data: ${JSON.stringify({ chunk })}\n\n`
            controller.enqueue(encoder.encode(message))
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Research stream error:', error)
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
    console.error('Research API error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Research failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
