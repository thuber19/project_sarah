'use client'

import { useState } from 'react'
import { redirect } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { ProfileData } from '@/app/actions/onboarding.actions'

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
      {children}
    </span>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-[140px] shrink-0 text-sm font-medium text-foreground">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function getStoredProfile(): ProfileData | null {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem('onboarding_profile')
  if (!stored) {
    redirect('/onboarding/step-1')
  }
  return JSON.parse(stored)
}

export default function OnboardingStep2() {
  const [profile] = useState<ProfileData | null>(getStoredProfile)

  if (!profile) return null

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-6 rounded-xl border border-border bg-white p-8">
      <div className="flex items-center gap-2.5">
        <CheckCircle className="text-success" size={24} />
        <h1 className="text-xl font-bold text-foreground">Dein Business-Profil</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Sarah hat deine Website analysiert. Überprüfe die Ergebnisse.
      </p>

      <div className="flex flex-col gap-4">
        <FieldRow label="Unternehmensname">{profile.company_name}</FieldRow>

        <FieldRow label="Branche">
          <Tag>{profile.industry}</Tag>
        </FieldRow>

        <FieldRow label="Zielmarkt">{profile.target_market}</FieldRow>

        <FieldRow label="Produkt">{profile.product_summary}</FieldRow>

        <FieldRow label="Value Proposition">{profile.value_proposition}</FieldRow>

        <FieldRow label="Beschreibung">{profile.description}</FieldRow>
      </div>

      <div className="h-px w-full bg-secondary" />

      <div className="flex justify-end gap-3">
        <Link
          href="/onboarding/step-1"
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </Link>
        <Link
          href="/onboarding/step-3"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Bestätigen &amp; Weiter
        </Link>
      </div>
    </div>
  )
}
