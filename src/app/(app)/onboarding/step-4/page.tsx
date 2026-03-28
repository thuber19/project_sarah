'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { saveOnboardingAction } from '@/app/actions/onboarding.actions'
import { useOnboarding } from '@/contexts/onboarding-context'

export default function OnboardingStep4() {
  const router = useRouter()
  const { profile, icp, scoreThreshold, resetOnboarding } = useOnboarding()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!profile || !icp) {
    return (
      <div className="text-center text-muted-foreground">
        Bitte starten Sie mit Schritt 1
      </div>
    )
  }

  function handleComplete(destination: '/dashboard' | '/discovery' = '/dashboard') {
    if (!profile || !icp) return
    setError(null)

    startTransition(async () => {
      const result = await saveOnboardingAction(profile, icp, destination)
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      // saveOnboardingAction redirects on success
      resetOnboarding()
    })
  }

  const handleBack = () => {
    router.push('/onboarding/step-3')
  }

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-6 pt-8 pb-8 md:p-12 md:pt-12 md:pb-10">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="text-success" size={36} />
      </div>

      <h1 className="text-center text-xl font-bold text-foreground">Alles bereit!</h1>

      <p className="text-center text-sm text-muted-foreground">
        Dein Account ist eingerichtet und Sarah ist bereit, Leads für dich zu finden.
      </p>

      <div className="flex w-full flex-col gap-1.5 rounded-lg bg-muted p-4">
        <span className="text-sm text-foreground">Unternehmen: {profile.company_name}</span>
        <span className="text-sm text-muted-foreground">
          ICP: {icp.industries.join(', ')} &middot; {icp.company_sizes.join(', ')} MA &middot;{' '}
          {icp.regions.join(', ')}
        </span>
        <span className="text-sm text-muted-foreground">Min. Score: {scoreThreshold}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => handleComplete('/discovery')}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Speichere...
          </>
        ) : (
          'Erste Discovery starten'
        )}
      </button>

      <button
        type="button"
        onClick={() => handleComplete('/dashboard')}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Speichere...
          </>
        ) : (
          'Zum Dashboard'
        )}
      </button>

      <button
        type="button"
        onClick={handleBack}
        className="w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-foreground"
      >
        Zurück
      </button>
    </div>
  )
}
