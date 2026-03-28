import { z } from 'zod'

export const websiteUrlSchema = z.object({
  url: z
    .string()
    .min(1, 'Bitte gib eine URL ein')
    .url('Bitte gib eine gültige URL ein (z. B. https://dein-unternehmen.at)'),
})

export const icpStep3Schema = z.object({
  industries: z
    .array(z.string())
    .min(1, 'Bitte wähle mindestens eine Branche aus'),
  companySize: z.string().min(1, 'Bitte wähle eine Unternehmensgröße aus'),
  regions: z
    .record(z.string(), z.boolean())
    .refine((r) => Object.values(r).some(Boolean), {
      message: 'Bitte wähle mindestens eine Region aus',
    }),
  scoreThreshold: z.number().min(0).max(100),
})

export type WebsiteUrlInput = z.infer<typeof websiteUrlSchema>
export type IcpStep3Input = z.infer<typeof icpStep3Schema>
