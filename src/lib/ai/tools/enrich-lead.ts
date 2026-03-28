import { tool } from 'ai'
import { z } from 'zod'
import { enrichPerson } from '@/lib/apollo/client'
import { textSearch } from '@/lib/google-places/client'
import { logToolAction, type ToolContext } from './context'

export function createEnrichLead(ctx: ToolContext) {
  return tool({
    description:
      'Reichert einen Lead mit zusätzlichen Daten an: Apollo.io Enrichment für Kontaktdaten und Google Places für Firmendaten im DACH-Raum.',
    inputSchema: z.object({
      firstName: z.string().optional().describe('Vorname für Apollo Enrichment'),
      lastName: z.string().optional().describe('Nachname für Apollo Enrichment'),
      email: z.string().optional().describe('E-Mail-Adresse für Enrichment'),
      linkedinUrl: z.string().optional().describe('LinkedIn-URL für Enrichment'),
      companyDomain: z.string().optional().describe('Firmen-Domain für Enrichment'),
      companyName: z.string().optional().describe('Firmenname für Google Places Suche'),
      companyCity: z.string().optional().describe('Stadt für genauere Google Places Suche'),
      region: z.enum(['at', 'de', 'ch']).optional().describe('Ländercode für Google Places'),
    }),
    execute: async (params) => {
      await logToolAction(
        ctx,
        'website_scraped',
        `Enrichment gestartet für ${params.companyName ?? params.email ?? 'Lead'}`,
      )

      const results: {
        apollo: Record<string, unknown> | null
        googlePlaces: Record<string, unknown> | null
      } = { apollo: null, googlePlaces: null }

      try {
        if (params.email || params.linkedinUrl || params.firstName) {
          const enrichResult = await enrichPerson({
            first_name: params.firstName,
            last_name: params.lastName,
            email: params.email,
            linkedin_url: params.linkedinUrl,
            domain: params.companyDomain,
          })
          if (enrichResult.person) {
            results.apollo = {
              name: enrichResult.person.name,
              title: enrichResult.person.title,
              email: enrichResult.person.email,
              phone: enrichResult.person.phone_numbers?.[0]?.sanitized_number ?? null,
              linkedinUrl: enrichResult.person.linkedin_url,
              company: enrichResult.person.organization?.name ?? null,
              companyWebsite: enrichResult.person.organization?.website_url ?? null,
              companySize: enrichResult.person.organization?.estimated_num_employees ?? null,
            }
          }
        }

        if (params.companyName) {
          const query = params.companyCity
            ? `${params.companyName} ${params.companyCity}`
            : params.companyName
          const placesResult = await textSearch({ query, region: params.region ?? 'at' })
          if (placesResult.places && placesResult.places.length > 0) {
            const place = placesResult.places[0]
            results.googlePlaces = {
              name: place.displayName,
              address: place.formattedAddress,
              rating: place.rating,
              totalRatings: place.userRatingCount,
              website: place.websiteUri,
              phone: place.internationalPhoneNumber,
            }
          }
        }

        const sources = [
          results.apollo && 'Apollo',
          results.googlePlaces && 'Google Places',
        ].filter(Boolean)
        await logToolAction(
          ctx,
          'website_analyzed',
          `Enrichment abgeschlossen via ${sources.join(' + ') || 'keine Daten'}`,
        )

        return { success: true as const, ...results }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Enrichment fehlgeschlagen'
        await logToolAction(ctx, 'campaign_failed', `Enrichment fehlgeschlagen: ${msg}`)
        return { success: false as const, error: msg, ...results }
      }
    },
  })
}
