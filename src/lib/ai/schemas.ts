import { z } from 'zod/v4'

export const websiteAnalysisSchema = z.object({
  companyName: z.string().describe('Name des Unternehmens'),
  industry: z.string().describe('Branche (z.B. SaaS, E-Commerce, Beratung)'),
  businessModel: z
    .enum(['B2B', 'B2C', 'B2B2C', 'Marketplace'])
    .describe('Geschäftsmodell des Unternehmens'),
  productsServices: z
    .array(z.string())
    .describe('Kurze Liste der Kernprodukte/Services (max 3-5 Stichworte)'),
  companyDescription: z
    .string()
    .describe(
      'Vollständige Unternehmensbeschreibung in Fließtext (2-3 Sätze, für Outreach-Kontext verwendbar). NICHT die gleichen Inhalte wie productsServices oder valueProposition.',
    ),
  teamSize: z.string().optional().describe('Ungefähre Teamgröße, falls erkennbar'),
  tonality: z
    .enum(['Professional', 'Casual', 'Technical', 'Playful'])
    .describe('Ton und Sprache der Website'),
  valueProposition: z
    .string()
    .describe(
      'Einzigartiger Kundennutzen — warum kaufen Kunden hier und nicht woanders? (1-2 differenzierende Sätze)',
    ),
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
  // Contact extraction from Impressum / Team page (DACH Impressumspflicht)
  contactPerson: z
    .object({
      name: z.string().optional().describe('Vollständiger Name (z.B. "Max Mustermann")'),
      jobTitle: z
        .string()
        .optional()
        .describe('Position/Titel (z.B. "Geschäftsführer", "CEO", "Inhaber")'),
      email: z.string().optional().describe('E-Mail-Adresse, falls erkennbar'),
      phone: z.string().optional().describe('Telefonnummer, falls erkennbar'),
    })
    .optional()
    .describe('Ansprechpartner/Geschäftsführer aus Impressum oder Team-Seite, falls erkennbar'),
  // Company data enrichment from website content
  estimatedCompanySize: z
    .string()
    .optional()
    .describe('Geschätzte Unternehmensgröße aus: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000'),
  registryInfo: z
    .string()
    .optional()
    .describe('Handelsregister-/Firmenbuch-Nummer aus Impressum (z.B. "FN 123456a", "HRB 12345")'),
  detectedTechnologies: z
    .array(z.string())
    .optional()
    .describe('Erkannte Technologien aus Website-Inhalt, Meta-Tags oder Script-Tags'),
})

export type WebsiteAnalysis = z.infer<typeof websiteAnalysisSchema>
