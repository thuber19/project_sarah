'use client'

import { useEffect, useRef, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
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
  const [showAddIndustry, setShowAddIndustry] = useState(false)
  const [newIndustry, setNewIndustry] = useState('')
  const addIndustryInputRef = useRef<HTMLInputElement>(null)
  const [companySize, setCompanySize] = useState(storedIcp?.company_sizes?.[0] ?? '10-100')
  const [regions, setRegions] = useState<Record<string, boolean>>(() =>
    deriveRegions(storedIcp?.regions ?? []),
  )
  function handleAddIndustry() {
    const trimmed = newIndustry.trim()
    if (!trimmed) return
    if (industries.some((i) => i.toLowerCase() === trimmed.toLowerCase())) return
    setIndustries((prev) => [...prev, trimmed])
    setNewIndustry('')
    setShowAddIndustry(false)
  }

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
        <div className="flex flex-col gap-1.5" role="group" aria-labelledby="zielbranchen-label">
          <label id="zielbranchen-label" className="text-sm font-medium text-foreground">
            Zielbranchen
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {industries.map((industry) => (
              <TagPill
                key={industry}
                onRemove={() => setIndustries((prev) => prev.filter((i) => i !== industry))}
              >
                {industry}
              </TagPill>
            ))}
            {!showAddIndustry && (
              <button
                type="button"
                onClick={() => {
                  setShowAddIndustry(true)
                  setTimeout(() => addIndustryInputRef.current?.focus(), 0)
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                + hinzufügen
              </button>
            )}
          </div>
          {showAddIndustry && (
            <div className="flex items-center gap-2">
              <Input
                ref={addIndustryInputRef}
                type="text"
                placeholder="Neue Branche eingeben..."
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddIndustry()
                  }
                  if (e.key === 'Escape') {
                    setNewIndustry('')
                    setShowAddIndustry(false)
                  }
                }}
                onBlur={(e) => {
                  // Don't close if clicking the add button
                  if (e.relatedTarget?.closest('[data-add-industry-btn]')) return
                  if (!newIndustry.trim()) {
                    setShowAddIndustry(false)
                  }
                }}
                className="h-8 max-w-[220px] text-sm"
                aria-label="Neue Branche"
              />
              <button
                type="button"
                data-add-industry-btn
                onClick={handleAddIndustry}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-white hover:bg-accent/90"
                aria-label="Branche hinzufügen"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Unternehmensgröße */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="company-size-input" className="text-sm font-medium text-foreground">
            Unternehmensgröße
          </label>
          <Input
            id="company-size-input"
            type="text"
            placeholder="z. B. 10-100"
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Gib eine Mitarbeiteranzahl-Range ein, z. B. 10-100 oder 50-500
          </p>
        </div>

        {/* Region */}
        <div className="flex flex-col gap-1.5" role="group" aria-labelledby="region-label">
          <span id="region-label" className="text-sm font-medium text-foreground">Region</span>
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
