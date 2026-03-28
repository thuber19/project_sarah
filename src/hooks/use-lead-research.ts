'use client'

import { useState, useCallback } from 'react'

interface LeadResearch {
  id: string
  tech_stack: string[]
  hiring_activity: string
  growth_signals: string
  dach_data: {
    impressum?: string
    headquarters?: string
    employees_registered?: string
    locations?: string[]
  }
  full_report: string
  research_at: string
}

interface UseLeadResearchOptions {
  onUpdate?: (chunk: string) => void
  onComplete?: (research: LeadResearch) => void
  onError?: (error: Error) => void
}

export function useLeadResearch(options: UseLeadResearchOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [research, setResearch] = useState<LeadResearch | null>(null)
  const [fullText, setFullText] = useState('')

  const startResearch = useCallback(
    async (leadId: string, websiteUrl?: string) => {
      setIsLoading(true)
      setError(null)
      setFullText('')

      try {
        const response = await fetch('/api/research/lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId,
            websiteUrl,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Research failed: ${response.statusText}`)
        }

        // Check if it's cached
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const data = await response.json()
          if (data.cached && data.research) {
            setResearch(data.research)
            setIsLoading(false)
            if (options.onComplete) {
              options.onComplete(data.research)
            }
            return
          }
        }

        // Stream the research
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
            if (options.onComplete && research) {
              options.onComplete(research)
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')

          buffer = lines[lines.length - 1]

          for (const line of lines.slice(0, -1)) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)

              if (data === '[DONE]') {
                setIsLoading(false)
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.chunk) {
                  setFullText((prev) => prev + parsed.chunk)
                  if (options.onUpdate) {
                    options.onUpdate(parsed.chunk)
                  }
                }
              } catch (e) {
                console.error('Failed to parse research chunk:', e)
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
    [options, research]
  )

  return {
    startResearch,
    isLoading,
    error,
    research,
    fullText,
  }
}
