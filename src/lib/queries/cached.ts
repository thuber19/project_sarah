import { cache } from 'react'
import { requireAuth } from '@/lib/supabase/server'

/**
 * Cached business profile lookup — deduplicated within a single server render pass.
 * Safe to call from layout + page without triggering duplicate DB queries.
 */
export const getBusinessProfile = cache(async () => {
  const { user, supabase } = await requireAuth()
  const { data } = await supabase
    .from('business_profiles')
    .select(
      'id, user_id, website_url, company_name, description, industry, product_summary, value_proposition, target_market',
    )
    .eq('user_id', user.id)
    .maybeSingle()
  return data
})

/**
 * Cached ICP profile lookup — deduplicated within a single server render pass.
 */
export const getIcpProfile = cache(async () => {
  const { user, supabase } = await requireAuth()
  const { data } = await supabase
    .from('icp_profiles')
    .select(
      'id, user_id, business_profile_id, job_titles, seniority_levels, industries, company_sizes, regions, tech_stack',
    )
    .eq('user_id', user.id)
    .maybeSingle()
  return data
})
