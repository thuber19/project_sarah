import { tool } from 'ai'
import { z } from 'zod'
import { searchPeople } from '@/lib/apollo/client'
import { logToolAction, type ToolContext } from './context'

export function createSearchLeads(ctx: ToolContext) {
  return tool({
    description:
      'Sucht potenzielle Leads via Apollo.io basierend auf Suchkriterien. Nutze deutsche und englische Jobtitel für den DACH-Markt (Geschäftsführer, Leiter, Head of, etc.).',
    inputSchema: z.object({
      personTitles: z.array(z.string()).optional().describe('Jobtitel auf Englisch und Deutsch'),
      personSeniorities: z
        .array(z.enum(['owner', 'founder', 'c_suite', 'vp', 'director', 'manager', 'senior', 'entry']))
        .optional()
        .describe('Apollo Seniority-Level'),
      organizationSizes: z
        .array(z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+']))
        .optional()
        .describe('Firmengröße'),
      industries: z.array(z.string()).optional().describe('Apollo industry tags (auf Englisch)'),
      locations: z.array(z.string()).optional().describe('Länder und Städte (z.B. Austria, Germany, Switzerland, Wien)'),
      keywords: z.array(z.string()).optional().describe('Keywords für Zielunternehmen'),
      technologies: z.array(z.string()).optional().describe('Technologien der Zielunternehmen'),
      perPage: z.number().min(1).max(100).optional().describe('Ergebnisse pro Seite (max 100)'),
    }),
    execute: async (params) => {
      await logToolAction(ctx, 'leads_discovered', 'Suche Leads via Apollo.io...', {
        titles: params.personTitles,
        locations: params.locations,
      })

      try {
        const result = await searchPeople({
          person_titles: params.personTitles,
          person_seniorities: params.personSeniorities,
          organization_sizes: params.organizationSizes,
          organization_industry_tag_ids: params.industries,
          organization_locations: params.locations,
          organization_keywords: params.keywords,
          organization_technologies: params.technologies,
          per_page: params.perPage ?? 25,
        })

        const people = (result.people ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          title: p.title,
          seniority: p.seniority,
          email: p.email,
          company: p.organization?.name ?? null,
          industry: p.organization?.industry ?? null,
          companySize: p.organization?.estimated_num_employees ?? null,
          country: p.organization?.country ?? null,
          city: p.organization?.city ?? null,
          linkedinUrl: p.linkedin_url,
        }))

        await logToolAction(ctx, 'leads_discovered', `${people.length} Leads gefunden via Apollo.io`, {
          totalResults: result.pagination?.total_entries ?? 0,
          returned: people.length,
        })

        return {
          success: true as const,
          totalResults: result.pagination?.total_entries ?? 0,
          people,
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Apollo-Suche fehlgeschlagen'
        await logToolAction(ctx, 'campaign_failed', `Apollo-Suche fehlgeschlagen: ${msg}`)
        return { success: false as const, error: msg, people: [] as never[], totalResults: 0 }
      }
    },
  })
}
