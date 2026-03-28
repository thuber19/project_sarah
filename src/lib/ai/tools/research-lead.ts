import { tool } from 'ai'
import { z } from 'zod'
import { logToolAction, type ToolContext } from './context'

export function createResearchLead(ctx: ToolContext) {
  return tool({
    description:
      'Recherchiert ein Unternehmen im Detail: Website-Analyse, Tech-Stack, Stellenangebote, Preismodell und DACH-spezifische Daten.',
    inputSchema: z.object({
      leadId: z.string().describe('ID des Leads'),
    }),
    execute: async ({ leadId }) => {
      // Check if we have cached research (< 7 days old)
      const { data: cached } = await ctx.supabase
        .from('lead_research')
        .select(
          'full_report, tech_stack, hiring_info, pricing_model, news_summary, locations, updated_at',
        )
        .eq('lead_id', leadId)
        .eq('user_id', ctx.userId)
        .maybeSingle()

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.updated_at).getTime()
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (cacheAge < sevenDays) {
          return {
            success: true as const,
            cached: true,
            report: cached.full_report,
            tech_stack: cached.tech_stack,
            hiring_info: cached.hiring_info,
            pricing_model: cached.pricing_model,
            news_summary: cached.news_summary,
            locations: cached.locations,
          }
        }
      }

      // Fetch lead
      const { data: lead } = await ctx.supabase
        .from('leads')
        .select('company_name, company_domain, company_website, industry, location, country')
        .eq('id', leadId)
        .eq('user_id', ctx.userId)
        .single()

      if (!lead) return { success: false as const, error: 'Lead nicht gefunden' }

      await logToolAction(ctx, 'research_started', `Research gestartet: ${lead.company_name}`, {
        lead_id: leadId,
      })

      // Return lead data for the AI to use in generating research
      return {
        success: true as const,
        cached: false,
        lead,
        message: `Research-Daten für ${lead.company_name} geladen. Generiere Analyse...`,
      }
    },
  })
}
