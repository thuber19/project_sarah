import { streamText, stepCountIs } from 'ai'
import { model } from '@/lib/ai/provider'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import {
  createSearchLeads,
  createEnrichLead,
  createScoreLead,
  createAnalyzeWebsite,
  createGetIcpProfile,
  createGetLeadDetails,
  createResearchLead,
  type ToolContext,
} from '@/lib/ai/tools'

export const maxDuration = 120

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Nicht authentifiziert', { status: 401 })
  }

  const [profileResult, icpResult] = await Promise.all([
    supabase
      .from('business_profiles')
      .select(
        'company_name, industry, description, product_summary, value_proposition, target_market, website_url',
      )
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('icp_profiles')
      .select(
        'industries, company_sizes, regions, job_titles, seniority_levels, tech_stack, revenue_ranges, funding_stages, keywords',
      )
      .eq('user_id', user.id)
      .single(),
  ])

  if (!profileResult.data) {
    return new Response('Kein Business-Profil gefunden', { status: 400 })
  }

  const { messages, conversationId } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    conversationId?: string
  }

  // Auto-create conversation if none provided
  let activeConversationId = conversationId
  if (!activeConversationId) {
    const firstUserMsg = messages.find((m) => m.role === 'user')
    const title = firstUserMsg?.content.slice(0, 80) || 'Neues Gespräch'

    const { data: conv } = await supabase
      .from('agent_conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single()

    if (conv) {
      activeConversationId = conv.id
    }
  }

  // Save the latest user message to the conversation
  if (activeConversationId && messages.length > 0) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      await supabase.from('agent_messages').insert({
        conversation_id: activeConversationId,
        user_id: user.id,
        role: 'user',
        content: lastUserMsg.content,
      })
    }
  }

  const systemPrompt = buildSystemPrompt('Sarah, ein interaktiver B2B Sales Agent', {
    business: profileResult.data,
    icp: icpResult.data,
  })

  const ctx: ToolContext = { supabase, userId: user.id }

  const result = streamText({
    model: model,
    system: systemPrompt,
    messages,
    stopWhen: stepCountIs(5),
    tools: {
      searchLeads: createSearchLeads(ctx),
      enrichLead: createEnrichLead(ctx),
      scoreLead: createScoreLead(ctx),
      analyzeWebsite: createAnalyzeWebsite(ctx),
      getIcpProfile: createGetIcpProfile(ctx),
      getLeadDetails: createGetLeadDetails(ctx),
      researchLead: createResearchLead(ctx),
    },
    abortSignal: req.signal,
    onStepFinish: async ({ toolResults }) => {
      if (toolResults && toolResults.length > 0) {
        await supabase.from('agent_logs').insert({
          user_id: user.id,
          action_type: 'query_optimized',
          message: `Chat-Agent: ${toolResults.length} Tool(s) ausgeführt`,
          metadata: {
            source: 'chat',
            tools: toolResults.map((r) => ({ name: r.toolName })),
          },
        })
      }
    },
    onFinish: async ({ text }) => {
      // Save assistant response to conversation
      if (activeConversationId && text) {
        await supabase.from('agent_messages').insert({
          conversation_id: activeConversationId,
          user_id: user.id,
          role: 'assistant',
          content: text,
        })

        // Update conversation timestamp
        await supabase
          .from('agent_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeConversationId)
      }
    },
  })

  const headers: Record<string, string> = {}
  if (activeConversationId) {
    headers['x-conversation-id'] = activeConversationId
  }

  return result.toUIMessageStreamResponse({ headers })
}
