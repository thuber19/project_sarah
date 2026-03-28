'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { analyzeWebsiteAction } from '@/app/actions/onboarding.actions'
import { onboardingStep1Schema } from '@/schemas/onboarding.schema'

export default function OnboardingStep1() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    const result = onboardingStep1Schema.safeParse({ url })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Ungültige Eingabe')
      return
    }

    startTransition(async () => {
      const result = await analyzeWebsiteAction(url)

      if ('error' in result) {
        setError(result.error)
        return
      }

      sessionStorage.setItem('onboarding_profile', JSON.stringify(result.profile))
      sessionStorage.setItem('onboarding_icp', JSON.stringify(result.icp))
      router.push('/onboarding/step-2')
    })
  }

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12 pt-12 pb-10">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-light">
        <Globe className="text-accent" size={32} />
      </div>

      <h1 className="text-center text-xl font-bold text-foreground">
        Lass uns dein Unternehmen kennenlernen
      </h1>

      <p className="text-center text-sm text-muted-foreground">
        Gib deine Website-URL ein und Sarah analysiert automatisch dein Business-Profil, deine Branche
        und ideale Zielkunden.
      </p>

      <div className="flex w-full flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Website URL</label>
        <Input
          id="website-url"
          placeholder="https://dein-unternehmen.at"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={isPending}
          aria-invalid={!!error}
          aria-describedby={error ? 'url-error' : undefined}
        />
        {error && (
          <p id="url-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !url.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analysiere Website...
          </>
        ) : (
          'Website analysieren'
        )}
      </button>

      <p className="text-xs text-muted-foreground">Die Analyse dauert ca. 30 Sekunden</p>
    </div>
  )
}
