import { z } from 'zod/v4'

export const onboardingStep1Schema = z.object({
  url: z
    .string()
    .min(1, 'Website-URL ist erforderlich')
    .url('Bitte gib eine gültige URL ein (z.B. https://dein-unternehmen.at)'),
})

export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>

export const icpSchema = z.object({
  industries: z.array(z.string()).min(1, 'Bitte wähle mindestens eine Branche aus'),
  companySize: z.string().min(1, 'Bitte wähle eine Unternehmensgröße aus'),
  regions: z
    .record(z.string(), z.boolean())
    .refine((r) => Object.values(r).some(Boolean), 'Bitte wähle mindestens eine Region aus'),
})

export type IcpFormData = z.infer<typeof icpSchema>
