'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useOnboarding } from '@/contexts/onboarding-context'

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
  const context = useOnboarding()
  const { icp, scoreThreshold, setIcp, setScoreThreshold } = context

  if (!icp) {
    return (
      <div className="text-center text-muted-foreground">
        Bitte starten Sie mit Schritt 1
      </div>
    )
  }

  const [companySize] = icp.company_sizes
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

  const handleCompanySizeChange = (value: string | null) => {
    if (!value) return
    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: icp!.industries,
      company_sizes: [value],
      regions: icp!.regions,
    })
  }

  const handleRegionChange = (region: string, checked: boolean) => {
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

  const handleIndustryRemove = (industryToRemove: string) => {
    setIcp({
      job_titles: icp!.job_titles,
      seniority_levels: icp!.seniority_levels,
      industries: icp!.industries.filter((i) => i !== industryToRemove),
      company_sizes: icp!.company_sizes,
      regions: icp!.regions,
    })
  }

  const handleBack = () => {
    router.push('/onboarding/step-2')
  }

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-7 rounded-xl border border-border bg-white p-9">
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
        </div>

        {/* Unternehmensgröße */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Unternehmensgröße</label>
          <Select value={companySize} onValueChange={handleCompanySizeChange}>
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
                  onCheckedChange={(v) => handleRegionChange(region, v === true)}
                />
                {region}
              </label>
            ))}
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
        <button
          type="button"
          onClick={handleBack}
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
