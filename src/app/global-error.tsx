'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-muted font-sans">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-error-bg">
            <AlertTriangle className="h-6 w-6 text-status-error-text" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Etwas ist schiefgelaufen</h2>
            <p className="text-sm text-muted-foreground">
              Ein kritischer Fehler ist aufgetreten. Bitte lade die Seite neu.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Seite neu laden
          </button>
        </div>
      </body>
    </html>
  )
}
