'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Loader2, Mail } from 'lucide-react'
import { generateEmailAction } from '@/app/actions/email.actions'

interface EmailGeneratorProps {
  leadId: string
}

export function EmailGenerator({ leadId }: EmailGeneratorProps) {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState<{ subject: string; body: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateEmailAction({ leadId })
      if (result.success) {
        setEmail(result.data)
      } else {
        setError(result.error.message)
      }
    })
  }

  async function handleCopy() {
    if (!email) return
    await navigator.clipboard.writeText(`Betreff: ${email.subject}\n\n${email.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isPending ? 'Generiere...' : 'E-Mail generieren'}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {email && (
        <div className="rounded-lg border border-border bg-secondary p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Generierte E-Mail</p>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-success" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Kopieren
                </>
              )}
            </button>
          </div>
          <p className="mb-2 text-sm font-semibold text-foreground">Betreff: {email.subject}</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{email.body}</p>
        </div>
      )}
    </div>
  )
}
