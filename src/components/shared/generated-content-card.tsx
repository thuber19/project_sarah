'use client'

import { useState } from 'react'
import { Copy, Check, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GeneratedContentCardProps {
  title: string
  description: string
  generateLabel?: string
  regenerateLabel?: string
  emptyLabel?: string
  isLoading: boolean
  completion: string | null
  onGenerate: () => void
  onCopy?: () => void
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function GeneratedContentCard({
  title,
  description,
  generateLabel = 'Generieren',
  regenerateLabel = 'Neu generieren',
  emptyLabel = 'Noch nicht generiert',
  isLoading,
  completion,
  onGenerate,
  onCopy,
  icon,
  children,
  className,
}: GeneratedContentCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!completion) return

    if (onCopy) {
      onCopy()
      return
    }

    await navigator.clipboard.writeText(completion)
    setCopied(true)
    toast.success('In Zwischenablage kopiert')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn('rounded-xl border border-border bg-white p-6', className)}
      aria-busy={isLoading}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        {icon && (
          <span className="flex shrink-0 items-center text-accent" aria-hidden="true">
            {icon}
          </span>
        )}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{description}</p>

      {/* Empty state */}
      {!completion && !isLoading && (
        <p className="mb-4 text-sm text-muted-foreground italic">{emptyLabel}</p>
      )}

      {/* Loading indicator (before first token arrives) */}
      {isLoading && !completion && (
        <div className="mb-4 flex items-center gap-2" aria-live="polite">
          <Loader2
            className="h-4 w-4 animate-spin text-accent"
            role="status"
            aria-label="Wird generiert"
          />
          <span className="text-sm text-muted-foreground">Wird generiert...</span>
        </div>
      )}

      {/* Completion display (streams in progressively) */}
      {completion && (
        <div className="mb-4" aria-live="polite">
          <div className="relative">
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-secondary p-4 text-sm leading-relaxed text-foreground">
              {completion}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2 top-2 rounded-lg border border-border bg-white p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              title="In Zwischenablage kopieren"
              aria-label="In Zwischenablage kopieren"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Extra content */}
      {children}

      {/* Action button */}
      <Button
        variant={completion ? 'outline' : 'default'}
        className="w-full gap-2"
        onClick={onGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Wird generiert...
          </>
        ) : completion ? (
          <>
            <RefreshCw className="h-4 w-4" />
            {regenerateLabel}
          </>
        ) : (
          generateLabel
        )}
      </Button>
    </div>
  )
}

export type { GeneratedContentCardProps }
