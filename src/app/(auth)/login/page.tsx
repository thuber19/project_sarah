'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
        return
      }
      setSubmitted(true)
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden w-1/2 bg-primary lg:flex">
        <div className="flex w-full flex-col justify-center gap-10 bg-[radial-gradient(ellipse_at_20%_80%,rgba(59,130,246,0.15),transparent_70%)] px-16 py-20">
          <div className="w-12 h-1 rounded-full bg-accent" />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-primary-foreground">Sarah</h1>
            <p className="text-lg text-sidebar-muted">Dein AI Sales Agent für den DACH-Markt</p>
          </div>
          <div className="mt-8 flex flex-col gap-5">
            {['Automatische Lead-Discovery', 'KI-gestütztes Scoring', 'DSGVO-konform'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-[15px] text-sidebar-muted">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-10 py-10 lg:w-1/2 lg:px-20">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          {submitted ? (
            <div className="flex flex-col gap-3 text-center">
              <div className="text-4xl">✉️</div>
              <h2 className="text-2xl font-bold text-foreground">Link verschickt!</h2>
              <p className="text-sm text-muted-foreground">
                Check deine E-Mails — der Magic Link ist auf dem Weg zu <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-foreground">Willkommen zurück</h2>
                <p className="text-sm text-muted-foreground">Melde dich mit deinem Magic Link an</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email-Adresse
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@unternehmen.at"
                    className="h-10"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={isPending || !email}
                  className="w-full bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
                >
                  {isPending ? 'Wird gesendet…' : 'Magic Link senden'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
