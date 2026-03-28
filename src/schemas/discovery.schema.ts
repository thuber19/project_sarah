import { z } from 'zod'

export const discoverySearchSchema = z.object({
  branchen: z.string().min(1, 'Bitte gib mindestens eine Branche an'),
  unternehmensgroesse: z.string().min(1, 'Bitte gib eine Unternehmensgröße an'),
  region: z.string().min(1, 'Bitte gib eine Region an'),
  technologien: z.string().optional(),
  keywords: z.string().optional(),
})

export type DiscoverySearchInput = z.infer<typeof discoverySearchSchema>
