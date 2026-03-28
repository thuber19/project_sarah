'use client'

import { AlertCircle } from 'lucide-react'

interface ErrorCardProps {
  reset: () => void
  title?: string
  description?: string
}

export function ErrorCard({
  reset,
  title = 'Etwas ist schiefgelaufen',
  description = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
}: ErrorCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-white p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
