'use server'

import { createClient, requireAuth } from '@/lib/supabase/server'
import { searchOrganizations } from '@/lib/apollo/client'
import { textSearch } from '@/lib/google-places/client'
import { optimizeSearchQuery } from '@/lib/ai/optimize-query'
import { runScoringPipeline } from '@/lib/scoring/pipeline'
import type { ICP } from '@/lib/scoring/rule-engine'
import type { Lead } from '@/types/lead'
import type { ApolloOrganization } from '@/lib/apollo/types'
import type { Place } from '@/lib/google-places/types'
import type { Database } from '@/types/database'
import type { ApiResponse } from '@/lib/api-response'
import { ok, fail } from '@/lib/api-response'
import { PipelineTimer } from '@/lib/pipeline/timer'
import { deduplicateLeads } from '@/lib/pipeline/dedup'

type LeadInsert = Database['public']['Tables']['leads']['Insert']
type AgentLogInsert = Database['public']['Tables']['agent_logs']['Insert']

interface DiscoveryFormData {
  industries: string
  companySize: string
  region: string
  technologies?: string
  keywords?: string
}

// Leads found during discovery but not yet saved to the DB.
// Passed back to the client for review/selection before saving.
export interface DiscoveredLead {
  tempId: string
  company_name: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  linkedin_url: string | null
  job_title: string | null
  seniority: string | null
  industry: string | null
  company_size: string | null
  company_domain: string | null
  company_website: string | null
  country: string | null
  location: string | null
  source: 'apollo' | 'google_places'
  apollo_id: string | null
  raw_data: Record<string, unknown> | null
}

interface DiscoveryResult {
  campaignId: string
  leads: DiscoveredLead[]
}

async function logAgent(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  campaignId: string,
  actionType: AgentLogInsert['action_type'],
  message: string,
  metadata?: Record<string, unknown>,
) {
  await supabase.from('agent_logs').insert({
    user_id: userId,
    campaign_id: campaignId,
    action_type: actionType,
    message,
    metadata: metadata ?? null,
  })
}

function apolloOrgToDiscovered(org: ApolloOrganization): DiscoveredLead {
  return {
    tempId: crypto.randomUUID(),
    first_name: null,
    last_name: null,
    full_name: null,
    email: null,
    linkedin_url: org.linkedin_url ?? null,
    job_title: null,
    seniority: null,
    company_name: org.name ?? null,
    company_domain: org.website_url ?? null,
    company_website: org.website_url ?? null,
    industry: org.industry ?? null,
    company_size: org.estimated_num_employees ? categorizeSize(org.estimated_num_employees) : null,
    country: org.country ?? null,
    location: org.city ? `${org.city}, ${org.country ?? ''}`.trim() : null,
    source: 'apollo',
    apollo_id: org.id,
    raw_data: {
      twitter_url: org.twitter_url,
      technologies: org.technologies,
      total_funding: org.total_funding_printed,
      latest_funding_round: org.latest_funding_round_type,
      founded_year: org.founded_year,
    },
  }
}

function categorizeSize(employees: number): string {
  if (employees <= 10) return '1-10'
  if (employees <= 50) return '11-50'
  if (employees <= 200) return '51-200'
  if (employees <= 500) return '201-500'
  if (employees <= 1000) return '501-1000'
  if (employees <= 5000) return '1001-5000'
  return '5001+'
}

// ---------------------------------------------------------------------------
// Google Places → Lead helpers
// ---------------------------------------------------------------------------

const DACH_COUNTRY_MAP: Record<string, string> = {
  österreich: 'Austria',
  austria: 'Austria',
  deutschland: 'Germany',
  germany: 'Germany',
  schweiz: 'Switzerland',
  switzerland: 'Switzerland',
}

function extractCountryFromAddress(address: string): string | null {
  const lastSegment = address.split(',').pop()?.trim().toLowerCase()
  if (!lastSegment) return null
  return DACH_COUNTRY_MAP[lastSegment] ?? null
}

const PLACE_TYPE_TO_INDUSTRY: Record<string, string> = {
  accounting: 'Steuerberatung & Buchhaltung',
  lawyer: 'Rechtsberatung',
  insurance_agency: 'Versicherungen',
  real_estate_agency: 'Immobilien',
  finance: 'Finanzdienstleistungen',
  bank: 'Finanzdienstleistungen',
  marketing_agency: 'Marketing & Werbung',
  it_services: 'IT-Dienstleistungen',
  software_company: 'Software',
  consulting: 'Beratung',
  restaurant: 'Gastronomie',
  hotel: 'Hotellerie',
  hospital: 'Gesundheitswesen',
  dentist: 'Gesundheitswesen',
  doctor: 'Gesundheitswesen',
  pharmacy: 'Gesundheitswesen',
  gym: 'Fitness & Wellness',
  car_dealer: 'Automobilhandel',
  car_repair: 'Automobilservice',
  electrician: 'Handwerk & Technik',
  plumber: 'Handwerk & Technik',
  store: 'Einzelhandel',
  supermarket: 'Einzelhandel',
  school: 'Bildung',
  university: 'Bildung',
}

function mapPlaceTypesToIndustry(types: string[]): string | null {
  for (const type of types) {
    const industry = PLACE_TYPE_TO_INDUSTRY[type]
    if (industry) return industry
  }
  return null
}

function placeToDiscovered(place: Place): DiscoveredLead {
  return {
    tempId: crypto.randomUUID(),
    company_name: place.displayName,
    full_name: null,
    first_name: null,
    last_name: null,
    email: null,
    linkedin_url: null,
    job_title: null,
    seniority: null,
    company_domain: place.websiteUri,
    company_website: place.websiteUri,
    location: place.formattedAddress,
    country: extractCountryFromAddress(place.formattedAddress),
    industry: mapPlaceTypesToIndustry(place.types),
    company_size: null,
    source: 'google_places',
    apollo_id: null,
    raw_data: {
      place_id: place.id,
      rating: place.rating,
      user_rating_count: place.userRatingCount,
      phone: place.nationalPhoneNumber,
      international_phone: place.internationalPhoneNumber,
      business_status: place.businessStatus,
      types: place.types,
    },
  }
}

export async function startDiscoveryAction(
  formData: DiscoveryFormData,
): Promise<ApiResponse<DiscoveryResult>> {
  const { user, supabase } = await requireAuth()

  // Fetch business profile + ICP in parallel (independent queries)
  const [{ data: profile }, { data: icpData }] = await Promise.all([
    supabase
      .from('business_profiles')
      .select(
        'id, user_id, website_url, company_name, description, industry, product_summary, value_proposition, target_market, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('icp_profiles')
      .select(
        'id, user_id, business_profile_id, industries, company_sizes, regions, job_titles, seniority_levels, tech_stack, revenue_ranges, funding_stages, keywords, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .single(),
  ])

  // Create campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('search_campaigns')
    .insert({
      user_id: user.id,
      icp_profile_id: icpData?.id ?? null,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (campaignError || !campaign) {
    console.error('[Discovery] Campaign creation failed:', campaignError)
    return fail('INTERNAL_ERROR', 'Campaign konnte nicht erstellt werden')
  }

  const timer = new PipelineTimer()
  timer.start('total_pipeline_ms')

  try {
    await logAgent(supabase, user.id, campaign.id, 'campaign_started', 'Lead Discovery gestartet')

    // Step 1: Optimize search queries with AI
    timer.start('query_optimization_ms')
    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'query_optimized',
      'Optimiere Suchparameter mit AI...',
    )

    const industries = formData.industries
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const regions = formData.region
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const technologies =
      formData.technologies
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? []
    const keywords =
      formData.keywords
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? []

    // Build effective ICP by merging DB data with form inputs as fallback
    const effectiveIcp = {
      id: icpData?.id ?? '',
      user_id: user.id,
      business_profile_id: icpData?.business_profile_id ?? null,
      industries: icpData?.industries ?? industries,
      company_sizes: icpData?.company_sizes ?? [formData.companySize],
      regions: icpData?.regions ?? regions,
      seniority_levels: icpData?.seniority_levels ?? [],
      job_titles: icpData?.job_titles ?? [],
      tech_stack: technologies,
      revenue_ranges: icpData?.revenue_ranges ?? null,
      funding_stages: icpData?.funding_stages ?? null,
      keywords: keywords.length > 0 ? keywords : (icpData?.keywords ?? null),
      created_at: icpData?.created_at ?? new Date().toISOString(),
      updated_at: icpData?.updated_at ?? new Date().toISOString(),
    }

    const effectiveProfile = profile ?? {
      id: '',
      user_id: user.id,
      website_url: '',
      company_name: null,
      description: null,
      industry: null,
      product_summary: null,
      value_proposition: null,
      target_market: 'DACH',
      raw_scraped_content: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const optimizedQuery = await optimizeSearchQuery(effectiveProfile, effectiveIcp)
    timer.stop('query_optimization_ms')

    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'query_optimized',
      `Suchstrategie: ${optimizedQuery.reasoning}`,
    )

    const allLeads: DiscoveredLead[] = []

    // Step 2: Apollo Organization Search
    timer.start('apollo_search_ms')
    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'leads_discovered',
      'Suche Unternehmen via Apollo.io...',
    )
    try {
      const apolloResult = await searchOrganizations({
        organization_num_employees_ranges: optimizedQuery.apolloParams.organizationSizes,
        organization_locations: optimizedQuery.apolloParams.organizationLocations,
        organization_keywords: [
          ...optimizedQuery.apolloParams.organizationKeywords,
          ...optimizedQuery.apolloParams.organizationIndustries,
          ...keywords,
        ],
        organization_technologies:
          technologies.length > 0
            ? technologies
            : optimizedQuery.apolloParams.organizationTechnologies,
        per_page: 25,
      })

      for (const org of apolloResult.organizations) {
        allLeads.push(apolloOrgToDiscovered(org))
      }

      await logAgent(
        supabase,
        user.id,
        campaign.id,
        'leads_discovered',
        `${apolloResult.organizations.length} Unternehmen via Apollo gefunden`,
      )
    } catch (error) {
      console.error('[Discovery] Apollo search failed:', error)
      const apolloErrMsg = error instanceof Error ? error.message : String(error)
      await logAgent(
        supabase,
        user.id,
        campaign.id,
        'campaign_failed',
        `Apollo-Suche fehlgeschlagen: ${apolloErrMsg}`,
      )
    }
    timer.stop('apollo_search_ms')

    // Step 3: Google Places Search
    timer.start('google_places_ms')
    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'leads_discovered',
      'Suche lokale Unternehmen via Google Places...',
    )
    for (const query of optimizedQuery.googlePlacesQueries) {
      try {
        const result = await textSearch({ query: query.query, region: query.region })
        for (const place of result.places) {
          allLeads.push(placeToDiscovered(place))
        }
      } catch (error) {
        console.error(`[Discovery] Google Places failed for "${query.query}":`, error)
      }
    }
    timer.stop('google_places_ms')

    // Step 4: Deduplicate (by company name + domain, client-side tempIds are unique)
    const dedupedLeads = deduplicateDiscoveredLeads(allLeads)
    const dupsRemoved = allLeads.length - dedupedLeads.length

    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'leads_discovered',
      `${dedupedLeads.length} Leads gefunden${dupsRemoved > 0 ? `, ${dupsRemoved} Duplikate entfernt` : ''} — warte auf Auswahl`,
    )

    // Mark campaign as completed (search phase done; leads saved separately)
    await supabase
      .from('search_campaigns')
      .update({
        status: 'completed',
        leads_found: dedupedLeads.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaign.id)

    timer.stop('total_pipeline_ms')

    return ok({ campaignId: campaign.id, leads: dedupedLeads })
  } catch (error) {
    console.error('[Discovery] Pipeline failed:', error)
    const internalMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await supabase
      .from('search_campaigns')
      .update({ status: 'failed', error_message: internalMessage })
      .eq('id', campaign.id)
    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'campaign_failed',
      `Pipeline fehlgeschlagen: ${internalMessage}`,
    )
    return fail('INTERNAL_ERROR', 'Lead Discovery fehlgeschlagen. Bitte versuchen Sie es erneut.')
  }
}

// ---------------------------------------------------------------------------
// Enrichment trigger (fire-and-forget via internal API call)
// ---------------------------------------------------------------------------

async function triggerEnrichment(campaignId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  await fetch(`${baseUrl}/api/enrichment/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId }),
  })
}

// ---------------------------------------------------------------------------
// ICP prefill for the discovery form
// ---------------------------------------------------------------------------

export interface IcpDefaults {
  industries: string
  companySize: string
  region: string
  technologies: string
  keywords: string
}

export async function getIcpDefaultsAction(): Promise<ApiResponse<IcpDefaults>> {
  const { user, supabase } = await requireAuth()

  const { data } = await supabase
    .from('icp_profiles')
    .select('industries, company_sizes, regions, tech_stack, keywords')
    .eq('user_id', user.id)
    .single()

  return ok({
    industries: data?.industries?.join(', ') ?? 'SaaS, FinTech, E-Commerce',
    companySize: data?.company_sizes?.join(', ') ?? '10-500 Mitarbeiter',
    region: data?.regions?.join(', ') ?? 'DACH (AT, DE, CH)',
    technologies: data?.tech_stack?.join(', ') ?? '',
    keywords: data?.keywords?.join(', ') ?? '',
  })
}

// ---------------------------------------------------------------------------
// Fetch leads discovered by a campaign
// ---------------------------------------------------------------------------

export interface DiscoveryLead {
  id: string
  company_name: string | null
  full_name: string | null
  industry: string | null
  location: string | null
  source: string | null
}

export async function getDiscoveryLeadsAction(
  campaignId: string,
): Promise<ApiResponse<DiscoveryLead[]>> {
  const { user, supabase } = await requireAuth()

  const { data } = await supabase
    .from('leads')
    .select('id, company_name, full_name, industry, location, source')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return ok(data ?? [])
}
