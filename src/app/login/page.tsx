'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Project Sarah</h1>
          <p className="mt-2 text-sm text-zinc-500">AI-gesteuerter B2B Sales Agent</p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <div className="mb-3 text-2xl">✉️</div>
            <p className="font-medium text-zinc-900">Link verschickt!</p>
            <p className="mt-1 text-sm text-zinc-500">
              Check deine E-Mails — der Magic Link ist auf dem Weg zu <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="du@beispiel.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Wird gesendet…' : 'Magic Link senden'}
            </button>

            <p className="text-center text-xs text-zinc-400">
              Kein Passwort nötig — wir schicken dir einen sicheren Login-Link.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
