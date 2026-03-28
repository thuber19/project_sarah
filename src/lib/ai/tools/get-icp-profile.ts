import { tool } from 'ai'
import { z } from 'zod'
import { logToolAction, type ToolContext } from './context'

export function createGetIcpProfile(ctx: ToolContext) {
  const { supabase, userId } = ctx
  return tool({
    description:
      'Lädt das Ideal Customer Profile (ICP) und Firmenprofil des Users aus der Datenbank. Enthält Zielbranchen, Firmengrößen, Regionen, Jobtitel und Seniority-Level.',
    inputSchema: z.object({}),
    execute: async () => {
      await logToolAction(ctx, 'query_optimized', 'ICP-Profil wird geladen')
      try {
        const [profileResult, icpResult] = await Promise.all([
          supabase
            .from('business_profiles')
            .select('company_name, industry, description, product_summary, value_proposition, target_market, website_url')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('icp_profiles')
            .select('industries, company_sizes, regions, job_titles, seniority_levels, tech_stack, revenue_ranges, funding_stages, keywords')
            .eq('user_id', userId)
            .single(),
        ])

        return {
          success: true as const,
          businessProfile: profileResult.data ?? null,
          icpProfile: icpResult.data ?? null,
        }
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error.message : 'Fehler beim Laden des ICP',
          businessProfile: null,
          icpProfile: null,
        }
      }
    },
  })
}
