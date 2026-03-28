'use server'

import { requireAuth } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod/v4'
import { updateIcpAction } from './settings.actions'

const refinementSchema = z.object({
  suggestions: z.array(
    z.object({
      field: z.enum([
        'industries',
        'company_sizes',
        'regions',
        'job_titles',
        'seniority_levels',
        'tech_stack',
      ]),
      action: z.enum(['add', 'remove', 'replace']),
      current_value: z.string().optional(),
      suggested_value: z.string(),
      reasoning: z.string(),
      impact: z.enum(['high', 'medium', 'low']),
    })
  ),
  summary: z.string(),
  quality_score: z.number().min(0).max(100),
})

export type IcpSuggestion = z.infer<typeof refinementSchema>['suggestions'][number]
export type IcpRefinementResult = z.infer<typeof refinementSchema>

export async function analyzeIcpRefinementAction() {
  const { user, supabase } = await requireAuth()

  // Fetch current ICP, business profile, and lead performance data
  const [icpResult, profileResult, scoresResult, leadsResult] = await Promise.all([
    supabase.from('icp_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('lead_scores')
      .select('grade, total_score, ai_reasoning, lead_id')
      .eq('user_id', user.id)
      .order('scored_at', { ascending: false })
      .limit(50),
    supabase
      .from('leads')
      .select('company_industry, company_size, company_country, title, seniority')
      .eq('user_id', user.id)
      .limit(50),
  ])

  const icp = icpResult.data
  const profile = profileResult.data
  const scores = scoresResult.data ?? []
  const leads = leadsResult.data ?? []

  if (!icp || scores.length < 5) {
    return {
      success: false as const,
      error: 'Nicht genügend Daten für eine Analyse. Mindestens 5 bewertete Leads erforderlich.',
    }
  }

  // Analyze lead performance by categories
  const gradeDistribution = {
    HOT: scores.filter((s) => s.grade === 'HOT').length,
    QUALIFIED: scores.filter((s) => s.grade === 'QUALIFIED').length,
    ENGAGED: scores.filter((s) => s.grade === 'ENGAGED').length,
    POTENTIAL: scores.filter((s) => s.grade === 'POTENTIAL').length,
    POOR_FIT: scores.filter((s) => s.grade === 'POOR_FIT').length,
  }

  const avgScore = scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length

  // Collect industry/size/seniority frequency from leads
  const industryFreq: Record<string, number> = {}
  const sizeFreq: Record<string, number> = {}
  const countryFreq: Record<string, number> = {}
  const seniorityFreq: Record<string, number> = {}

  for (const lead of leads) {
    if (lead.company_industry) industryFreq[lead.company_industry] = (industryFreq[lead.company_industry] ?? 0) + 1
    if (lead.company_size) sizeFreq[lead.company_size] = (sizeFreq[lead.company_size] ?? 0) + 1
    if (lead.company_country) countryFreq[lead.company_country] = (countryFreq[lead.company_country] ?? 0) + 1
    if (lead.seniority) seniorityFreq[lead.seniority] = (seniorityFreq[lead.seniority] ?? 0) + 1
  }

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250514'),
      schema: refinementSchema,
      prompt: `Du bist ein B2B Sales Strategy Experte für den DACH-Markt. Analysiere die bisherige Lead-Qualität und schlage ICP-Optimierungen vor.

## Aktueller ICP
- Branchen: ${(icp.industries ?? []).join(', ') || 'Nicht definiert'}
- Unternehmensgrößen: ${(icp.company_sizes ?? []).join(', ') || 'Nicht definiert'}
- Regionen: ${(icp.regions ?? []).join(', ') || 'Nicht definiert'}
- Jobtitel: ${(icp.job_titles ?? []).join(', ') || 'Nicht definiert'}
- Seniority: ${(icp.seniority_levels ?? []).join(', ') || 'Nicht definiert'}
- Tech-Stack: ${(icp.tech_stack ?? []).join(', ') || 'Nicht definiert'}

## Unternehmensprofil
- Firma: ${profile?.company_name ?? 'Unbekannt'}
- Branche: ${profile?.industry ?? 'Unbekannt'}
- Zielmarkt: ${profile?.target_market ?? 'Unbekannt'}
- Produkt: ${profile?.product_summary ?? 'Unbekannt'}

## Lead-Performance (letzte ${scores.length} Leads)
- Durchschnittsscore: ${Math.round(avgScore)}
- Verteilung: HOT=${gradeDistribution.HOT}, QUALIFIED=${gradeDistribution.QUALIFIED}, ENGAGED=${gradeDistribution.ENGAGED}, POTENTIAL=${gradeDistribution.POTENTIAL}, POOR_FIT=${gradeDistribution.POOR_FIT}

## Häufigste Merkmale in den Leads
- Branchen: ${Object.entries(industryFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(', ')}
- Größen: ${Object.entries(sizeFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(', ')}
- Länder: ${Object.entries(countryFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(', ')}
- Seniority: ${Object.entries(seniorityFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (${v})`).join(', ')}

## Aufgabe
1. Analysiere, welche ICP-Parameter zu guten Leads führen und welche zu schlechten.
2. Schlage konkrete Änderungen vor (max 5 Vorschläge).
3. Gib für jeden Vorschlag eine Begründung und den erwarteten Impact an.
4. Schreibe eine kurze Zusammenfassung (2-3 Sätze) auf Deutsch.
5. Bewerte die aktuelle ICP-Qualität als Score (0-100).

Alle Texte auf Deutsch (Sie-Form).`,
    })

    return { success: true as const, data: object }
  } catch (error) {
    console.error('ICP refinement analysis failed:', error)
    return { success: false as const, error: 'Analyse konnte nicht durchgeführt werden' }
  }
}

export async function applyIcpSuggestionAction(suggestion: {
  field: string
  action: string
  suggested_value: string
  current_value?: string
}) {
  const { user, supabase } = await requireAuth()

  const icpResult = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!icpResult.data) {
    return { success: false as const, error: 'Kein ICP-Profil gefunden' }
  }

  const icp = icpResult.data
  const validFields = ['industries', 'company_sizes', 'regions', 'job_titles', 'seniority_levels', 'tech_stack'] as const
  type IcpArrayField = (typeof validFields)[number]
  const field = suggestion.field as IcpArrayField

  if (!validFields.includes(field)) {
    return { success: false as const, error: 'Ungültiges Feld' }
  }

  const currentValues = (icp[field] as string[]) ?? []
  let updatedValues: string[]

  switch (suggestion.action) {
    case 'add':
      updatedValues = [...currentValues, suggestion.suggested_value]
      break
    case 'remove':
      updatedValues = currentValues.filter(
        (v) => v.toLowerCase() !== (suggestion.current_value ?? suggestion.suggested_value).toLowerCase()
      )
      break
    case 'replace':
      updatedValues = currentValues.map((v) =>
        v.toLowerCase() === (suggestion.current_value ?? '').toLowerCase()
          ? suggestion.suggested_value
          : v
      )
      break
    default:
      return { success: false as const, error: 'Ungültige Aktion' }
  }

  const icpData = {
    industries: icp.industries ?? [],
    company_sizes: icp.company_sizes ?? [],
    regions: icp.regions ?? [],
    job_titles: icp.job_titles ?? [],
    seniority_levels: icp.seniority_levels ?? [],
    tech_stack: icp.tech_stack ?? [],
    [field]: updatedValues,
  }

  return updateIcpAction(icpData)
}
