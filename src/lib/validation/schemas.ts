import { z } from 'zod/v4'

// Email validation
export const emailSchema = z.string().email('Ungültige E-Mail-Adresse')

// URL validation for website inputs
export const urlSchema = z.string().url('Ungültige URL').or(z.literal(''))

// Full profile schema (onboarding — all fields required, AI-populated)
export const onboardingProfileSchema = z.object({
  website_url: z.string().min(1, 'Website-URL ist erforderlich'),
  company_name: z.string().min(1, 'Firmenname ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  industry: z.string().min(1, 'Branche ist erforderlich'),
  product_summary: z.string().min(1, 'Produktübersicht ist erforderlich'),
  value_proposition: z.string().min(1, 'Nutzenversprechen ist erforderlich'),
  target_market: z.string().min(1, 'Zielmarkt ist erforderlich'),
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
  additional_info: z.string().optional(),
})

// Communication style schema (settings — all fields optional)
export const communicationStyleSchema = z.object({
  email_example: z.string().optional().default(''),
  email_signature: z.string().optional().default(''),
  writing_style: z.string().optional().default(''),
  salutation_preference: z.enum(['du', 'sie']).optional().default('sie'),
  voice_example: z.string().optional().default(''),
  speaking_style: z.string().optional().default(''),
  opening_phrase: z.string().optional().default(''),
  call_to_action: z.string().optional().default(''),
  additional_notes: z.string().optional().default(''),
})

// Aliases for clarity
export const settingsProfileSchema = profileSchema

export type ProfileFormData = z.infer<typeof profileSchema>
export type DiscoveryFormData = z.infer<typeof discoveryFormSchema>
export type OnboardingProfileData = z.infer<typeof onboardingProfileSchema>
export type OnboardingIcpData = z.infer<typeof onboardingIcpSchema>
export type SettingsProfileData = ProfileFormData
export type SettingsIcpData = z.infer<typeof settingsIcpSchema>
/** Input type — fields are optional (before Zod defaults are applied). */
export type CommunicationStyleData = z.input<typeof communicationStyleSchema>
