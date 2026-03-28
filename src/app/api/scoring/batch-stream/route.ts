import { createClient } from '@/lib/supabase/server'
import {
  calculateTwoPhaseScore,
  combinedScore,
  calculateRuleScore,
  totalFromBreakdown,
  type ICP,
} from '@/lib/scoring/rule-engine'
import type { Lead } from '@/types/lead'
import { getGradeForScore } from '@/lib/scoring/grade'
import { getAIScoring } from '@/lib/scoring/ai-scoring'
import { logAgentAction } from '@/lib/agent-log'

const MAX_BATCH_SIZE = 50

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

  const body = await req.json()
  const { leadIds } = body as { leadIds?: string[] }

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return new Response('leadIds array required', { status: 400 })
  }

  const boundedIds = leadIds.slice(0, MAX_BATCH_SIZE)

  // Fetch leads and ICP in parallel
  const [leadsResult, icpResult] = await Promise.all([
    supabase.from('leads').select('*').in('id', boundedIds).eq('user_id', user.id),
    supabase
      .from('icp_profiles')
      .select('industries, company_sizes, regions, job_titles, seniority_levels')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!leadsResult.data || leadsResult.data.length === 0) {
    return new Response('Keine Leads gefunden', { status: 404 })
  }

  const leads = leadsResult.data
  const icpData = icpResult.data

  const icp: ICP = {
    target_industries: icpData?.industries ?? [],
    target_company_sizes: icpData?.company_sizes ?? [],
    target_countries: icpData?.regions ?? [],
    target_seniorities: icpData?.seniority_levels ?? [],
    target_titles: icpData?.job_titles ?? [],
  }

  await logAgentAction(
    { supabase, userId: user.id },
    'campaign_started',
    `Batch-Scoring gestartet für ${leads.length} Leads`,
  )

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const total = leads.length
      let scored = 0

      for (const lead of leads) {
        if (req.signal.aborted) {
          controller.close()
          return
        }

        try {
          // Two-phase scoring: Company → (optional) Person
          const twoPhase = calculateTwoPhaseScore(lead as unknown as Lead, icp)
          const total_score = combinedScore(twoPhase)
          // Grade basiert NUR auf Company Score
          const grade = getGradeForScore(twoPhase.company_score)

          // Legacy breakdown for backward compat
          const breakdown = calculateRuleScore(lead as unknown as Lead, icp)

          // AI scoring (optional)
          let aiReasoning: string | null = null
          let aiRecommendation: string | null = null

          try {
            const aiResult = await getAIScoring(lead as unknown as Lead, breakdown, total_score, icp)
            aiReasoning = aiResult.reasoning
            aiRecommendation = aiResult.recommendation_text
          } catch {
            // AI scoring is optional
          }

          // Upsert score
          await supabase.from('lead_scores').upsert(
            {
              lead_id: lead.id,
              user_id: user.id,
              total_score,
              company_fit_score: breakdown.company_fit,
              contact_fit_score: breakdown.contact_fit,
              buying_signals_score: breakdown.buying_signals,
              timing_score: breakdown.timing,
              company_score: twoPhase.company_score,
              person_score: twoPhase.person_score,
              company_qualified: twoPhase.company_qualified,
              grade,
              ai_reasoning: aiReasoning,
              recommended_action: aiRecommendation,
            },
            { onConflict: 'lead_id' },
          )

          scored++
          const event = `data: ${JSON.stringify({
            type: 'progress',
            current: scored,
            total,
            leadId: lead.id,
            companyName: lead.company_name,
            score: total_score,
            companyScore: twoPhase.company_score,
            grade,
          })}\n\n`
          controller.enqueue(encoder.encode(event))
        } catch {
          scored++
          const event = `data: ${JSON.stringify({
            type: 'error',
            current: scored,
            total,
            leadId: lead.id,
            companyName: lead.company_name,
            error: 'Scoring fehlgeschlagen',
          })}\n\n`
          controller.enqueue(encoder.encode(event))
        }
      }

      await logAgentAction(
        { supabase, userId: user.id },
        'campaign_completed',
        `Batch-Scoring abgeschlossen: ${scored}/${total} Leads bewertet`,
        { scored, total },
      )

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'done', scored, total })}\n\n`),
      )
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
