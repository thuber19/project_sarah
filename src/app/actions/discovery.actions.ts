'use server'

import { createClient } from '@/lib/supabase/server'
import { searchPeople, enrichPerson } from '@/lib/apollo/client'
import { textSearch } from '@/lib/google-places/client'
import { optimizeSearchQuery } from '@/lib/ai/optimize-query'
import type { ApolloPerson } from '@/lib/apollo/types'
import type { Database } from '@/types/database'

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

function apolloPersonToLead(person: ApolloPerson, userId: string, campaignId: string): LeadInsert {
  const org = person.organization
  return {
    user_id: userId,
    campaign_id: campaignId,
    first_name: person.first_name,
    last_name: person.last_name,
    full_name: [person.first_name, person.last_name].filter(Boolean).join(' ') || null,
    email: person.email,
    linkedin_url: person.linkedin_url,
    job_title: person.title,
    seniority: person.seniority,
    company_name: org?.name ?? null,
    company_domain: org?.website_url ?? null,
    industry: org?.industry ?? null,
    company_size: org?.estimated_num_employees ? categorizeSize(org.estimated_num_employees) : null,
    country: org?.country ?? null,
    location: org?.city ? `${org.city}, ${org.country ?? ''}`.trim() : null,
    source: 'apollo',
    apollo_id: person.id,
    raw_data: {
      twitter_url: org?.twitter_url,
      technologies: org?.technologies,
      total_funding: org?.total_funding_printed,
      latest_funding_round: org?.latest_funding_round_type,
      founded_year: org?.founded_year,
      phone_numbers: person.phone_numbers?.map((p) => ({ ...p })),
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
): Promise<DiscoveryResult | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Nicht eingeloggt' }

  // Fetch business profile + ICP
  const { data: profile } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: icpData } = await supabase
    .from('icp_profiles')
    .select('*')
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
    return { error: 'Campaign konnte nicht erstellt werden' }
  }

  try {
    await logAgent(supabase, user.id, campaign.id, 'campaign_started', 'Lead Discovery gestartet')

    // Step 1: Optimize search queries with AI
    await logAgent(supabase, user.id, campaign.id, 'query_optimized', 'Optimiere Suchparameter mit AI...')

    const industries = formData.industries.split(',').map((s) => s.trim()).filter(Boolean)
    const regions = formData.region.split(',').map((s) => s.trim()).filter(Boolean)
    const technologies = formData.technologies?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
    const keywords = formData.keywords?.split(',').map((s) => s.trim()).filter(Boolean) ?? []

    const optimizedQuery = await optimizeSearchQuery(
      {
        company_name: profile?.company_name ?? '',
        industry: profile?.industry ?? '',
        description: profile?.description ?? '',
        services: [],
        target_market: profile?.target_market ?? 'DACH',
        website_url: profile?.website_url ?? '',
      },
      {
        target_industries: icpData?.industries ?? industries,
        target_company_sizes: icpData?.company_sizes ?? [formData.companySize],
        target_countries: icpData?.regions ?? regions,
        target_seniorities: icpData?.seniority_levels ?? [],
        target_titles: icpData?.job_titles ?? [],
        additional_criteria: keywords.length > 0 ? keywords.join(', ') : undefined,
      },
    )

    await logAgent(supabase, user.id, campaign.id, 'query_optimized', `Suchstrategie: ${optimizedQuery.reasoning}`)

    const allLeads: LeadInsert[] = []

    // Step 2: Apollo People Search
    await logAgent(supabase, user.id, campaign.id, 'leads_discovered', 'Suche Leads via Apollo.io...')
    try {
      const apolloResult = await searchPeople({
        person_titles: optimizedQuery.apolloParams.personTitles,
        person_seniorities: optimizedQuery.apolloParams.personSeniorities,
        organization_sizes: optimizedQuery.apolloParams.organizationSizes,
        organization_industry_tag_ids: optimizedQuery.apolloParams.organizationIndustries,
        organization_locations: optimizedQuery.apolloParams.organizationLocations,
        organization_keywords: [...optimizedQuery.apolloParams.organizationKeywords, ...keywords],
        organization_technologies: technologies.length > 0 ? technologies : optimizedQuery.apolloParams.organizationTechnologies,
        per_page: 25,
      })

      // Enrich top results without email
      const toEnrich = apolloResult.people.filter((p) => !p.email && p.first_name).slice(0, 10)
      const enrichedMap = new Map<string, ApolloPerson>()

      for (const person of toEnrich) {
        try {
          const result = await enrichPerson({
            first_name: person.first_name ?? undefined,
            last_name: person.last_name ?? undefined,
            domain: person.organization?.website_url ?? undefined,
            linkedin_url: person.linkedin_url ?? undefined,
          })
          if (result.person) enrichedMap.set(person.id, result.person)
        } catch {
          // skip failed enrichments
        }
      }

      for (const person of apolloResult.people) {
        const enriched = enrichedMap.get(person.id) ?? person
        allLeads.push(apolloPersonToLead(enriched, user.id, campaign.id))
      }

      await logAgent(supabase, user.id, campaign.id, 'leads_discovered', `${apolloResult.people.length} Leads via Apollo gefunden`)
    } catch (error) {
      console.error('[Discovery] Apollo search failed:', error)
      await logAgent(supabase, user.id, campaign.id, 'campaign_failed', 'Apollo-Suche fehlgeschlagen, fahre mit Google Places fort')
    }

    // Step 3: Google Places Search
    await logAgent(supabase, user.id, campaign.id, 'leads_discovered', 'Suche lokale Unternehmen via Google Places...')
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

    await logAgent(supabase, user.id, campaign.id, 'leads_discovered', `${allLeads.length} Leads insgesamt gefunden`)

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

    await logAgent(
      supabase,
      user.id,
      campaign.id,
      'campaign_completed',
      `Fertig! ${allLeads.length} Leads gefunden.`,
      { leads_found: allLeads.length },
    )

    return { campaignId: campaign.id, leadsFound: allLeads.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await supabase
      .from('search_campaigns')
      .update({ status: 'failed', error_message: message })
      .eq('id', campaign.id)
    await logAgent(supabase, user.id, campaign.id, 'campaign_failed', `Pipeline fehlgeschlagen: ${message}`)
    return { error: message }
  }
}
