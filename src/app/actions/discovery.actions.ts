'use server'

import { createClient, requireAuth } from '@/lib/supabase/server'
import { searchOrganizations } from '@/lib/apollo/client'
import { textSearch } from '@/lib/google-places/client'
import { optimizeSearchQuery } from '@/lib/ai/optimize-query'
import type { ApolloOrganization } from '@/lib/apollo/types'
import type { Database } from '@/types/database'
import type { ApiResponse } from '@/lib/api-response'
import { ok, fail } from '@/lib/api-response'
import { PipelineTimer } from '@/lib/pipeline/timer'

type LeadInsert = Database['public']['Tables']['leads']['Insert']
type AgentLogInsert = Database['public']['Tables']['agent_logs']['Insert']

interface DiscoveryFormData {
  industries: string
  companySize: string
  region: string
  technologies?: string
  keywords?: string
}

interface DiscoveryResult {
  campaignId: string
  leadsFound: number
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

function apolloOrgToLead(org: ApolloOrganization, userId: string, campaignId: string): LeadInsert {
  return {
    user_id: userId,
    campaign_id: campaignId,
    first_name: null,
    last_name: null,
    full_name: null,
    email: null,
    linkedin_url: org.linkedin_url ?? null,
    job_title: null,
    seniority: null,
    company_name: org.name ?? null,
    company_domain: org.website_url ?? null,
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

export async function startDiscoveryAction(
  formData: DiscoveryFormData,
): Promise<ApiResponse<DiscoveryResult>> {
  const { user, supabase } = await requireAuth()

  // Fetch business profile + ICP
  const { data: profile } = await supabase
    .from('business_profiles')
    .select(
      'id, user_id, website_url, company_name, description, industry, product_summary, value_proposition, target_market, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .single()

  const { data: icpData } = await supabase
    .from('icp_profiles')
    .select(
      'id, user_id, business_profile_id, industries, company_sizes, regions, job_titles, seniority_levels, tech_stack, revenue_ranges, funding_stages, keywords, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .single()

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

    const allLeads: LeadInsert[] = []

    // Step 2: Apollo Organization Search (free plan compatible)
    // mixed_people/search requires a paid plan — mixed_companies/search is available on free
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
        allLeads.push(apolloOrgToLead(org, user.id, campaign.id))
      }

      await logAgent(
        supabase,
        user.id,
        campaign.id,
        'leads_discovered',
        `${apolloResult.organizations.length} Unternehmen via Apollo gefunden`,
      )
    } catch (error) {
      const apolloErrMsg = error instanceof Error ? error.message : String(error)
      console.error('[Discovery] Apollo search failed:', apolloErrMsg)
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
          allLeads.push({
            user_id: user.id,
            campaign_id: campaign.id,
            company_name: place.displayName,
            company_domain: place.websiteUri,
            company_website: place.websiteUri,
            location: place.formattedAddress,
            source: 'google_places',
            raw_data: {
              place_id: place.id,
              rating: place.rating,
              phone: place.nationalPhoneNumber,
            },
          })
        }
      } catch (error) {
        console.error(`[Discovery] Google Places failed for "${query.query}":`, error)
      }
    }
    timer.stop('google_places_ms')

    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'leads_discovered',
      `${allLeads.length} Leads insgesamt gefunden`,
    )

    // Step 4: Save leads
    if (allLeads.length > 0) {
      const { error: insertError } = await supabase.from('leads').insert(allLeads)
      if (insertError) {
        console.error('[Discovery] Failed to save leads:', insertError)
        throw new Error('Leads konnten nicht gespeichert werden')
      }
    }

    // Step 5: Update campaign
    await supabase
      .from('search_campaigns')
      .update({
        status: 'completed',
        leads_found: allLeads.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaign.id)

    timer.stop('total_pipeline_ms')

    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'campaign_completed',
      `Fertig! ${allLeads.length} Leads gefunden.`,
      { leads_found: allLeads.length, pipeline_timing: timer.getMetrics() },
    )

    return ok({ campaignId: campaign.id, leadsFound: allLeads.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await supabase
      .from('search_campaigns')
      .update({ status: 'failed', error_message: message })
      .eq('id', campaign.id)
    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'campaign_failed',
      `Pipeline fehlgeschlagen: ${message}`,
    )
    return fail('INTERNAL_ERROR', message)
  }
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
