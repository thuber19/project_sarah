'use client'

import { useEffect, useRef, useState } from 'react'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { ProfileData } from '@/app/actions/onboarding.actions'
import { trackOnboardingEventAction } from '@/app/actions/onboarding.actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

function getStoredProfile(): ProfileData | null {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem('onboarding_profile')
  if (!stored) {
    redirect('/onboarding/step-1')
  }
  return JSON.parse(stored)
}

export default function OnboardingStep2() {
  const router = useRouter()
  const [profile] = useState<ProfileData | null>(getStoredProfile)
  const startTimeRef = useRef(0)

  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [industry, setIndustry] = useState(profile?.industry ?? '')
  const [targetMarket, setTargetMarket] = useState(profile?.target_market ?? '')
  const [productSummary, setProductSummary] = useState(profile?.product_summary ?? '')
  const [valueProposition, setValueProposition] = useState(profile?.value_proposition ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')

  useEffect(() => {
    startTimeRef.current = Date.now()
    trackOnboardingEventAction(2, 'started')
  }, [])

  function handleContinue() {
    const updatedProfile: ProfileData = {
      ...profile!,
      company_name: companyName,
      industry,
      target_market: targetMarket,
      product_summary: productSummary,
      value_proposition: valueProposition,
      description,
    }
    sessionStorage.setItem('onboarding_profile', JSON.stringify(updatedProfile))

    trackOnboardingEventAction(2, 'completed', {
      duration_ms: Date.now() - startTimeRef.current,
    })
    router.push('/onboarding/step-3')
  }

  if (!profile) return null

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-6 rounded-xl border border-border bg-white p-8">
      <div className="flex items-center gap-2.5">
        <CheckCircle className="text-success" size={24} />
        <h1 className="text-xl font-bold text-foreground">Dein Business-Profil</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Sarah hat deine Website analysiert. Überprüfe und bearbeite die Ergebnisse.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company-name" className="text-sm font-medium text-foreground">
            Unternehmensname
          </Label>
          <Input
            id="company-name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="industry" className="text-sm font-medium text-foreground">
            Branche
          </Label>
          <Input
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target-market" className="text-sm font-medium text-foreground">
            Zielmarkt
          </Label>
          <Input
            id="target-market"
            value={targetMarket}
            onChange={(e) => setTargetMarket(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-summary" className="text-sm font-medium text-foreground">
            Produkt
          </Label>
          <Textarea
            id="product-summary"
            rows={2}
            value={productSummary}
            onChange={(e) => setProductSummary(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="value-proposition" className="text-sm font-medium text-foreground">
            Value Proposition
          </Label>
          <Textarea
            id="value-proposition"
            rows={3}
            value={valueProposition}
            onChange={(e) => setValueProposition(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            Beschreibung
          </Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="h-px w-full bg-secondary" />

      <div className="flex justify-end gap-3">
        <Link
          href="/onboarding/step-1"
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Bestätigen &amp; Weiter
        </button>
      </div>
    </div>
  )
}
