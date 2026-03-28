'use client'

import { useEffect, useRef, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { IcpData } from '@/app/actions/onboarding.actions'
import { trackOnboardingEventAction } from '@/app/actions/onboarding.actions'

function TagPill({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 inline-flex items-center justify-center rounded-sm hover:text-accent/70"
        aria-label={`${children} entfernen`}
      >
        <X size={12} />
      </button>
    </span>
  )
}

function getStoredIcp(): IcpData | null {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem('onboarding_icp')
  if (!stored) {
    redirect('/onboarding/step-1')
  }
  return JSON.parse(stored)
}

function deriveRegions(icpRegions: string[]): Record<string, boolean> {
  const lower = icpRegions.map((r) => r.toLowerCase())
  const hasDach = lower.some((r) => r.includes('dach'))
  return {
    Österreich: hasDach || lower.some((r) => r.includes('österreich') || r.includes('austria')),
    Deutschland: hasDach || lower.some((r) => r.includes('deutschland') || r.includes('germany')),
    Schweiz: hasDach || lower.some((r) => r.includes('schweiz') || r.includes('switzerland')),
  }
}

export default function OnboardingStep3() {
  const router = useRouter()
  const [storedIcp] = useState(getStoredIcp)
  const startTimeRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = Date.now()
    trackOnboardingEventAction(3, 'started')
  }, [])
  const [industries, setIndustries] = useState<string[]>(storedIcp?.industries ?? [])
  const [companySize, setCompanySize] = useState('10-100')
  const [regions, setRegions] = useState<Record<string, boolean>>(() =>
    deriveRegions(storedIcp?.regions ?? []),
  )
  const [techStack, setTechStack] = useState<string[]>([])
  const [scoreThreshold, setScoreThreshold] = useState(60)

  function handleNext() {
    const selectedRegions = Object.entries(regions)
      .filter(([, v]) => v)
      .map(([k]) => k)

    const icpData: IcpData = {
      job_titles: JSON.parse(sessionStorage.getItem('onboarding_icp') ?? '{}').job_titles ?? [],
      seniority_levels:
        JSON.parse(sessionStorage.getItem('onboarding_icp') ?? '{}').seniority_levels ?? [],
      industries,
      company_sizes: [companySize],
      regions: selectedRegions,
    }

    sessionStorage.setItem('onboarding_icp', JSON.stringify(icpData))
    sessionStorage.setItem('onboarding_score_threshold', String(scoreThreshold))
    trackOnboardingEventAction(3, 'completed', {
      duration_ms: Date.now() - startTimeRef.current,
    })
    router.push('/onboarding/step-4')
  }

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-7 rounded-xl border border-border bg-white p-9">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">
          Definiere dein ideales Kundenprofil
        </h1>
        <p className="text-sm text-muted-foreground">
          Basierend auf der Analyse empfehlen wir folgende Kriterien. Passe sie an.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Zielbranchen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Zielbranchen</label>
          <div className="flex flex-wrap items-center gap-2">
            {industries.map((industry) => (
              <TagPill
                key={industry}
                onRemove={() => setIndustries((prev) => prev.filter((i) => i !== industry))}
              >
                {industry}
              </TagPill>
            ))}
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
              + hinzufügen
            </button>
          </div>
        </div>

        {/* Unternehmensgröße */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Unternehmensgröße</label>
          <Select value={companySize} onValueChange={(v) => v && setCompanySize(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 Mitarbeiter</SelectItem>
              <SelectItem value="10-100">10-100 Mitarbeiter</SelectItem>
              <SelectItem value="100-250">100-250 Mitarbeiter</SelectItem>
              <SelectItem value="250-1000">250-1000 Mitarbeiter</SelectItem>
              <SelectItem value="1000+">1000+ Mitarbeiter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Region */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Region</label>
          <div className="flex flex-col gap-2.5">
            {Object.entries(regions).map(([region, checked]) => (
              <label key={region} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => setRegions((prev) => ({ ...prev, [region]: v === true }))}
                />
                {region}
              </label>
            ))}
          </div>
        </div>

        {/* Technologie-Stack */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Technologie-Stack</label>
          <div className="flex flex-wrap items-center gap-2">
            {techStack.map((tech) => (
              <TagPill
                key={tech}
                onRemove={() => setTechStack((prev) => prev.filter((t) => t !== tech))}
              >
                {tech}
              </TagPill>
            ))}
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
              + hinzufügen
            </button>
          </div>
        </div>

        {/* Min. Score Threshold */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Min. Score Threshold</label>
            <span className="text-sm font-medium text-foreground">{scoreThreshold}</span>
          </div>
          <Slider
            min={0}
            max={100}
            value={[scoreThreshold]}
            onValueChange={(value) => setScoreThreshold(Array.isArray(value) ? value[0] : value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/onboarding/step-2"
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </Link>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}
