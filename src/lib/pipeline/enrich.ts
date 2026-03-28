import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '@/types/lead'
import type { ICP } from '@/lib/scoring/rule-engine'
import { scrapeWebsite } from '@/lib/scraper'
import { analyzeWebsite } from '@/lib/ai/analyze-website'
import { runScoringPipeline } from '@/lib/scoring/pipeline'
import { calculateDataQuality } from '@/lib/scoring/data-quality'
import { logAgentAction } from '@/lib/agent-log'

const ENRICHMENT_BATCH_SIZE = 5
const MAX_LEADS_TO_ENRICH = 15

export interface EnrichmentResult {
  enriched: number
  failed: number
  skipped: number
  rescored: number
}

/**
 * Async enrichment pipeline. Called after discovery to enrich leads with website data.
 *
 * Tiered approach:
 * - Tier 1: Quick rule-scoring (already done in discovery)
 * - Tier 2: Website scrape + AI analysis for top leads by score
 * - Tier 3: (future) Deep research for QUALIFIED+ leads
 */
export async function runEnrichmentPipeline(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  icp: ICP,
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = { enriched: 0, failed: 0, skipped: 0, rescored: 0 }

  await logAgentAction(
    { supabase, userId },
    'enrichment_started',
    'Enrichment Pipeline gestartet',
  )

  // Fetch leads that have a website and are pending enrichment, sorted by score
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*, lead_scores(total_score)')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('enrichment_status', 'pending')
    .not('company_website', 'is', null)
    .order('created_at', { ascending: false })
    .limit(MAX_LEADS_TO_ENRICH)

  if (error || !leads || leads.length === 0) {
    await logAgentAction(
      { supabase, userId },
      'enrichment_completed',
      'Keine Leads zum Anreichern gefunden',
    )
    return result
  }

  // Sort by score descending (enrich best leads first)
  const sortedLeads = (leads as (Lead & { lead_scores: { total_score: number }[] })[]).sort(
    (a, b) => (b.lead_scores?.[0]?.total_score ?? 0) - (a.lead_scores?.[0]?.total_score ?? 0),
  )

  // Process in batches to control concurrency
  for (let i = 0; i < sortedLeads.length; i += ENRICHMENT_BATCH_SIZE) {
    const batch = sortedLeads.slice(i, i + ENRICHMENT_BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map((lead) => enrichOneLead(supabase, lead)),
    )

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        if (r.value === 'enriched') result.enriched++
        else if (r.value === 'skipped') result.skipped++
        else result.failed++
      } else {
        result.failed++
      }
    }
  }

  // Re-score enriched leads with updated data
  if (result.enriched > 0) {
    const { data: enrichedLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .eq('enrichment_status', 'enriched')

    if (enrichedLeads && enrichedLeads.length > 0) {
      try {
        const scoringResult = await runScoringPipeline(
          supabase,
          enrichedLeads as Lead[],
          icp,
          userId,
        )
        result.rescored = scoringResult.scored

        // Update data quality scores
        for (const lead of enrichedLeads as Lead[]) {
          const qualityScore = calculateDataQuality(lead)
          await supabase
            .from('lead_scores')
            .update({ data_quality_score: qualityScore })
            .eq('lead_id', lead.id)
        }
      } catch (err) {
        console.error('[Enrichment] Re-scoring failed:', err)
      }
    }
  }

  await logAgentAction(
    { supabase, userId },
    'enrichment_completed',
    `Enrichment abgeschlossen: ${result.enriched} angereichert, ${result.failed} fehlgeschlagen, ${result.skipped} übersprungen`,
    { ...result },
  )

  return result
}

async function enrichOneLead(
  supabase: SupabaseClient,
  lead: Lead,
): Promise<'enriched' | 'skipped' | 'failed'> {
  const website = lead.company_website ?? lead.company_domain
  if (!website) return 'skipped'

  // Mark as enriching
  await supabase
    .from('leads')
    .update({ enrichment_status: 'enriching' })
    .eq('id', lead.id)

  try {
    // Step 1: Scrape website
    const scraped = await scrapeWebsite(website)

    // Step 2: AI analysis
    const analysis = await analyzeWebsite(scraped)

    // Step 3: Build update payload — only fill missing fields
    const updates: Record<string, unknown> = {
      enrichment_status: 'enriched',
    }

    // Fill industry from website analysis if missing
    if (!lead.industry && analysis.industry) {
      updates.industry = analysis.industry
    }

    // Fill company size from website analysis if missing
    if (!lead.company_size && analysis.estimatedCompanySize) {
      updates.company_size = analysis.estimatedCompanySize
    }

    // Fill contact info from Impressum/Team extraction
    if (analysis.contactPerson) {
      const contact = analysis.contactPerson
      if (!lead.first_name && contact.name) {
        const parts = contact.name.trim().split(/\s+/)
        if (parts.length >= 2) {
          updates.first_name = parts[0]
          updates.last_name = parts.slice(1).join(' ')
          updates.full_name = contact.name
        }
      }
      if (!lead.job_title && contact.jobTitle) {
        updates.job_title = contact.jobTitle
      }
      if (!lead.email && contact.email) {
        updates.email = contact.email
      }
    }

    // Enrich raw_data with website analysis results
    const existingRaw = (lead.raw_data ?? {}) as Record<string, unknown>
    updates.raw_data = {
      ...existingRaw,
      website_analyzed_at: new Date().toISOString(),
      businessModel: analysis.businessModel,
      registryInfo: analysis.registryInfo ?? null,
      detectedTechnologies: analysis.detectedTechnologies ?? [],
      companyDescription: analysis.companyDescription,
      valueProposition: analysis.valueProposition,
    }

    // Phone from scraped content if missing
    if (!existingRaw.phone && scraped.contactPhones.length > 0) {
      (updates.raw_data as Record<string, unknown>).phone = scraped.contactPhones[0]
    }

    // Step 4: Update lead
    await supabase.from('leads').update(updates).eq('id', lead.id)

    return 'enriched'
  } catch (err) {
    console.error(`[Enrichment] Failed for lead ${lead.id}:`, err)

    await supabase
      .from('leads')
      .update({ enrichment_status: 'failed' })
      .eq('id', lead.id)

    return 'failed'
  }
}
