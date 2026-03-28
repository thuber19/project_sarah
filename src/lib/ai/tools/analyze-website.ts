import { tool } from 'ai'
import { z } from 'zod'
import { scrapeWebsite } from '@/lib/scraper'
import { analyzeWebsite as runAnalysis } from '@/lib/ai/analyze-website'

export const analyzeWebsite = tool({
  description:
    'Scraped eine Website und analysiert sie mit AI. Extrahiert Firmendaten, Branche, Produkte und Zielmarkt. Optimiert für DACH-Unternehmen.',
  inputSchema: z.object({
    url: z.string().url().describe('URL der Website (z.B. https://example.at)'),
  }),
  execute: async (params) => {
    try {
      const scraped = await scrapeWebsite(params.url)
      const analysis = await runAnalysis(scraped)

      return {
        success: true as const,
        analysis: {
          companyName: analysis.companyName,
          industry: analysis.industry,
          businessModel: analysis.businessModel,
          productsServices: analysis.productsServices,
          valueProposition: analysis.valueProposition,
          targetCustomers: analysis.targetCustomers,
        },
        scrapedMeta: {
          title: scraped.title,
          metaDescription: scraped.metaDescription,
          headingsCount: scraped.headings.length,
        },
      }
    } catch (error) {
      return {
        success: false as const,
        error: error instanceof Error ? error.message : 'Website-Analyse fehlgeschlagen',
        analysis: null,
        scrapedMeta: null,
      }
    }
  },
})
