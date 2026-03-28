'use client'

import { useState } from 'react'
import { Info, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { useOnboarding } from '@/contexts/onboarding-context'

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1–10 Mitarbeiter' },
  { value: '11-50', label: '11–50 Mitarbeiter' },
  { value: '51-200', label: '51–200 Mitarbeiter' },
  { value: '201-500', label: '201–500 Mitarbeiter' },
  { value: '501-1000', label: '501–1.000 Mitarbeiter' },
]

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
  const { icp, scoreThreshold, setIcp, setScoreThreshold } = useOnboarding()

  const [newIndustry, setNewIndustry] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  if (!icp) {
    return (
      <div className="text-center text-muted-foreground">
        Bitte starten Sie mit Schritt 1
      </div>
    )
  }

  const regions = deriveRegions(icp.regions)

  function handleNext() {
    const selectedRegions = Object.entries(regions)
      .filter(([, v]) => v)
      .map(([k]) => k)

    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: icp!.industries,
      company_sizes: icp!.company_sizes,
      regions: selectedRegions,
    })
    router.push('/onboarding/step-4')
  }

  function handleIndustryAdd() {
    const trimmed = newIndustry.trim()
    if (!trimmed || icp!.industries.includes(trimmed)) return
    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: [...icp!.industries, trimmed],
      company_sizes: icp!.company_sizes,
      regions: icp!.regions,
    })
    setNewIndustry('')
  }

  function handleIndustryRemove(industryToRemove: string) {
    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: icp!.industries.filter((i) => i !== industryToRemove),
      company_sizes: icp!.company_sizes,
      regions: icp!.regions,
    })
  }

  function handleCompanySizeToggle(value: string, checked: boolean) {
    const sizes = icp!.company_sizes
    const newSizes = checked ? [...sizes, value] : sizes.filter((s) => s !== value)
    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: icp!.industries,
      company_sizes: newSizes,
      regions: icp!.regions,
    })
  }

  function handleRegionChange(region: string, checked: boolean) {
    const newRegions = checked
      ? [...icp!.regions, region]
      : icp!.regions.filter((r) => r !== region)
    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: icp!.industries,
      company_sizes: icp!.company_sizes,
      regions: newRegions,
    })
  }

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-7 rounded-xl border border-border bg-white p-4 md:p-9">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">Definiere dein ideales Kundenprofil</h1>
        <p className="text-sm text-muted-foreground">
          Basierend auf der Analyse empfehlen wir folgende Kriterien. Passe sie an.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Zielbranchen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Zielbranchen</label>
          <div className="flex flex-wrap items-center gap-2">
            {icp.industries.map((industry) => (
              <TagPill key={industry} onRemove={() => handleIndustryRemove(industry)}>
                {industry}
              </TagPill>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleIndustryAdd() } }}
              placeholder="Branche eingeben..."
              className="h-8 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Neue Branche eingeben"
            />
            <button
              type="button"
              onClick={handleIndustryAdd}
              disabled={!newIndustry.trim()}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
            >
              <Plus size={12} />
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Unternehmensgröße — Multi-Select via Checkboxen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Unternehmensgröße</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COMPANY_SIZE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={icp.company_sizes.includes(value)}
                  onCheckedChange={(v) => handleCompanySizeToggle(value, v === true)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Region</label>
          <div className="flex flex-col gap-2.5">
            {Object.entries(regions).map(([region, checked]) => (
              <label key={region} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => handleRegionChange(region, v === true)}
                />
                {region}
              </label>
            ))}
          </div>
        </div>

        {/* Mindest-Relevanzscore */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">Mindest-Relevanzscore</label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                aria-label="Erklärung zum Mindest-Relevanzscore"
                className="flex items-center text-muted-foreground hover:text-foreground"
              >
                <Info size={14} />
              </button>
              {showTooltip && (
                <div
                  role="tooltip"
                  className="absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-white p-3 text-xs text-foreground shadow-md"
                >
                  Nur Unternehmen mit einem KI-Relevanzscore über diesem Wert werden dir vorgeschlagen. Ein höherer Wert bedeutet strengere Filterung.
                </div>
              )}
            </div>
            <span className="ml-auto text-sm font-medium text-foreground">{scoreThreshold}</span>
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
        <button
          type="button"
          onClick={() => router.push('/onboarding/step-2')}
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </button>
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
