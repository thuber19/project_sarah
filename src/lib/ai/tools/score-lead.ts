import { tool } from 'ai'
import { z } from 'zod'
import { calculateRuleScore, totalFromBreakdown } from '@/lib/scoring/rule-engine'
import type { Lead } from '@/types/lead'
import type { ICP } from '@/lib/scoring/rule-engine'
import { logToolAction, type ToolContext } from './context'

export function createScoreLead(ctx: ToolContext) {
  return tool({
    description:
      'Bewertet einen einzelnen Lead mit dem regel-basierten Scoring-Modell. Gibt Score (0-100), Grade und Breakdown zurück.',
    inputSchema: z.object({
      firstName: z.string(),
      lastName: z.string(),
      title: z.string().optional(),
      seniority: z.string().optional(),
      companyName: z.string().optional(),
      companyIndustry: z.string().optional(),
      companySize: z.string().optional(),
      companyCountry: z.string().optional(),
      companyCity: z.string().optional(),
      email: z.string().optional(),
      icp: z.object({
        targetIndustries: z.array(z.string()),
        targetCompanySizes: z.array(z.string()),
        targetCountries: z.array(z.string()),
        targetSeniorities: z.array(z.string()),
        targetTitles: z.array(z.string()),
      }),
    }),
    execute: async (params) => {
      await logToolAction(ctx, 'lead_scored', `Scoring gestartet für ${params.firstName} ${params.lastName}`)

      try {
        const lead = {
          id: '',
          user_id: '',
          first_name: params.firstName,
          last_name: params.lastName,
          title: params.title ?? null,
          seniority: params.seniority ?? null,
          company_name: params.companyName ?? null,
          company_domain: null,
          company_industry: params.companyIndustry ?? null,
          company_size: params.companySize ?? null,
          company_revenue: null,
          company_country: params.companyCountry ?? null,
          company_city: params.companyCity ?? null,
          email: params.email ?? null,
          phone: null,
          source: 'manual' as const,
          source_id: null,
          raw_data: null,
          created_at: '',
          updated_at: '',
        } satisfies Lead

        const icp: ICP = {
          target_industries: params.icp.targetIndustries,
          target_company_sizes: params.icp.targetCompanySizes,
          target_countries: params.icp.targetCountries,
          target_seniorities: params.icp.targetSeniorities,
          target_titles: params.icp.targetTitles,
        }

        const breakdown = calculateRuleScore(lead, icp)
        const totalScore = totalFromBreakdown(breakdown)

        const grade =
          totalScore >= 85
            ? 'HOT'
            : totalScore >= 70
              ? 'QUALIFIED'
              : totalScore >= 50
                ? 'ENGAGED'
                : totalScore >= 30
                  ? 'POTENTIAL'
                  : 'POOR_FIT'

        await logToolAction(ctx, 'lead_scored', `Score: ${params.firstName} ${params.lastName} = ${totalScore} (${grade})`, {
          totalScore,
          grade,
        })

        return {
          success: true as const,
          totalScore,
          grade,
          breakdown: {
            companyFit: breakdown.company_fit,
            contactFit: breakdown.contact_fit,
            buyingSignals: breakdown.buying_signals,
            timing: breakdown.timing,
          },
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Scoring fehlgeschlagen'
        await logToolAction(ctx, 'campaign_failed', `Scoring fehlgeschlagen: ${msg}`)
        return { success: false as const, error: msg, totalScore: 0, grade: 'POOR_FIT' as const, breakdown: null }
      }
    },
  })
}
