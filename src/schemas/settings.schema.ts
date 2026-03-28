import { z } from 'zod'

export const profileSchema = z.object({
  company_name: z.string().min(1, 'Unternehmensname ist erforderlich'),
  industry: z.string().optional(),
  description: z.string().optional(),
  target_market: z.string().optional(),
  website_url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('Bitte gib eine gültige URL ein (z. B. https://dein-unternehmen.at)').optional(),
  ),
})

export const icpSettingsSchema = z.object({
  industries: z.array(z.string()),
  company_sizes: z.array(z.string()),
  regions: z.array(z.string()),
  job_titles: z.array(z.string()),
  seniority_levels: z.array(z.string()),
  tech_stack: z.array(z.string()),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type IcpSettingsInput = z.infer<typeof icpSettingsSchema>
