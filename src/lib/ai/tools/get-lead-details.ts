import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createGetLeadDetails(supabase: SupabaseClient, userId: string) {
  return tool({
    description:
      'Lädt Details eines Leads inkl. Score und Breakdown aus der Datenbank. Benötigt die Lead-ID.',
    inputSchema: z.object({
      leadId: z.string().uuid().describe('UUID des Leads'),
    }),
    execute: async (params) => {
      try {
        const [leadResult, scoreResult] = await Promise.all([
          supabase
            .from('leads')
            .select('id, first_name, last_name, email, title, seniority, company_name, company_industry, company_size, company_country, company_city, linkedin_url, source, created_at')
            .eq('id', params.leadId)
            .eq('user_id', userId)
            .single(),
          supabase
            .from('lead_scores')
            .select('total_score, grade, company_fit, contact_fit, buying_signals, timing, ai_reasoning, ai_recommendation')
            .eq('lead_id', params.leadId)
            .eq('user_id', userId)
            .single(),
        ])

        if (leadResult.error || !leadResult.data) {
          return { success: false as const, error: 'Lead nicht gefunden', lead: null, score: null }
        }

        return {
          success: true as const,
          lead: leadResult.data,
          score: scoreResult.data ?? null,
        }
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error.message : 'Fehler beim Laden',
          lead: null,
          score: null,
        }
      }
    },
  })
}
