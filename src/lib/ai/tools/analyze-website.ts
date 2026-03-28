import { tool } from 'ai'
import { z } from 'zod'
import { scrapeWebsite } from '@/lib/scraper'
import { analyzeWebsite as runAnalysis } from '@/lib/ai/analyze-website'
import { logToolAction, type ToolContext } from './context'

export function createAnalyzeWebsite(ctx: ToolContext) {
  return tool({
    description:
      'Scraped eine Website und analysiert sie mit AI. Extrahiert Firmendaten, Branche, Produkte und Zielmarkt. Optimiert für DACH-Unternehmen.',
    inputSchema: z.object({
      url: z.string().url().describe('URL der Website (z.B. https://example.at)'),
    }),
    execute: async (params) => {
      await logToolAction(ctx, 'website_scraped', `Website-Analyse gestartet: ${params.url}`)

      try {
        const scraped = await scrapeWebsite(params.url)
        await logToolAction(
          ctx,
          'website_scraped',
          `Website gescraped: ${scraped.title ?? params.url}`,
        )

        const analysis = await runAnalysis(scraped)
        await logToolAction(
          ctx,
          'website_analyzed',
          `Website analysiert: ${analysis.companyName} (${analysis.industry})`,
        )

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
        const msg = error instanceof Error ? error.message : 'Website-Analyse fehlgeschlagen'
        await logToolAction(ctx, 'campaign_failed', `Website-Analyse fehlgeschlagen: ${msg}`)
        return { success: false as const, error: msg, analysis: null, scrapedMeta: null }
      }
    },
  })
}
