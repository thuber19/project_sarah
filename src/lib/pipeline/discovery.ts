import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '@/types/lead'
import { optimizeSearchQuery } from '@/lib/ai/optimize-query'
import type { BusinessProfile, IcpProfile } from '@/types/database'
import { searchPeople, enrichPerson } from '@/lib/apollo/client'
import type { ApolloPerson } from '@/lib/apollo/types'
import { textSearch } from '@/lib/google-places/client'
import { runScoringPipeline } from '@/lib/scoring/pipeline'
import type { ICP } from '@/lib/scoring/rule-engine'
import { logAgentEvent } from '@/lib/agent-log'

const ENRICHMENT_CONCURRENCY = 3
const MAX_ENRICHMENTS = 20

interface DiscoveryResult {
  leadsFound: number
  leadsScored: number
  failed: number
}

async function setCampaignStatus(supabase: SupabaseClient, campaignId: string, status: string) {
  await supabase
    .from('campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
}

function apolloPersonToLead(
  person: ApolloPerson,
  userId: string,
): Omit<Lead, 'id' | 'created_at' | 'updated_at'> {
  const org = person.organization
  return {
    user_id: userId,
    first_name: person.first_name,
    last_name: person.last_name,
    email: person.email,
    phone: person.phone_numbers?.[0]?.sanitized_number ?? null,
    title: person.title,
    seniority: person.seniority,
    company_name: org?.name ?? null,
    company_domain: org?.website_url ?? null,
    company_industry: org?.industry ?? null,
    company_size: org?.estimated_num_employees
      ? categorizeCompanySize(org.estimated_num_employees)
      : null,
    company_revenue: org?.annual_revenue_printed ?? null,
    company_country: org?.country ?? null,
    company_city: org?.city ?? null,
    source: 'apollo' as const,
    source_id: person.id,
    raw_data: {
      linkedin_url: person.linkedin_url,
      twitter_url: org?.twitter_url,
      technologies: org?.technologies,
      total_funding: org?.total_funding_printed,
      latest_funding_round: org?.latest_funding_round_type,
      founded_year: org?.founded_year,
    },
  }
}

function categorizeCompanySize(employees: number): string {
  if (employees <= 10) return '1-10'
  if (employees <= 50) return '11-50'
  if (employees <= 200) return '51-200'
  if (employees <= 500) return '201-500'
  if (employees <= 1000) return '501-1000'
  if (employees <= 5000) return '1001-5000'
  return '5001+'
}

function placesToLeads(
  places: {
    displayName: string
    websiteUri: string | null
    nationalPhoneNumber: string | null
    formattedAddress: string
    id: string
  },
  userId: string,
): Omit<Lead, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    first_name: null,
    last_name: null,
    email: null,
    phone: places.nationalPhoneNumber,
    title: null,
    seniority: null,
    company_name: places.displayName,
    company_domain: places.websiteUri,
    company_industry: null,
    company_size: null,
    company_revenue: null,
    company_country: null,
    company_city: places.formattedAddress,
    source: 'google_places' as const,
    source_id: places.id,
    raw_data: null,
  }
}

async function enrichTopLeads(people: ApolloPerson[]): Promise<ApolloPerson[]> {
  const toEnrich = people
    .slice(0, MAX_ENRICHMENTS)
    .filter((p) => !p.email && (p.first_name || p.last_name))
  const enriched: ApolloPerson[] = []

  for (let i = 0; i < toEnrich.length; i += ENRICHMENT_CONCURRENCY) {
    const batch = toEnrich.slice(i, i + ENRICHMENT_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((person) =>
        enrichPerson({
          first_name: person.first_name ?? undefined,
          last_name: person.last_name ?? undefined,
          domain: person.organization?.website_url ?? undefined,
          linkedin_url: person.linkedin_url ?? undefined,
        }),
      ),
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result.status === 'fulfilled' && result.value.person) {
        enriched.push(result.value.person)
      } else {
        enriched.push(batch[j])
      }
    }
  }

  // Merge enriched back: replace originals that were enriched, keep the rest
  const enrichedIds = new Set(toEnrich.map((p) => p.id))
  const notEnriched = people.filter((p) => !enrichedIds.has(p.id))
  return [...enriched, ...notEnriched]
}

export async function runDiscoveryPipeline(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  businessProfile: BusinessProfile,
  icpProfile: IcpProfile,
): Promise<DiscoveryResult> {
  try {
    // Step 1: Campaign running
    await setCampaignStatus(supabase, campaignId, 'running')

    // Step 2: Optimize search queries
    await logAgentEvent(supabase, userId, 'pipeline_started', 'Optimiere Suchparameter mit AI...')
    const optimizedQuery = await optimizeSearchQuery(businessProfile, icpProfile)
    await logAgentEvent(
      supabase,
      userId,
      'lead_discovered',
      `Suchstrategie: ${optimizedQuery.reasoning}`,
    )

    // Step 3: Apollo People Search
    await logAgentEvent(supabase, userId, 'lead_discovered', 'Suche Leads via Apollo.io...')
    let apolloPeople: ApolloPerson[] = []
    try {
      // Note: organization_industry_tag_ids expects Apollo internal hex IDs, not
      // plain strings. We omit it and rely on organization_keywords for industry
      // intent instead, which accepts free-form text.
      const apolloResult = await searchPeople({
        person_titles: optimizedQuery.apolloParams.personTitles,
        person_seniorities: optimizedQuery.apolloParams.personSeniorities,
        organization_sizes: optimizedQuery.apolloParams.organizationSizes,
        organization_locations: optimizedQuery.apolloParams.organizationLocations,
        organization_keywords: [
          ...optimizedQuery.apolloParams.organizationKeywords,
          ...optimizedQuery.apolloParams.organizationIndustries,
        ],
        organization_technologies: optimizedQuery.apolloParams.organizationTechnologies,
        per_page: 25,
      })
      apolloPeople = apolloResult.people
      await logAgentEvent(
        supabase,
        userId,
        'lead_discovered',
        `${apolloPeople.length} Leads via Apollo gefunden`,
        {
          count: apolloPeople.length,
        },
      )
    } catch (error) {
      console.error('[Discovery] Apollo search failed:', error)
      await logAgentEvent(
        supabase,
        userId,
        'error',
        'Apollo-Suche fehlgeschlagen, fahre mit Google Places fort',
      )
    }

    // Step 4: Google Places Search
    await logAgentEvent(
      supabase,
      userId,
      'lead_discovered',
      'Suche lokale Unternehmen via Google Places...',
    )
    const placesLeadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[] = []
    for (const query of optimizedQuery.googlePlacesQueries) {
      try {
        const result = await textSearch({ query: query.query, region: query.region })
        for (const place of result.places) {
          placesLeadData.push(placesToLeads(place, userId))
        }
      } catch (error) {
        console.error(`[Discovery] Google Places search failed for "${query.query}":`, error)
      }
    }
    await logAgentEvent(
      supabase,
      userId,
      'lead_discovered',
      `${placesLeadData.length} lokale Unternehmen via Google Places gefunden`,
      {
        count: placesLeadData.length,
      },
    )

    // Step 5: Enrich top Apollo leads
    if (apolloPeople.length > 0) {
      await logAgentEvent(supabase, userId, 'lead_enriched', 'Reichere Top-Leads mit Details an...')
      apolloPeople = await enrichTopLeads(apolloPeople)
    }

    // Step 6: Save all leads to database
    const allLeadData = [
      ...apolloPeople.map((p) => apolloPersonToLead(p, userId)),
      ...placesLeadData,
    ]

    if (allLeadData.length === 0) {
      await setCampaignStatus(supabase, campaignId, 'completed')
      await logAgentEvent(supabase, userId, 'pipeline_completed', 'Keine Leads gefunden.')
      return { leadsFound: 0, leadsScored: 0, failed: 0 }
    }

    const { data: savedLeads, error: saveError } = await supabase
      .from('leads')
      .upsert(allLeadData, { onConflict: 'user_id,source,source_id' })
      .select()

    if (saveError || !savedLeads) {
      throw new Error(`Failed to save leads: ${saveError?.message}`)
    }

    await logAgentEvent(
      supabase,
      userId,
      'lead_discovered',
      `${savedLeads.length} Leads gespeichert`,
    )

    // Step 7: Score all leads
    await logAgentEvent(supabase, userId, 'lead_scored', 'Bewerte und score Leads...')
    const icp: ICP = {
      target_industries: icpProfile.industries ?? [],
      target_company_sizes: icpProfile.company_sizes ?? [],
      target_countries: icpProfile.regions ?? [],
      target_seniorities: icpProfile.seniority_levels ?? [],
      target_titles: icpProfile.job_titles ?? [],
    }
    const scoringResult = await runScoringPipeline(supabase, savedLeads as Lead[], icp, userId)

    // Step 8: Campaign completed
    await setCampaignStatus(supabase, campaignId, 'completed')
    await logAgentEvent(
      supabase,
      userId,
      'pipeline_completed',
      `Fertig! ${savedLeads.length} Leads gefunden und ${scoringResult.scored} bewertet.`,
      { leads_found: savedLeads.length, leads_scored: scoringResult.scored },
    )

    return {
      leadsFound: savedLeads.length,
      leadsScored: scoringResult.scored,
      failed: scoringResult.failed,
    }
  } catch (error) {
    console.error('[Discovery] Pipeline failed:', error)
    await setCampaignStatus(supabase, campaignId, 'failed')
    await logAgentEvent(
      supabase,
      userId,
      'error',
      `Pipeline fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
    )
    throw error
  }
}
