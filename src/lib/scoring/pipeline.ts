import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead, LeadScore } from '@/types/lead'
import { getGradeForScore } from '@/types/lead'
import { calculateRuleScore, totalFromBreakdown, type ICP } from './rule-engine'
import { getAIScoring } from './ai-scoring'
import { logAgentAction } from '@/lib/agent-log'
import type { TokenUsage } from '@/lib/ai/usage-tracker'
import { PipelineTimer } from '@/lib/pipeline/timer'

const CONCURRENCY_LIMIT = 5

export interface ScoringPipelineResult {
  scored: number
  failed: number
  results: LeadScore[]
}

async function scoreOneLead(
  supabase: SupabaseClient,
  lead: Lead,
  icp: ICP,
  userId: string,
): Promise<LeadScore | null> {
  // Step 1: Rule-based scoring
  const breakdown = calculateRuleScore(lead, icp)
  const totalScore = totalFromBreakdown(breakdown)
  const grade = getGradeForScore(totalScore)

  // Step 2: AI scoring (with fallback)
  let aiReasoning: string | null = null
  let aiRecommendation: string | null = null
  let tokenUsage: TokenUsage | undefined

  try {
    const aiResult = await getAIScoring(lead, breakdown, totalScore, icp)
    aiReasoning = aiResult.reasoning
    aiRecommendation = aiResult.recommendation_text
    tokenUsage = aiResult.usage
  } catch (error) {
    console.error(`[ScoringPipeline] AI scoring failed for lead ${lead.id}:`, error)
  }

  // Step 3: Save to database
  const { data, error } = await supabase
    .from('lead_scores')
    .upsert(
      {
        lead_id: lead.id,
        user_id: userId,
        total_score: totalScore,
        company_fit_score: breakdown.company_fit,
        contact_fit_score: breakdown.contact_fit,
        buying_signals_score: breakdown.buying_signals,
        timing_score: breakdown.timing,
        grade,
        ai_reasoning: aiReasoning,
        recommended_action: aiRecommendation,
      },
      { onConflict: 'lead_id' },
    )
    .select()
    .single()

  if (error) {
    console.error(`[ScoringPipeline] Failed to save score for lead ${lead.id}:`, error.message)
    return null
  }

  // Step 4: Agent log
  await logAgentAction(
    { supabase, userId },
    'lead_scored',
    `Lead ${lead.first_name} ${lead.last_name} (${lead.company_name}) bewertet: ${totalScore}/100 - ${grade}`,
    {
      lead_id: lead.id,
      score: totalScore,
      grade,
      ...(tokenUsage ? { token_usage: tokenUsage } : {}),
    },
  )

  return data as LeadScore
}

async function processInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

export async function runScoringPipeline(
  supabase: SupabaseClient,
  leads: Lead[],
  icp: ICP,
  userId: string,
): Promise<ScoringPipelineResult> {
  const timer = new PipelineTimer()
  timer.start('total_scoring_ms')

  await logAgentAction(
    { supabase, userId },
    'campaign_started',
    `Scoring Pipeline gestartet für ${leads.length} Leads`,
  )

  timer.start('batch_processing_ms')
  const rawResults = await processInBatches(leads, CONCURRENCY_LIMIT, (lead) =>
    scoreOneLead(supabase, lead, icp, userId),
  )
  timer.stop('batch_processing_ms')

  const results = rawResults.filter((r): r is LeadScore => r !== null)
  const failed = rawResults.length - results.length

  timer.stop('total_scoring_ms')

  await logAgentAction(
    { supabase, userId },
    'campaign_completed',
    `Scoring Pipeline abgeschlossen: ${results.length} bewertet, ${failed} fehlgeschlagen`,
    { scored: results.length, failed, pipeline_timing: timer.getMetrics() },
  )

  return { scored: results.length, failed, results }
}
