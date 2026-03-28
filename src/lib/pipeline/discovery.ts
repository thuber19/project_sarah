import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lead } from '@/types/lead'
import { optimizeSearchQuery } from '@/lib/ai/optimize-query'
import type { BusinessProfile, IcpProfile } from '@/types/database'
import { searchPeople, searchOrganizations } from '@/lib/apollo/client'
import type { ApolloPerson, ApolloOrganization } from '@/lib/apollo/types'
import { textSearch } from '@/lib/google-places/client'
import { runScoringPipeline } from '@/lib/scoring/pipeline'
import type { ICP } from '@/lib/scoring/rule-engine'
import { logAgentAction } from '@/lib/agent-log'
import { PipelineTimer } from '@/lib/pipeline/timer'

// Max number of top organizations to fetch contacts for (one people search request)
const MAX_CONTACT_ORGS = 10

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
    campaign_id: null,
    first_name: person.first_name,
    last_name: person.last_name,
    full_name: [person.first_name, person.last_name].filter(Boolean).join(' ') || null,
    email: person.email,
    linkedin_url: person.linkedin_url ?? null,
    photo_url: null,
    job_title: person.title,
    seniority: person.seniority,
    company_name: org?.name ?? null,
    company_domain: org?.website_url ?? null,
    company_website: org?.website_url ?? null,
    industry: org?.industry ?? null,
    company_size: org?.estimated_num_employees
      ? categorizeCompanySize(org.estimated_num_employees)
      : null,
    revenue_range: org?.annual_revenue_printed ?? null,
    funding_stage: org?.latest_funding_round_type ?? null,
    country: org?.country ?? null,
    location: org?.city ?? null,
    source: 'apollo' as const,
    apollo_id: person.id,
    raw_data: {
      phone: person.phone_numbers?.[0]?.sanitized_number,
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
    campaign_id: null,
    first_name: null,
    last_name: null,
    full_name: null,
    email: null,
    linkedin_url: null,
    photo_url: null,
    job_title: null,
    seniority: null,
    company_name: places.displayName,
    company_domain: places.websiteUri,
    company_website: places.websiteUri,
    industry: null,
    company_size: null,
    revenue_range: null,
    funding_stage: null,
    country: null,
    location: places.formattedAddress,
    source: 'google_places' as const,
    apollo_id: places.id,
    raw_data: {
      phone: places.nationalPhoneNumber,
    },
  }
}

/**
 * Two-step Apollo strategy:
 * 1. Search organizations to find matching companies (uses org search endpoint)
 * 2. Fetch contacts for the top-ranked organizations in a single people search
 *
 * This avoids per-org requests and keeps Apollo API calls to exactly 2.
 */
async function runApolloSearch(
  params: {
    keywords: string[]
    employeeRanges: string[]
    locations: string[]
    technologies?: string[]
    personTitles: string[]
    personSeniorities: string[]
  },
  userId: string,
): Promise<ApolloPerson[]> {
  // Step A: Find matching organizations
  const orgResult = await searchOrganizations({
    organization_keywords: params.keywords,
    organization_num_employees_ranges: params.employeeRanges,
    organization_locations: params.locations,
    organization_technologies: params.technologies,
    per_page: 25,
  })

  const orgs: ApolloOrganization[] = orgResult.organizations
  if (orgs.length === 0) return []

  // Step B: Take the top N orgs (Apollo returns them relevance-sorted) and
  // fetch contacts for all of them in a single people search request.
  const topOrgNames = orgs
    .slice(0, MAX_CONTACT_ORGS)
    .map((o) => o.name)
    .filter((n): n is string => !!n)

  if (topOrgNames.length === 0) return []

  const peopleResult = await searchPeople({
    organization_names: topOrgNames,
    person_titles: params.personTitles,
    person_seniorities: params.personSeniorities,
    per_page: 25,
  })

  return peopleResult.people
}

export async function runDiscoveryPipeline(
  supabase: SupabaseClient,
  userId: string,
  campaignId: string,
  businessProfile: BusinessProfile,
  icpProfile: IcpProfile,
): Promise<DiscoveryResult> {
  const timer = new PipelineTimer()
  timer.start('total_pipeline_ms')

  try {
    // Step 1: Campaign running
    await setCampaignStatus(supabase, campaignId, 'running')

    // Step 2: Optimize search queries
    timer.start('query_optimization_ms')
    await logAgentAction(
      { supabase, userId },
      'campaign_started',
      'Optimiere Suchparameter mit AI...',
    )
    const optimizedQuery = await optimizeSearchQuery(businessProfile, icpProfile)
    timer.stop('query_optimization_ms')
    await logAgentAction(
      { supabase, userId },
      'leads_discovered',
      `Suchstrategie: ${optimizedQuery.reasoning}`,
    )

    // Step 3: Apollo (org search → people search) + Google Places in parallel
    timer.start('apollo_search_ms')
    await logAgentAction({ supabase, userId }, 'leads_discovered', 'Suche Leads via Apollo.io...')

    const [apolloPeople, placesLeadData] = await Promise.all([
      // Apollo: org search then single people search for top orgs
      runApolloSearch(
        {
          // Merge industry names into keywords — org_industry_tag_ids requires
          // Apollo internal hex IDs which we can't reliably generate via AI
          keywords: [
            ...optimizedQuery.apolloParams.organizationKeywords,
            ...optimizedQuery.apolloParams.organizationIndustries,
          ],
          employeeRanges: optimizedQuery.apolloParams.organizationSizes,
          locations: optimizedQuery.apolloParams.organizationLocations,
          technologies: optimizedQuery.apolloParams.organizationTechnologies,
          personTitles: optimizedQuery.apolloParams.personTitles,
          personSeniorities: optimizedQuery.apolloParams.personSeniorities,
        },
        userId,
      ).catch((error) => {
        console.error('[Discovery] Apollo search failed:', error)
        logAgentAction(
          { supabase, userId },
          'campaign_failed',
          `Apollo-Suche fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        )
        return [] as ApolloPerson[]
      }),

      // Google Places: all queries in parallel
      Promise.all(
        optimizedQuery.googlePlacesQueries.map((q) =>
          textSearch({ query: q.query, region: q.region }).catch((error) => {
            console.error(`[Discovery] Google Places failed for "${q.query}":`, error)
            return { places: [] }
          }),
        ),
      ).then((results) =>
        results.flatMap((r) => r.places.map((place) => placesToLeads(place, userId))),
      ),
    ])
    timer.stop('apollo_search_ms')

    await logAgentAction(
      { supabase, userId },
      'leads_discovered',
      `${apolloPeople.length} Apollo-Kontakte, ${placesLeadData.length} Google Places Treffer`,
      { apollo: apolloPeople.length, places: placesLeadData.length },
    )

    // Step 4: Save all leads
    const allLeadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[] = [
      ...apolloPeople.map((p) => apolloPersonToLead(p, userId)),
      ...placesLeadData,
    ]

    if (allLeadData.length === 0) {
      await setCampaignStatus(supabase, campaignId, 'completed')
      await logAgentAction({ supabase, userId }, 'campaign_completed', 'Keine Leads gefunden.')
      return { leadsFound: 0, leadsScored: 0, failed: 0 }
    }

    const { data: savedLeads, error: saveError } = await supabase
      .from('leads')
      .upsert(allLeadData, { onConflict: 'user_id,source,apollo_id' })
      .select()

    if (saveError || !savedLeads) {
      throw new Error(`Failed to save leads: ${saveError?.message}`)
    }

    await logAgentAction(
      { supabase, userId },
      'leads_discovered',
      `${savedLeads.length} Leads gespeichert`,
    )

    // Step 5: Score all leads
    timer.start('scoring_ms')
    await logAgentAction({ supabase, userId }, 'lead_scored', 'Bewerte und score Leads...')
    const icp: ICP = {
      target_industries: icpProfile.industries ?? [],
      target_company_sizes: icpProfile.company_sizes ?? [],
      target_countries: icpProfile.regions ?? [],
      target_seniorities: icpProfile.seniority_levels ?? [],
      target_titles: icpProfile.job_titles ?? [],
    }
    const scoringResult = await runScoringPipeline(supabase, savedLeads as Lead[], icp, userId)
    timer.stop('scoring_ms')

    // Step 6: Campaign completed
    timer.stop('total_pipeline_ms')
    await setCampaignStatus(supabase, campaignId, 'completed')
    await logAgentAction(
      { supabase, userId },
      'campaign_completed',
      `Fertig! ${savedLeads.length} Leads gefunden und ${scoringResult.scored} bewertet.`,
      {
        leads_found: savedLeads.length,
        leads_scored: scoringResult.scored,
        pipeline_timing: timer.getMetrics(),
      },
    )

    return {
      leadsFound: savedLeads.length,
      leadsScored: scoringResult.scored,
      failed: scoringResult.failed,
    }
  } catch (error) {
    console.error('[Discovery] Pipeline failed:', error)
    await setCampaignStatus(supabase, campaignId, 'failed')
    await logAgentAction(
      { supabase, userId },
      'campaign_failed',
      `Pipeline fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
    )
    throw error
  }
}
