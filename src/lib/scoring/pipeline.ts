import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead, LeadScore } from '@/types/lead'
import { getGradeForScore } from '@/types/lead'
import { calculateRuleScore, totalFromBreakdown, type ICP } from './rule-engine'
import { getAIScoring } from './ai-scoring'
import { logAgentEvent } from '@/lib/agent-log'

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

  try {
    const aiResult = await getAIScoring(lead, breakdown, totalScore, icp)
    aiReasoning = aiResult.reasoning
    aiRecommendation = aiResult.recommendation_text
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
        grade,
        breakdown,
        ai_reasoning: aiReasoning,
        ai_recommendation: aiRecommendation,
        scored_at: new Date().toISOString(),
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
  await logAgentEvent(
    supabase,
    userId,
    'lead_scored',
    `Lead ${lead.first_name} ${lead.last_name} (${lead.company_name}) bewertet: ${totalScore}/100 - ${grade}`,
    { lead_id: lead.id, score: totalScore, grade },
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
  await logAgentEvent(
    supabase,
    userId,
    'pipeline_started',
    `Scoring Pipeline gestartet für ${leads.length} Leads`,
  )

  const rawResults = await processInBatches(leads, CONCURRENCY_LIMIT, (lead) =>
    scoreOneLead(supabase, lead, icp, userId),
  )

  const results = rawResults.filter((r): r is LeadScore => r !== null)
  const failed = rawResults.length - results.length

  await logAgentEvent(
    supabase,
    userId,
    'pipeline_completed',
    `Scoring Pipeline abgeschlossen: ${results.length} bewertet, ${failed} fehlgeschlagen`,
    { scored: results.length, failed },
  )

  return { scored: results.length, failed, results }
}
