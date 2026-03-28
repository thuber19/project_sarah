import { z } from 'zod/v4'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-Mail-Adresse ist erforderlich')
    .email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

export type LoginFormData = z.infer<typeof loginSchema>
