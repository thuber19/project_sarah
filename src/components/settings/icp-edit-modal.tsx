'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'

interface IcpFormData {
  industries: string[]
  companySizeMin: number
  companySizeMax: number
  regions: string[]
  minScore: number
  signals: string[]
}

interface IcpEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: IcpFormData
  onSave: (data: IcpFormData) => void
}

const REGION_OPTIONS = ['DACH', 'Nordics', 'Benelux'] as const

const SIGNAL_OPTIONS = [
  { value: 'recent_funding', label: 'Kurzliche Finanzierungsrunde' },
  { value: 'new_c_level', label: 'Neue C-Level Einstellungen' },
  { value: 'market_expansion', label: 'Expansion in neue Markte' },
  { value: 'tech_stack_change', label: 'Technologie-Stack Anderungen' },
] as const

const DEFAULT_DATA: IcpFormData = {
  industries: [],
  companySizeMin: 10,
  companySizeMax: 500,
  regions: [],
  minScore: 50,
  signals: [],
}

export function IcpEditModal({ open, onOpenChange, initialData, onSave }: IcpEditModalProps) {
  const [formData, setFormData] = useState<IcpFormData>(initialData ?? DEFAULT_DATA)
  const [industryInput, setIndustryInput] = useState('')

  function handleAddIndustry(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const value = industryInput.trim()
    if (value && !formData.industries.includes(value)) {
      setFormData((prev) => ({ ...prev, industries: [...prev.industries, value] }))
    }
    setIndustryInput('')
  }

  function handleRemoveIndustry(industry: string) {
    setFormData((prev) => ({
      ...prev,
      industries: prev.industries.filter((i) => i !== industry),
    }))
  }

  function handleRegionToggle(region: string, checked: boolean) {
    setFormData((prev) => ({
      ...prev,
      regions: checked ? [...prev.regions, region] : prev.regions.filter((r) => r !== region),
    }))
  }

  function handleSignalToggle(signal: string, checked: boolean) {
    setFormData((prev) => ({
      ...prev,
      signals: checked ? [...prev.signals, signal] : prev.signals.filter((s) => s !== signal),
    }))
  }

  function handleSubmit() {
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ICP-Kriterien bearbeiten</DialogTitle>
          <DialogDescription>
            Definiere dein Ideal Customer Profile, um passende Leads zu finden.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Industries */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="industry-input">Ziel-Branchen</Label>
            <Input
              id="industry-input"
              placeholder="Branche eingeben und Enter drucken (z.B. SaaS, FinTech)"
              value={industryInput}
              onChange={(e) => setIndustryInput(e.target.value)}
              onKeyDown={handleAddIndustry}
              className="min-h-12"
            />
            {formData.industries.length > 0 && (
              <div className="flex flex-wrap gap-1.5" role="list" aria-label="Ausgewahlte Branchen">
                {formData.industries.map((industry) => (
                  <Badge key={industry} variant="secondary" className="gap-1 pr-1">
                    {industry}
                    <button
                      type="button"
                      onClick={() => handleRemoveIndustry(industry)}
                      className="ml-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full hover:bg-muted-foreground/20"
                      aria-label={`${industry} entfernen`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Company Size */}
          <div className="flex flex-col gap-2">
            <Label>Unternehmensgrosse</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="company-min" className="text-xs text-muted-foreground">
                  Min. Mitarbeiter
                </Label>
                <Input
                  id="company-min"
                  type="number"
                  min={1}
                  value={formData.companySizeMin}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companySizeMin: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="min-h-12"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="company-max" className="text-xs text-muted-foreground">
                  Max. Mitarbeiter
                </Label>
                <Input
                  id="company-max"
                  type="number"
                  min={1}
                  value={formData.companySizeMax}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companySizeMax: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="min-h-12"
                />
              </div>
            </div>
          </div>

          {/* Regions */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Regionen</legend>
            <div className="flex flex-col gap-2.5">
              {REGION_OPTIONS.map((region) => (
                <label key={region} className="flex min-h-12 cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={formData.regions.includes(region)}
                    onCheckedChange={(v) => handleRegionToggle(region, v === true)}
                  />
                  <span className="text-sm">{region}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Min Score */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="min-score">Mindest-Score</Label>
              <span className="text-sm font-medium text-accent">{formData.minScore}</span>
            </div>
            <Slider
              id="min-score"
              min={0}
              max={100}
              value={[formData.minScore]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v
                setFormData((prev) => ({ ...prev, minScore: val ?? prev.minScore }))
              }}
              aria-label="Mindest-Score"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Signals */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Schlussel-Signale</legend>
            <div className="flex flex-col gap-2.5">
              {SIGNAL_OPTIONS.map((signal) => (
                <label
                  key={signal.value}
                  className="flex min-h-12 cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={formData.signals.includes(signal.value)}
                    onCheckedChange={(v) => handleSignalToggle(signal.value, v === true)}
                  />
                  <span className="text-sm">{signal.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-12">
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} className="min-h-12">
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { IcpFormData }
