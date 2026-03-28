'use client'

import { Loader2, AlertCircle, Zap, Briefcase, Globe } from 'lucide-react'

interface LeadResearchDisplayProps {
  isLoading?: boolean
  fullText?: string
  error?: Error | null
}

export function LeadResearchDisplay({ isLoading = false, fullText = '', error }: LeadResearchDisplayProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Research Fehler</h3>
            <p className="text-sm text-red-800 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!fullText && isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="text-sm text-muted-foreground">Recherchiere Lead...</span>
        </div>
      </div>
    )
  }

  if (!fullText) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Streaming Report Container */}
      <div className="rounded-lg border border-border bg-white p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">Lead-Recherche</h3>
          {isLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Report Content */}
        <div className="prose prose-sm max-w-none">
          <div
            className="text-sm text-foreground whitespace-pre-wrap break-words"
            style={{
              animation: isLoading ? 'fade-in 0.3s ease-in-out' : 'none',
            }}
          >
            {fullText}
          </div>
        </div>

        {/* Loading indicator at bottom */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Analysiere...</span>
          </div>
        )}
      </div>

      {/* Quick Stats Cards (after streaming completes) */}
      {!isLoading && fullText && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Tech Stack</span>
            </div>
            <p className="text-sm text-foreground max-h-16 overflow-hidden">
              {fullText.includes('Tech Stack') ? 'Identifiziert' : 'Keine Info'}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Hiring</span>
            </div>
            <p className="text-sm text-foreground max-h-16 overflow-hidden">
              {fullText.includes('Hiring-Aktivität') ? 'Analysiert' : 'Keine Info'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
