'use client'

import { useState, useCallback } from 'react'
import type { ScoreBreakdown } from '@/types/lead'

interface StreamingScoreUpdate {
  company_fit?: number
  contact_fit?: number
  buying_signals?: number
  timing?: number
  reasoning?: string
  recommendation?: string
  recommendation_text?: string
}

interface UseStreamingScoreOptions {
  onUpdate?: (update: StreamingScoreUpdate) => void
  onComplete?: (final: StreamingScoreUpdate) => void
  onError?: (error: Error) => void
}

export function useStreamingScore(options: UseStreamingScoreOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [partialResult, setPartialResult] = useState<StreamingScoreUpdate>({})

  const scoreWithStream = useCallback(
    async (lead: any, breakdown: ScoreBreakdown, totalScore: number) => {
      setIsLoading(true)
      setError(null)
      setPartialResult({})

      try {
        const response = await fetch('/api/scoring/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead,
            breakdown,
            totalScore,
          }),
        })

        if (!response.ok) {
          throw new Error(`Scoring failed: ${response.statusText}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            setIsLoading(false)
            if (options.onComplete) {
              options.onComplete(partialResult)
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')

          // Keep the last incomplete line in the buffer
          buffer = lines[lines.length - 1]

          for (const line of lines.slice(0, -1)) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)

              if (data === '[DONE]') {
                setIsLoading(false)
                if (options.onComplete) {
                  options.onComplete(partialResult)
                }
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.chunk) {
                  // Try to parse the chunk as JSON (structured output)
                  try {
                    const update = JSON.parse(parsed.chunk)
                    setPartialResult((prev) => ({ ...prev, ...update }))
                    if (options.onUpdate) {
                      options.onUpdate(update)
                    }
                  } catch {
                    // If not JSON, it's plain text
                    // This handles streaming text before structured output is complete
                  }
                }
              } catch (e) {
                console.error('Failed to parse streaming data:', e)
              }
            }
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setIsLoading(false)
        if (options.onError) {
          options.onError(error)
        }
      }
    },
    [options, partialResult]
  )

  return {
    scoreWithStream,
    isLoading,
    error,
    partialResult,
  }
}
