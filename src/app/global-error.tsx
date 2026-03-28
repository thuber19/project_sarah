'use client'

import { AlertCircle } from 'lucide-react'

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-muted p-8 font-sans">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-white p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold text-gray-900">Etwas ist schiefgelaufen</h2>
            <p className="text-sm text-gray-500">
              Ein kritischer Fehler ist aufgetreten. Bitte lade die Seite neu.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  )
}
