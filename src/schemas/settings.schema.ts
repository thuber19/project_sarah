import { z } from 'zod/v4'

export const profileSchema = z.object({
  company_name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  industry: z.string().optional(),
  description: z.string().optional(),
  target_market: z.string().optional(),
  website_url: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      'Bitte gib eine gültige URL ein (z.B. https://dein-unternehmen.at)',
    ),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const icpSettingsSchema = z.object({
  industries: z.string().optional(),
  company_sizes: z.string().optional(),
  regions: z.string().optional(),
  job_titles: z.string().optional(),
  seniority_levels: z.string().optional(),
  tech_stack: z.string().optional(),
})

export type IcpSettingsFormData = z.infer<typeof icpSettingsSchema>
