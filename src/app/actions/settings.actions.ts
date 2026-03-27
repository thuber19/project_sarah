'use server'

import { requireAuth } from '@/lib/supabase/server'
import { z } from 'zod/v4'

const profileSchema = z.object({
  company_name: z.string().min(1, 'Firmenname ist erforderlich'),
  industry: z.string().optional(),
  description: z.string().optional(),
  target_market: z.string().optional(),
  website_url: z.string().optional(),
})

const icpSchema = z.object({
  industries: z.array(z.string()),
  company_sizes: z.array(z.string()),
  regions: z.array(z.string()),
  job_titles: z.array(z.string()),
  seniority_levels: z.array(z.string()),
  tech_stack: z.array(z.string()),
})

export type SettingsProfileData = z.infer<typeof profileSchema>
export type SettingsIcpData = z.infer<typeof icpSchema>

export async function loadSettingsData() {
  const { user, supabase } = await requireAuth()

  const [profileResult, icpResult] = await Promise.all([
    supabase.from('business_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('icp_profiles').select('*').eq('user_id', user.id).single(),
  ])

  return {
    profile: profileResult.data,
    icp: icpResult.data,
    email: user.email ?? '',
  }
}

export async function updateProfileAction(data: SettingsProfileData): Promise<{ error?: string }> {
  const { user, supabase } = await requireAuth()

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Profildaten' }

  const { error } = await supabase
    .from('business_profiles')
    .update({
      company_name: parsed.data.company_name,
      industry: parsed.data.industry ?? null,
      description: parsed.data.description ?? null,
      target_market: parsed.data.target_market ?? null,
      website_url: parsed.data.website_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: 'Profil konnte nicht gespeichert werden' }
  return {}
}

export async function updateIcpAction(data: SettingsIcpData): Promise<{ error?: string }> {
  const { user, supabase } = await requireAuth()

  const parsed = icpSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige ICP-Daten' }

  const { error } = await supabase
    .from('icp_profiles')
    .update({
      industries: parsed.data.industries,
      company_sizes: parsed.data.company_sizes,
      regions: parsed.data.regions,
      job_titles: parsed.data.job_titles,
      seniority_levels: parsed.data.seniority_levels,
      tech_stack: parsed.data.tech_stack,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) return { error: 'ICP konnte nicht gespeichert werden' }
  return {}
}
