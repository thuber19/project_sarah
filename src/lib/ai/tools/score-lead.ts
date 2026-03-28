import { tool } from 'ai'
import { z } from 'zod'
import { calculateTwoPhaseScore, combinedScore } from '@/lib/scoring/rule-engine'
import type { Lead } from '@/types/lead'
import { getGradeForScore } from '@/lib/scoring/grade'
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
      await logToolAction(
        ctx,
        'lead_scored',
        `Scoring gestartet für ${params.firstName} ${params.lastName}`,
      )

      try {
        const lead = {
          id: '',
          user_id: '',
          campaign_id: null,
          first_name: params.firstName,
          last_name: params.lastName,
          full_name: [params.firstName, params.lastName].filter(Boolean).join(' ') || null,
          email: params.email ?? null,
          linkedin_url: null,
          photo_url: null,
          job_title: params.title ?? null,
          seniority: params.seniority ?? null,
          company_name: params.companyName ?? null,
          company_domain: null,
          company_website: null,
          industry: params.companyIndustry ?? null,
          company_size: params.companySize ?? null,
          revenue_range: null,
          funding_stage: null,
          location: params.companyCity ?? null,
          country: params.companyCountry ?? null,
          source: 'apollo' as const,
          apollo_id: null,
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

        const twoPhase = calculateTwoPhaseScore(lead, icp)
        const totalScore = combinedScore(twoPhase)
        const grade = getGradeForScore(totalScore)

        await logToolAction(
          ctx,
          'lead_scored',
          `Score: ${params.firstName} ${params.lastName} = ${totalScore} (${grade}) | Company: ${twoPhase.company_score}${twoPhase.company_qualified ? ` → Person: ${twoPhase.person_score}` : ' (nicht qualifiziert)'}`,
          {
            totalScore,
            grade,
            companyScore: twoPhase.company_score,
            personScore: twoPhase.person_score,
            companyQualified: twoPhase.company_qualified,
          },
        )

        return {
          success: true as const,
          totalScore,
          grade,
          companyScore: twoPhase.company_score,
          personScore: twoPhase.person_score,
          companyQualified: twoPhase.company_qualified,
          companyBreakdown: twoPhase.company_breakdown,
          personBreakdown: twoPhase.person_breakdown,
          exclusionPenalties: twoPhase.exclusion_penalties,
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Scoring fehlgeschlagen'
        await logToolAction(ctx, 'campaign_failed', `Scoring fehlgeschlagen: ${msg}`)
        return {
          success: false as const,
          error: msg,
          totalScore: 0,
          grade: 'POOR' as const,
          breakdown: null,
        }
      }
    },
  })
}
