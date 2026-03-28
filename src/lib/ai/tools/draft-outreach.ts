import { tool } from 'ai'
import { z } from 'zod'
import { logToolAction, type ToolContext } from './context'

export function createDraftOutreach(ctx: ToolContext) {
  return tool({
    description:
      'Generiert einen personalisierten E-Mail-Entwurf für die Kontaktaufnahme mit einem Lead. Unterstützt Erstkontakt, Follow-up und Terminvorschlag.',
    inputSchema: z.object({
      leadId: z.string().describe('ID des Leads'),
      template: z
        .enum(['initial_contact', 'follow_up', 'meeting_proposal'])
        .describe('Art der Outreach-Nachricht'),
    }),
    execute: async ({ leadId, template }) => {
      await logToolAction(ctx, 'query_optimized', `Outreach-Entwurf generieren für Lead ${leadId}`)

      try {
        const { data: lead } = await ctx.supabase
          .from('leads')
          .select(
            'company_name, first_name, last_name, job_title, industry, location, country, email, company_domain',
          )
          .eq('id', leadId)
          .eq('user_id', ctx.userId)
          .single()

        if (!lead) {
          return { success: false as const, error: 'Lead nicht gefunden' }
        }

        const [scoreResult, profileResult] = await Promise.all([
          ctx.supabase
            .from('lead_scores')
            .select('total_score, grade, ai_reasoning')
            .eq('lead_id', leadId)
            .maybeSingle(),
          ctx.supabase
            .from('business_profiles')
            .select('company_name, industry, value_proposition, product_summary')
            .eq('user_id', ctx.userId)
            .maybeSingle(),
        ])

        await logToolAction(
          ctx,
          'query_optimized',
          `Outreach-Daten geladen: ${lead.company_name ?? 'Unbekannt'} (${template})`,
        )

        return {
          success: true as const,
          lead,
          score: scoreResult.data,
          profile: profileResult.data,
          template,
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Outreach-Entwurf fehlgeschlagen'
        await logToolAction(ctx, 'campaign_failed', `Outreach-Entwurf fehlgeschlagen: ${msg}`)
        return { success: false as const, error: msg }
      }
    },
  })
}
