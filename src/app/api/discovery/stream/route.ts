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

  // Load business profile + ICP for system prompt
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

  const { messages } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  const systemPrompt = buildSystemPrompt('ein autonomer B2B Sales Agent für Lead Discovery', {
    business: profileResult.data,
    icp: icpResult.data,
  })

  const ctx: ToolContext = { supabase, userId: user.id }

  const result = streamText({
    model: model,
    system: systemPrompt,
    messages,
    stopWhen: stepCountIs(8),
    tools: {
      searchLeads: createSearchLeads(ctx),
      enrichLead: createEnrichLead(ctx),
      scoreLead: createScoreLead(ctx),
      analyzeWebsite: createAnalyzeWebsite(ctx),
      getIcpProfile: createGetIcpProfile(ctx),
    },
    abortSignal: req.signal,
    onStepFinish: async ({ toolResults }) => {
      if (toolResults && toolResults.length > 0) {
        await supabase.from('agent_logs').insert({
          user_id: user.id,
          action_type: 'query_optimized',
          message: `Agent-Step abgeschlossen: ${toolResults.length} Tool(s) ausgeführt`,
          metadata: {
            tools: toolResults.map((r) => ({
              name: r.toolName,
            })),
          },
        })
      }
    },
  })

  return result.toUIMessageStreamResponse()
}
