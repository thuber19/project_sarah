'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-900">Etwas ist schiefgelaufen</h2>
            <p className="text-sm text-gray-500">
              Ein kritischer Fehler ist aufgetreten. Bitte lade die Seite neu.
            </p>
          </div>
          <button type="button" onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            <RefreshCw className="h-4 w-4" />
            Seite neu laden
          </button>
        </div>
      </body>
    </html>
  )
}
