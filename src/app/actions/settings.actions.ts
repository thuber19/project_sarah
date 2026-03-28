'use server'

import { requireAuth } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/api-response'
import { ok, fail } from '@/lib/api-response'
import type { BusinessProfile, IcpProfile } from '@/types/database'
import {
  profileSchema,
  settingsIcpSchema,
  type SettingsProfileData,
  type SettingsIcpData,
} from '@/lib/validation/schemas'

// Types re-exported from @/lib/validation/schemas — import directly from there in client code

interface SettingsData {
  profile: BusinessProfile | null
  icp: IcpProfile | null
  email: string
}

export async function loadSettingsData(): Promise<ApiResponse<SettingsData>> {
  const { user, supabase } = await requireAuth()

  const [profileResult, icpResult] = await Promise.all([
    supabase.from('business_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('icp_profiles').select('*').eq('user_id', user.id).single(),
  ])

  return ok({
    profile: profileResult.data,
    icp: icpResult.data,
    email: user.email ?? '',
  })
}

export async function updateProfileAction(data: SettingsProfileData): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Ungültige Profildaten')

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

  if (error) return fail('INTERNAL_ERROR', 'Profil konnte nicht gespeichert werden')
  return ok(null)
}

export async function updateIcpAction(data: SettingsIcpData): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const parsed = settingsIcpSchema.safeParse(data)
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Ungültige ICP-Daten')

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

  if (error) return fail('INTERNAL_ERROR', 'ICP konnte nicht gespeichert werden')
  return ok(null)
}
