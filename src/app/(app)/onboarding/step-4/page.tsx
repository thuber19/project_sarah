'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { redirect } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, CheckCircle, Loader2, Target } from 'lucide-react'
import Link from 'next/link'
import {
  saveOnboardingAction,
  trackOnboardingEventAction,
  type ProfileData,
  type IcpData,
} from '@/app/actions/onboarding.actions'

function getStoredData(): { profile: ProfileData; icp: IcpData } | null {
  if (typeof window === 'undefined') return null
  const storedProfile = sessionStorage.getItem('onboarding_profile')
  const storedIcp = sessionStorage.getItem('onboarding_icp')
  if (!storedProfile || !storedIcp) {
    redirect('/onboarding/step-1')
  }
  return {
    profile: JSON.parse(storedProfile),
    icp: JSON.parse(storedIcp),
  }
}

function SummarySection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="flex flex-col gap-1 pl-6">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-sm text-muted-foreground">--</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export default function OnboardingStep4() {
  const [stored] = useState(getStoredData)
  const profile = stored?.profile ?? null
  const icp = stored?.icp ?? null
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const startTimeRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = Date.now()
    trackOnboardingEventAction(4, 'started')
  }, [])

  function handleComplete() {
    if (!profile || !icp) return
    setError(null)

    startTransition(async () => {
      trackOnboardingEventAction(4, 'completed', {
        duration_ms: Date.now() - startTimeRef.current,
      })
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
    })
  }

  if (!profile || !icp) return null

  return (
    <div className="flex w-full max-w-[600px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-10 pb-8">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="text-success" size={36} />
      </div>

      <h1 className="text-center text-xl font-bold text-foreground">Alles bereit!</h1>

      <p className="text-center text-sm text-muted-foreground">
        Dein Account ist eingerichtet und Sarah ist bereit, Leads für dich zu finden.
      </p>

      {/* Summary card */}
      <div className="flex w-full flex-col gap-5 rounded-lg bg-muted p-5">
        {/* Company profile section */}
        <SummarySection
          icon={<Building2 size={16} className="text-accent" />}
          title="Unternehmen"
        >
          <SummaryRow label="Name" value={profile.company_name} />
          <SummaryRow label="Branche" value={profile.industry} />
          {profile.description && (
            <SummaryRow label="Beschreibung" value={truncate(profile.description, 120)} />
          )}
          {profile.value_proposition && (
            <SummaryRow label="Value Proposition" value={truncate(profile.value_proposition, 120)} />
          )}
        </SummarySection>

        <div className="h-px w-full bg-border" />

        {/* ICP section */}
        <SummarySection
          icon={<Target size={16} className="text-accent" />}
          title="Ideales Kundenprofil"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Zielbranchen</span>
              <TagList items={icp.industries} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Unternehmensgröße
              </span>
              <span className="text-sm text-foreground">
                {icp.company_sizes.join(', ')} Mitarbeiter
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Regionen</span>
              <TagList items={icp.regions} />
            </div>
          </div>
        </SummarySection>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

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
