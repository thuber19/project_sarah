import { z } from 'zod/v4'

// Email validation
export const emailSchema = z.string().email('Ungültige E-Mail-Adresse')

// URL validation for website inputs
export const urlSchema = z.string().url('Ungültige URL').or(z.literal(''))

// Full profile schema (onboarding — all fields required, AI-populated)
export const onboardingProfileSchema = z.object({
  website_url: z.string().min(1),
  company_name: z.string().min(1, 'Firmenname ist erforderlich'),
  description: z.string().min(1),
  industry: z.string().min(1),
  product_summary: z.string().min(1),
  value_proposition: z.string().min(1),
  target_market: z.string().min(1),
  raw_scraped_content: z.string(),
})

// Onboarding ICP schema (no tech_stack, no minimums on arrays)
export const onboardingIcpSchema = z.object({
  job_titles: z.array(z.string()),
  seniority_levels: z.array(z.string()),
  industries: z.array(z.string()),
  company_sizes: z.array(z.string()),
  regions: z.array(z.string()),
})

// Profile validation (settings — most fields optional)
export const profileSchema = z.object({
  company_name: z.string().min(1, 'Firmenname ist erforderlich'),
  industry: z.string().optional(),
  description: z.string().optional(),
  target_market: z.string().optional(),
  website_url: urlSchema.optional(),
})

// ICP validation
export const icpSchema = z.object({
  industries: z.array(z.string()).min(1, 'Mindestens eine Branche erforderlich'),
  company_sizes: z.array(z.string()),
  regions: z.array(z.string()).min(1, 'Mindestens eine Region erforderlich'),
  job_titles: z.array(z.string()),
  seniority_levels: z.array(z.string()),
  tech_stack: z.array(z.string()),
})

// Discovery form validation
export const discoveryFormSchema = z.object({
  industries: z.string().min(1, 'Branchen sind erforderlich'),
  companySize: z.string().min(1, 'Unternehmensgröße ist erforderlich'),
  region: z.string().min(1, 'Region ist erforderlich'),
  technologies: z.string().optional(),
  keywords: z.string().optional(),
})

// Settings ICP schema (no minimums — user can clear fields)
export const settingsIcpSchema = z.object({
  industries: z.array(z.string()),
  company_sizes: z.array(z.string()),
  regions: z.array(z.string()),
  job_titles: z.array(z.string()),
  seniority_levels: z.array(z.string()),
  tech_stack: z.array(z.string()),
})

// Aliases for clarity
export const settingsProfileSchema = profileSchema

export type ProfileFormData = z.infer<typeof profileSchema>
export type IcpFormData = z.infer<typeof icpSchema>
export type DiscoveryFormData = z.infer<typeof discoveryFormSchema>
export type OnboardingProfileData = z.infer<typeof onboardingProfileSchema>
export type OnboardingIcpData = z.infer<typeof onboardingIcpSchema>
export type SettingsProfileData = ProfileFormData
export type SettingsIcpData = IcpFormData
