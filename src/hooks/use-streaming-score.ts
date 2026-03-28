'use client'

import { experimental_useObject as useObject } from '@ai-sdk/react'
import { z } from 'zod/v4'

/**
 * Client-side schema for streaming scoring — all fields optional since
 * they arrive incrementally during the stream.
 */
const streamingScoringSchema = z.object({
  company_fit_analysis: z.string().optional(),
  contact_fit_analysis: z.string().optional(),
  buying_signals_analysis: z.string().optional(),
  timing_analysis: z.string().optional(),
  reasoning: z.string().optional(),
  recommendation: z.enum(['sofort_kontaktieren', 'nurture', 'beobachten', 'skip']).optional(),
  recommendation_text: z.string().optional(),
  confidence: z.number().optional(),
  dach_notes: z.string().optional(),
  key_insights: z.array(z.string()).optional(),
})

export type StreamingScoringData = z.infer<typeof streamingScoringSchema>

export function useStreamingScore() {
  const { object, submit, isLoading, error } = useObject({
    api: '/api/scoring/stream',
    schema: streamingScoringSchema,
  })

  function scoreLeadStream(leadId: string) {
    submit({ leadId })
  }

  return {
    data: object as StreamingScoringData | undefined,
    isLoading,
    error,
    scoreLeadStream,
  }
}
