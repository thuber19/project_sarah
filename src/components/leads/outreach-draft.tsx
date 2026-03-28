'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Mail, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OutreachDraftProps {
  leadId: string
}

type Template = 'initial_contact' | 'follow_up' | 'meeting_proposal'

const TEMPLATE_LABELS: Record<Template, string> = {
  initial_contact: 'Erstkontakt',
  follow_up: 'Follow-up',
  meeting_proposal: 'Terminvorschlag',
}

export function OutreachDraft({ leadId }: OutreachDraftProps) {
  const [template, setTemplate] = useState<Template>('initial_contact')
  const [copied, setCopied] = useState(false)

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/outreach/draft',
    body: { leadId, template },
    onError: () => toast.error('E-Mail konnte nicht generiert werden'),
  })

  function handleGenerate() {
    complete('')
  }

  async function handleCopy() {
    if (!completion) return
    await navigator.clipboard.writeText(completion)
    setCopied(true)
    toast.success('In Zwischenablage kopiert')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6" aria-busy={isLoading}>
      <div className="mb-4 flex items-center gap-2">
        <Mail className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold text-foreground">Outreach E-Mail</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Generiere eine personalisierte E-Mail-Vorlage basierend auf den Lead-Daten und deinem
        Unternehmensprofil.
      </p>

      {/* Template selector */}
      <div className="mb-4 flex gap-2">
        {(Object.entries(TEMPLATE_LABELS) as [Template, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTemplate(key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              template === key
                ? 'border-accent bg-accent-light text-accent'
                : 'border-border bg-white text-muted-foreground hover:bg-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2
              className="h-4 w-4 animate-spin"
              role="status"
              aria-label="E-Mail wird generiert"
            />
            Generiere E-Mail...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            {completion ? 'Neu generieren' : 'E-Mail generieren'}
          </>
        )}
      </button>

      {/* Draft display */}
      {completion && (
        <div className="mt-4" aria-live="polite">
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
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
