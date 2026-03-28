'use client'

import { useState, useTransition } from 'react'
import { redirect } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import {
  saveOnboardingAction,
  type ProfileData,
  type IcpData,
} from '@/app/actions/onboarding.actions'

function getStoredData(): { profile: ProfileData; icp: IcpData; threshold: number } | null {
  if (typeof window === 'undefined') return null
  const storedProfile = sessionStorage.getItem('onboarding_profile')
  const storedIcp = sessionStorage.getItem('onboarding_icp')
  if (!storedProfile || !storedIcp) {
    redirect('/onboarding/step-1')
  }
  return {
    profile: JSON.parse(storedProfile),
    icp: JSON.parse(storedIcp),
    threshold: Number(sessionStorage.getItem('onboarding_score_threshold') ?? '60'),
  }
}

export default function OnboardingStep4() {
  const [stored] = useState(getStoredData)
  const profile = stored?.profile ?? null
  const icp = stored?.icp ?? null
  const scoreThreshold = stored?.threshold ?? 60
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleComplete() {
    if (!profile || !icp) return
    setError(null)

    startTransition(async () => {
      const result = await saveOnboardingAction(profile, icp)
      if (result && !result.success) {
        setError(result.error.message)
        toast.error('Profil konnte nicht gespeichert werden.')
        return
      }
      // saveOnboardingAction redirects to /dashboard on success
      // Clean up sessionStorage
      sessionStorage.removeItem('onboarding_profile')
      sessionStorage.removeItem('onboarding_icp')
      sessionStorage.removeItem('onboarding_score_threshold')
    })
  }

  if (!profile || !icp) return null

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12 pt-12 pb-10">
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
        onClick={handleComplete}
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

      <Link
        href="/discovery"
        className="w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-foreground"
      >
        Erste Discovery starten
      </Link>
    </div>
  )
}
