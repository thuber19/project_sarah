'use server'

import { requireAuth } from '@/lib/supabase/server'
import { scrapeWebsite } from '@/lib/scraper'
import { analyzeWebsite } from '@/lib/ai/analyze-website'
import { logAgentAction } from '@/lib/agent-log'
import { redirect } from 'next/navigation'
import type { ApiResponse } from '@/lib/api-response'
import { ok, fail } from '@/lib/api-response'
import { z } from 'zod/v4'
import {
  onboardingProfileSchema,
  onboardingIcpSchema,
  type OnboardingProfileData,
  type OnboardingIcpData,
} from '@/lib/validation/schemas'

const urlSchema = z.string().url('Bitte eine gültige URL eingeben')
const profileSchema = onboardingProfileSchema
const icpSchema = onboardingIcpSchema

export type ProfileData = OnboardingProfileData
export type IcpData = OnboardingIcpData

interface AnalyzeData {
  profile: ProfileData
  icp: IcpData
}

export async function analyzeWebsiteAction(rawUrl: string): Promise<ApiResponse<AnalyzeData>> {
  await requireAuth()

  const parsed = urlSchema.safeParse(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
  if (!parsed.success)
    return fail('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Ungültige URL')

  const websiteUrl = parsed.data

  try {
    const scraped = await scrapeWebsite(websiteUrl)
    const analysis = await analyzeWebsite(scraped)

    const rawContent = [scraped.title, scraped.metaDescription, scraped.bodyText]
      .filter(Boolean)
      .join('\n\n')

    const profile: ProfileData = {
      website_url: websiteUrl,
      company_name: analysis.companyName,
      description: analysis.productsServices.join(', '),
      industry: analysis.industry,
      product_summary: analysis.productsServices.join('; '),
      value_proposition: analysis.valueProposition,
      target_market: `${analysis.targetCustomers.companySize} in ${analysis.targetCustomers.industries.join(', ')}`,
      raw_scraped_content: rawContent,
    }

    const icp: IcpData = {
      job_titles: analysis.suggestedJobTitles,
      seniority_levels: analysis.suggestedSeniorityLevels,
      industries: analysis.targetCustomers.industries,
      company_sizes: analysis.suggestedCompanySizes,
      regions: analysis.suggestedRegions,
    }

    return ok({ profile, icp })
  } catch (err) {
    return fail('INTERNAL_ERROR', (err as Error).message)
  }
}

export async function saveOnboardingAction(
  profile: ProfileData,
  icp: IcpData,
): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const profileValidation = profileSchema.safeParse(profile)
  if (!profileValidation.success) return fail('VALIDATION_ERROR', 'Ungültige Profildaten')

  const icpValidation = icpSchema.safeParse(icp)
  if (!icpValidation.success) return fail('VALIDATION_ERROR', 'Ungültige ICP-Daten')

  const { data: businessProfile, error: profileError } = await supabase
    .from('business_profiles')
    .upsert(
      {
        user_id: user.id,
        website_url: profileValidation.data.website_url,
        company_name: profileValidation.data.company_name,
        description: profileValidation.data.description,
        industry: profileValidation.data.industry,
        product_summary: profileValidation.data.product_summary,
        value_proposition: profileValidation.data.value_proposition,
        target_market: profileValidation.data.target_market,
        raw_scraped_content: profileValidation.data.raw_scraped_content,
      },
      { onConflict: 'user_id' },
    )
    .select('id')
    .single()

  if (profileError || !businessProfile) {
    console.error('saveOnboardingAction: business_profiles upsert failed', profileError)
    return fail('INTERNAL_ERROR', 'Fehler beim Speichern des Profils')
  }

  const { error: icpError } = await supabase.from('icp_profiles').upsert(
    {
      user_id: user.id,
      business_profile_id: businessProfile.id,
      job_titles: icpValidation.data.job_titles,
      seniority_levels: icpValidation.data.seniority_levels,
      industries: icpValidation.data.industries,
      company_sizes: icpValidation.data.company_sizes,
      regions: icpValidation.data.regions,
    },
    { onConflict: 'user_id' },
  )

  if (icpError) {
    console.error('saveOnboardingAction: icp_profiles upsert failed', icpError)
    return fail('INTERNAL_ERROR', 'Fehler beim Speichern des ICP')
  }

  redirect('/dashboard')
}

export async function trackOnboardingEventAction(
  step: number,
  event: 'started' | 'completed',
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const { user, supabase } = await requireAuth()
    const actionType = event === 'started' ? 'onboarding_started' : 'onboarding_completed'
    await logAgentAction(
      { supabase, userId: user.id },
      actionType,
      `Onboarding Schritt ${step} ${event === 'started' ? 'gestartet' : 'abgeschlossen'}`,
      { step, ...metadata },
    )
  } catch {
    // Non-critical — don't break onboarding if tracking fails
    console.error('[Onboarding] Tracking failed')
  }
}
