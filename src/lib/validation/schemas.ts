import { z } from 'zod/v4'

// Email validation
export const emailSchema = z.string().email('Ungültige E-Mail-Adresse')

// URL validation for website inputs
export const urlSchema = z.string().url('Ungültige URL').or(z.literal(''))

// Profile validation (reusable for settings + onboarding)
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

export type ProfileFormData = z.infer<typeof profileSchema>
export type IcpFormData = z.infer<typeof icpSchema>
export type DiscoveryFormData = z.infer<typeof discoveryFormSchema>
