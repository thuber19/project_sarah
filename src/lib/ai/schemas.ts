import { z } from 'zod/v4'

export const websiteAnalysisSchema = z.object({
  companyName: z.string().describe('Name des Unternehmens'),
  industry: z.string().describe('Branche (z.B. SaaS, E-Commerce, Beratung)'),
  businessModel: z
    .enum(['B2B', 'B2C', 'B2B2C', 'Marketplace'])
    .describe('Geschäftsmodell des Unternehmens'),
  productsServices: z.array(z.string()).describe('Liste der Produkte und Dienstleistungen'),
  teamSize: z.string().optional().describe('Ungefähre Teamgröße, falls erkennbar'),
  tonality: z
    .enum(['Professional', 'Casual', 'Technical', 'Playful'])
    .describe('Ton und Sprache der Website'),
  valueProposition: z.string().describe('Hauptnutzen für Kunden (1 Satz)'),
  targetCustomers: z.object({
    industries: z.array(z.string()).describe('Zielbranchen (3-5 Stück)'),
    companySize: z.string().describe('Zielunternehmensgröße (z.B. KMU, Enterprise)'),
    painPoints: z.array(z.string()).describe('Hauptprobleme der Zielkunden (3-5 Stück)'),
  }),
  // Extended fields for ICP generation
  suggestedJobTitles: z.array(z.string()).describe('Typische Job-Titel der Zielkunden (3-6 Stück)'),
  suggestedSeniorityLevels: z
    .array(z.string())
    .describe('Seniority-Level: owner, founder, cxo, vp, director, manager'),
  suggestedCompanySizes: z
    .array(z.string())
    .describe('Unternehmensgrößen aus: 1-10, 11-50, 51-200, 201-500, 501-1000'),
  suggestedRegions: z
    .array(z.string())
    .describe('Zielregionen (z.B. DACH, Deutschland, Österreich)'),
})

export type WebsiteAnalysis = z.infer<typeof websiteAnalysisSchema>
