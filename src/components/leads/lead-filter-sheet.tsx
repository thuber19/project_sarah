'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface LeadFilters {
  scoreRange: [number, number]
  industries: string[]
  regions: string[]
}

interface LeadFilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: LeadFilters
  onApply: (filters: LeadFilters) => void
  resultCount?: number
}

const INDUSTRY_OPTIONS = ['SaaS', 'FinTech', 'HealthTech', 'E-Commerce'] as const
const REGION_OPTIONS = [
  { value: 'AT', label: 'Osterreich' },
  { value: 'DE', label: 'Deutschland' },
  { value: 'CH', label: 'Schweiz' },
] as const

const DEFAULT_FILTERS: LeadFilters = {
  scoreRange: [0, 100],
  industries: [],
  regions: [],
}

export function LeadFilterSheet({
  open,
  onOpenChange,
  filters,
  onApply,
  resultCount,
}: LeadFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters)

  function handleIndustryToggle(industry: string, checked: boolean) {
    setLocalFilters((prev) => ({
      ...prev,
      industries: checked
        ? [...prev.industries, industry]
        : prev.industries.filter((i) => i !== industry),
    }))
  }

  function handleRegionToggle(region: string, checked: boolean) {
    setLocalFilters((prev) => ({
      ...prev,
      regions: checked
        ? [...prev.regions, region]
        : prev.regions.filter((r) => r !== region),
    }))
  }

  function handleApply() {
    onApply(localFilters)
    onOpenChange(false)
  }

  function handleReset() {
    setLocalFilters(DEFAULT_FILTERS)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton className="rounded-t-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pb-2 pt-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4">
          {/* Score Range */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Score-Bereich</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-min" className="text-xs text-muted-foreground">
                  Min
                </Label>
                <Input
                  id="score-min"
                  type="number"
                  min={0}
                  max={100}
                  value={localFilters.scoreRange[0]}
                  onChange={(e) => {
                    const val = Math.min(parseInt(e.target.value, 10) || 0, localFilters.scoreRange[1])
                    setLocalFilters((prev) => ({
                      ...prev,
                      scoreRange: [val, prev.scoreRange[1]],
                    }))
                  }}
                  className="min-h-12"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-max" className="text-xs text-muted-foreground">
                  Max
                </Label>
                <Input
                  id="score-max"
                  type="number"
                  min={0}
                  max={100}
                  value={localFilters.scoreRange[1]}
                  onChange={(e) => {
                    const val = Math.max(parseInt(e.target.value, 10) || 0, localFilters.scoreRange[0])
                    setLocalFilters((prev) => ({
                      ...prev,
                      scoreRange: [prev.scoreRange[0], val],
                    }))
                  }}
                  className="min-h-12"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {localFilters.scoreRange[0]} &ndash; {localFilters.scoreRange[1]}
            </p>
          </div>

          {/* Industries */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Branche</legend>
            <div className="flex flex-col gap-2.5">
              {INDUSTRY_OPTIONS.map((industry) => (
                <label
                  key={industry}
                  className="flex min-h-12 cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={localFilters.industries.includes(industry)}
                    onCheckedChange={(v) => handleIndustryToggle(industry, v === true)}
                  />
                  <span className="text-sm">{industry}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Regions */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Region</legend>
            <div className="flex flex-col gap-2.5">
              {REGION_OPTIONS.map((region) => (
                <label
                  key={region.value}
                  className="flex min-h-12 cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={localFilters.regions.includes(region.value)}
                    onCheckedChange={(v) => handleRegionToggle(region.value, v === true)}
                  />
                  <span className="text-sm">{region.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <SheetFooter>
          <Button onClick={handleApply} className="min-h-12 w-full">
            {resultCount !== undefined ? `${resultCount} Ergebnisse anzeigen` : 'Ergebnisse anzeigen'}
          </Button>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-12 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Filter zurucksetzen
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export type { LeadFilters, LeadFilterSheetProps }
