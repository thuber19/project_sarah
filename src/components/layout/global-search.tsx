'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import type { Lead } from '@/types/lead'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'

interface SearchResult extends Pick<Lead, 'id' | 'first_name' | 'last_name' | 'company_name' | 'email'> {
  score?: number
  grade?: string
}

export function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          setResults([])
          return
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const searchTerm = `%${query.toLowerCase()}%`

        // Search across multiple fields
        const { data, error } = await supabase
          .from('leads')
          .select(
            'id, first_name, last_name, email, company_name, lead_scores(total_score, grade)'
          )
          .or(
            `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},company_name.ilike.${searchTerm}`
          )
          .limit(10)

        if (error) {
          console.error('Search error:', error)
          setResults([])
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join result
          const formattedResults = (data || []).map((lead: any) => ({
            id: lead.id,
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            company_name: lead.company_name,
            score: lead.lead_scores?.[0]?.total_score,
            grade: lead.lead_scores?.[0]?.grade,
          }))
          setResults(formattedResults)
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleSelectResult = (leadId: string) => {
    setQuery('')
    setIsOpen(false)
    router.push(`/leads/${leadId}`)
  }

  const displayName = (result: SearchResult) => {
    const name =
      result.first_name && result.last_name
        ? `${result.first_name} ${result.last_name}`
        : result.first_name || result.last_name || result.email || 'Unknown'
    return name
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Suchen... (Cmd+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown Overlay */}
      {isOpen && (results.length > 0 || (query && !isLoading)) && (
        <div className="absolute top-full z-50 mt-2 w-96 rounded-lg border border-border bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((result, idx) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleSelectResult(result.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-muted ${
                      idx !== results.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm text-foreground">
                          {displayName(result)}
                        </p>
                        {result.company_name && (
                          <p className="truncate text-xs text-muted-foreground">
                            {result.company_name}
                          </p>
                        )}
                      </div>
                      {result.grade && (
                        <div className="shrink-0">
                          <ScoreBadge grade={result.grade as Grade} />
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Keine Ergebnisse gefunden
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
