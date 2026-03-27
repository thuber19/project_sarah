'use server'

import { requireAuth } from '@/lib/supabase/server'
import { scrapeWebsite } from '@/lib/scraper'
import { analyzeWebsite } from '@/lib/ai/analyze-website'
import { redirect } from 'next/navigation'
import { z } from 'zod/v4'

const urlSchema = z.string().url('Bitte eine gültige URL eingeben')

const profileSchema = z.object({
  website_url: z.string().min(1),
  company_name: z.string().min(1, 'Firmenname ist erforderlich'),
  description: z.string().min(1),
  industry: z.string().min(1),
  product_summary: z.string().min(1),
  value_proposition: z.string().min(1),
  target_market: z.string().min(1),
  raw_scraped_content: z.string(),
})

const icpSchema = z.object({
  job_titles: z.array(z.string()),
  seniority_levels: z.array(z.string()),
  industries: z.array(z.string()),
  company_sizes: z.array(z.string()),
  regions: z.array(z.string()),
})

export type ProfileData = z.infer<typeof profileSchema>
export type IcpData = z.infer<typeof icpSchema>

type AnalyzeResult =
  | { profile: ProfileData; icp: IcpData }
  | { error: string }

export async function analyzeWebsiteAction(rawUrl: string): Promise<AnalyzeResult> {
  const { user } = await requireAuth()

  const parsed = urlSchema.safeParse(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültige URL' }

  const websiteUrl = parsed.data

  try {
    const scraped = await scrapeWebsite(websiteUrl)
    const analysis = await analyzeWebsite(scraped)

    const rawContent = [scraped.title, scraped.metaDescription, scraped.bodyText].filter(Boolean).join('\n\n')

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

    return { profile, icp }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function saveOnboardingAction(
  profile: ProfileData,
  icp: IcpData,
): Promise<{ error: string } | never> {
  const { user, supabase } = await requireAuth()

  const profileValidation = profileSchema.safeParse(profile)
  if (!profileValidation.success) return { error: 'Ungültige Profildaten' }

  const icpValidation = icpSchema.safeParse(icp)
  if (!icpValidation.success) return { error: 'Ungültige ICP-Daten' }

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
    return { error: 'Fehler beim Speichern des Profils' }
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
    return { error: 'Fehler beim Speichern des ICP' }
  }

  redirect('/dashboard')
}
