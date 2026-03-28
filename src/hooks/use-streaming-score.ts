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

/** All schema field keys for progress tracking. */
const ALL_FIELDS = Object.keys(streamingScoringSchema.shape) as (keyof StreamingScoringData)[]

/** Fields that must be present for scoring to be considered complete. */
const REQUIRED_FIELDS: (keyof StreamingScoringData)[] = [
  'reasoning',
  'recommendation',
  'recommendation_text',
  'company_fit_analysis',
  'contact_fit_analysis',
  'buying_signals_analysis',
  'timing_analysis',
]

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null
}

export function useStreamingScore() {
  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/scoring/stream',
    schema: streamingScoringSchema,
  })

  const data = object as StreamingScoringData | undefined

  const isComplete = REQUIRED_FIELDS.every((field) => hasValue(data?.[field]))

  const progress = data
    ? Math.round(
        (ALL_FIELDS.filter((field) => hasValue(data[field])).length / ALL_FIELDS.length) * 100,
      )
    : 0

  function scoreLeadStream(leadId: string) {
    submit({ leadId })
  }

  function reset() {
    submit(undefined)
  }

  return {
    data,
    isLoading,
    isComplete,
    progress,
    error,
    scoreLeadStream,
    stop,
    reset,
  }
}
