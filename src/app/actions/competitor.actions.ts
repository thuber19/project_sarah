'use server'

import { requireAuth } from '@/lib/supabase/server'
import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import { scrapeWebsite } from '@/lib/scraper'
import { detectTechStack, detectCompetitors, matchIcpTechStack } from '@/lib/ai/tools/detect-tech-stack'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export interface CompetitorAnalysisRow {
  id: string
  lead_id: string
  tech_stack: string[]
  competitor_matches: Array<{
    technology: string
    category: string
    competitors: string[]
  }>
  icp_tech_matched: string[]
  icp_tech_unmatched: string[]
  ai_summary: string | null
  analyzed_at: string
  lead?: {
    company_name: string | null
    company_domain: string | null
    industry: string | null
    company_size: string | null
  }
}

const refreshSchema = z.object({
  leadId: z.string().uuid(),
})

/**
 * Get all competitor analyses for the current user.
 */
export async function getCompetitorAnalysesAction() {
  const { user, supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('competitor_analyses')
    .select(`
      id,
      lead_id,
      tech_stack,
      competitor_matches,
      icp_tech_matched,
      icp_tech_unmatched,
      ai_summary,
      analyzed_at,
      leads:lead_id (
        company_name,
        company_domain,
        industry,
        company_size
      )
    `)
    .eq('user_id', user.id)
    .order('analyzed_at', { ascending: false })
    .limit(50)

  if (error) {
    return { success: false as const, error: 'Competitor-Analysen konnten nicht geladen werden' }
  }

  // Flatten the nested lead join
  const analyses: CompetitorAnalysisRow[] = (data ?? []).map((row) => ({
    id: row.id,
    lead_id: row.lead_id,
    tech_stack: row.tech_stack,
    competitor_matches: row.competitor_matches as CompetitorAnalysisRow['competitor_matches'],
    icp_tech_matched: row.icp_tech_matched,
    icp_tech_unmatched: row.icp_tech_unmatched,
    ai_summary: row.ai_summary,
    analyzed_at: row.analyzed_at,
    lead: (Array.isArray(row.leads) ? row.leads[0] : row.leads) as CompetitorAnalysisRow['lead'],
  }))

  return { success: true as const, data: analyses }
}

/**
 * Run competitor analysis for a specific lead by scraping their website
 * and detecting technologies + competitors.
 */
export async function refreshCompetitorAnalysisAction(input: { leadId: string }) {
  const { user, supabase } = await requireAuth()

  const parsed = refreshSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Lead-ID' }

  const { leadId } = parsed.data

  // Fetch lead data
  const [leadResult, icpResult] = await Promise.all([
    supabase
      .from('leads')
      .select('company_name, company_domain, company_website, industry, company_size, raw_data')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('icp_profiles')
      .select('tech_stack')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) {
    return { success: false as const, error: 'Lead nicht gefunden' }
  }

  const lead = leadResult.data
  const icpTechStack: string[] = icpResult.data?.tech_stack ?? []

  // Determine website URL
  const websiteUrl =
    lead.company_website ??
    (lead.company_domain ? `https://${lead.company_domain}` : null)

  if (!websiteUrl) {
    return { success: false as const, error: 'Keine Website für diesen Lead verfügbar' }
  }

  try {
    // Scrape website (validates URL is reachable)
    await scrapeWebsite(websiteUrl)

    // Build tech signals from Apollo data
    const rawData = lead.raw_data as Record<string, unknown> | null
    const apolloTech = rawData?.technologies as string[] | undefined
    const techSignals = {
      metaGenerator: null as string | null,
      metaFrameworkHints: [] as string[],
      scriptSources: [] as string[],
      cssIndicators: [] as string[],
      responseHeaders: {} as Record<string, string>,
    }
    const techResult = detectTechStack(techSignals, apolloTech)

    // Detect competitors
    const competitors = detectCompetitors(techResult.summary)

    // Match against ICP tech stack
    const icpMatch = matchIcpTechStack(techResult.summary, icpTechStack)

    // Generate AI summary
    let aiSummary: string | null = null
    try {
      const { text } = await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        prompt: `Fasse die Tech-Stack-Analyse für "${lead.company_name}" in 2-3 Sätzen auf Deutsch zusammen.

Erkannte Technologien: ${techResult.summary.join(', ') || 'Keine'}
Wettbewerber-Tools: ${competitors.map((c) => `${c.technology} (${c.category})`).join(', ') || 'Keine'}
ICP-Matches: ${icpMatch.matched.join(', ') || 'Keine'}

Bewerte kurz die technologische Reife und ob die Firma ein guter Kandidat für einen Tech-Wechsel ist.`,
      })
      aiSummary = text
    } catch {
      // AI summary is optional — continue without it
    }

    // Upsert into database
    const { error: upsertError } = await supabase
      .from('competitor_analyses')
      .upsert(
        {
          user_id: user.id,
          lead_id: leadId,
          tech_stack: techResult.summary,
          competitor_matches: competitors,
          icp_tech_matched: icpMatch.matched,
          icp_tech_unmatched: icpMatch.unmatched,
          ai_summary: aiSummary,
          analyzed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lead_id', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (upsertError) {
      // Fallback: try insert if upsert fails (no unique constraint yet)
      const { error: insertError } = await supabase
        .from('competitor_analyses')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          tech_stack: techResult.summary,
          competitor_matches: competitors,
          icp_tech_matched: icpMatch.matched,
          icp_tech_unmatched: icpMatch.unmatched,
          ai_summary: aiSummary,
          analyzed_at: new Date().toISOString(),
        })

      if (insertError) {
        return { success: false as const, error: 'Analyse konnte nicht gespeichert werden' }
      }
    }

    revalidatePath('/competitor-analysis')

    return {
      success: true as const,
      data: {
        techStack: techResult.summary,
        competitors,
        icpMatched: icpMatch.matched,
        aiSummary,
      },
    }
  } catch (error) {
    console.error('Competitor analysis failed:', error)
    return { success: false as const, error: 'Website konnte nicht analysiert werden' }
  }
}
