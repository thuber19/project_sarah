import { z } from 'zod/v4'

export const discoverySchema = z.object({
  industry: z.string().min(1, 'Bitte gib eine Branche ein'),
  location: z.string().optional(),
  companySize: z.string().optional(),
  keywords: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
})

export type DiscoveryFormData = z.infer<typeof discoverySchema>
