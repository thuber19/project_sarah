'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { AuthLeftPanel } from '@/components/auth/auth-left-panel'
import { emailSchema } from '@/lib/validation/schemas'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const emailValidation = emailSchema.safeParse(email)
    if (!emailValidation.success) {
      setError(emailValidation.error.issues[0].message)
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
        toast.error('Magic Link konnte nicht gesendet werden.')
        return
      }
      toast.success('Magic Link gesendet! Prüfe dein Postfach.')
      setSubmitted(true)
    })
  }

  return (
    <div className="min-h-screen flex">
      <AuthLeftPanel />

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
