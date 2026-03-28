'use server'

import { requireAuth } from '@/lib/supabase/server'
import { z } from 'zod/v4'
import { revalidatePath } from 'next/cache'
import { calculatePersonScoreV2 } from '@/lib/scoring/person-scoring'
import type { ContactPreferences, Lead } from '@/types/lead'

const contactPreferencesSchema = z.object({
  ideal_titles: z.array(z.string()),
  ideal_seniority: z.array(z.string()),
  ideal_departments: z.array(z.string()),
  preferred_channels: z.array(z.enum(['email', 'linkedin', 'phone', 'xing'])).min(1),
})

/**
 * Save contact preferences to the user's ICP profile.
 */
export async function saveContactPreferencesAction(data: ContactPreferences) {
  const { user, supabase } = await requireAuth()

  const parsed = contactPreferencesSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Präferenzen' }

  const { error } = await supabase
    .from('icp_profiles')
    .update({
      ideal_titles: parsed.data.ideal_titles,
      ideal_seniority: parsed.data.ideal_seniority,
      ideal_departments: parsed.data.ideal_departments,
      preferred_channels: parsed.data.preferred_channels,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { success: false as const, error: 'Präferenzen konnten nicht gespeichert werden' }
  return { success: true as const }
}

/**
 * Load saved contact preferences.
 */
export async function getContactPreferencesAction() {
  const { user, supabase } = await requireAuth()

  const { data } = await supabase
    .from('icp_profiles')
    .select('ideal_titles, ideal_seniority, ideal_departments, preferred_channels')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) return { success: true as const, data: null }

  const prefs: ContactPreferences = {
    ideal_titles: data.ideal_titles ?? [],
    ideal_seniority: data.ideal_seniority ?? [],
    ideal_departments: data.ideal_departments ?? [],
    preferred_channels: data.preferred_channels ?? ['email', 'linkedin'],
  }

  return { success: true as const, data: prefs }
}

/**
 * Run person scoring for all qualified companies (TOP_MATCH + GOOD_FIT).
 * Saves preferences first, then scores each lead's contacts.
 */
export async function runPersonScoringAction(preferences: ContactPreferences) {
  const { user, supabase } = await requireAuth()

  const parsed = contactPreferencesSchema.safeParse(preferences)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Präferenzen' }

  // Save preferences
  await saveContactPreferencesAction(parsed.data)

  // Get all leads with company_qualified = true OR grade in TOP_MATCH/GOOD_FIT/HOT/QUALIFIED/ENGAGED/POTENTIAL
  const { data: qualifiedScores } = await supabase
    .from('lead_scores')
    .select('lead_id, grade, company_score')
    .eq('user_id', user.id)
    .or('company_qualified.eq.true,grade.in.(HOT,QUALIFIED,ENGAGED,POTENTIAL,TOP_MATCH,GOOD_FIT)')

  if (!qualifiedScores || qualifiedScores.length === 0) {
    return { success: false as const, error: 'Keine qualifizierten Companies gefunden. Führe zuerst das Company-Scoring durch.' }
  }

  const leadIds = qualifiedScores.map((s) => s.lead_id)

  // Fetch lead data
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .in('id', leadIds)

  if (!leads || leads.length === 0) {
    return { success: false as const, error: 'Leads konnten nicht geladen werden' }
  }

  // Score each person
  let scored = 0
  for (const lead of leads) {
    const { score, breakdown } = calculatePersonScoreV2(lead as Lead, parsed.data)

    await supabase
      .from('lead_scores')
      .update({
        person_score: score,
        person_breakdown: breakdown,
        persona_tag: breakdown.persona_tag,
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', lead.id)
      .eq('user_id', user.id)

    scored++
  }

  revalidatePath('/leads')
  revalidatePath('/scoring')

  return {
    success: true as const,
    data: { scored, total: leads.length },
  }
}
