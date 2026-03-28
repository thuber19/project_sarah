'use client'

import { useState } from 'react'
import { Plus, X, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ContactPreferences, ContactChannel } from '@/types/lead'

interface ContactPreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPreferences?: ContactPreferences | null
  onConfirm: (preferences: ContactPreferences) => void
  isPending?: boolean
}

const SENIORITY_OPTIONS = [
  { value: 'c_suite', label: 'C-Level (CEO, CTO, CFO...)' },
  { value: 'vp', label: 'VP / Vice President' },
  { value: 'director', label: 'Director / Bereichsleiter' },
  { value: 'head', label: 'Head of / Abteilungsleiter' },
  { value: 'manager', label: 'Manager / Teamleiter' },
  { value: 'senior', label: 'Senior' },
]

const DEPARTMENT_OPTIONS = [
  'Geschäftsführung',
  'Vertrieb / Sales',
  'Marketing',
  'IT / Engineering',
  'Finanzen / Controlling',
  'Einkauf / Procurement',
  'HR / People',
  'Operations',
  'Produkt / Product',
]

const CHANNEL_OPTIONS: { value: ContactChannel; label: string; description: string }[] = [
  { value: 'email', label: 'E-Mail', description: 'Direkter E-Mail-Kontakt' },
  { value: 'linkedin', label: 'LinkedIn', description: 'LinkedIn InMail / Connect' },
  { value: 'phone', label: 'Telefon', description: 'Telefonische Kaltakquise' },
  { value: 'xing', label: 'XING', description: 'XING-Nachrichten (DACH)' },
]

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                aria-label={`${tag} entfernen`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder={placeholder}
          className="h-9 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function ContactPreferencesDialog({
  open,
  onOpenChange,
  initialPreferences,
  onConfirm,
  isPending,
}: ContactPreferencesDialogProps) {
  const [titles, setTitles] = useState<string[]>(initialPreferences?.ideal_titles ?? [])
  const [seniority, setSeniority] = useState<string[]>(initialPreferences?.ideal_seniority ?? ['c_suite', 'director', 'head'])
  const [departments, setDepartments] = useState<string[]>(initialPreferences?.ideal_departments ?? [])
  const [channels, setChannels] = useState<ContactChannel[]>(initialPreferences?.preferred_channels ?? ['email', 'linkedin'])

  function handleOpenChange(next: boolean) {
    if (next && initialPreferences) {
      setTitles(initialPreferences.ideal_titles)
      setSeniority(initialPreferences.ideal_seniority)
      setDepartments(initialPreferences.ideal_departments)
      setChannels(initialPreferences.preferred_channels)
    }
    onOpenChange(next)
  }

  function toggleSeniority(value: string, checked: boolean) {
    setSeniority((prev) => checked ? [...prev, value] : prev.filter((s) => s !== value))
  }

  function toggleDepartment(value: string, checked: boolean) {
    setDepartments((prev) => checked ? [...prev, value] : prev.filter((d) => d !== value))
  }

  function toggleChannel(value: ContactChannel, checked: boolean) {
    setChannels((prev) => checked ? [...prev, value] : prev.filter((c) => c !== value))
  }

  function handleConfirm() {
    onConfirm({
      ideal_titles: titles,
      ideal_seniority: seniority,
      ideal_departments: departments,
      preferred_channels: channels,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <DialogTitle>Ansprechpartner definieren</DialogTitle>
          </div>
          <DialogDescription>
            Beschreibe deine idealen Ansprechpartner und bevorzugten Kontakt-Kanäle.
            Das Person-Scoring wird auf Basis dieser Angaben berechnet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto py-2">
          {/* Ideale Jobtitel */}
          <div className="flex flex-col gap-1.5">
            <Label>Ideale Jobtitel</Label>
            <p className="text-xs text-muted-foreground">
              Welche Titel haben deine besten Ansprechpartner typischerweise?
            </p>
            <TagInput
              tags={titles}
              onChange={setTitles}
              placeholder="z.B. CTO, Head of Sales, Geschäftsführer..."
            />
          </div>

          {/* Seniority */}
          <div className="flex flex-col gap-1.5">
            <Label>Seniority-Level</Label>
            <p className="text-xs text-muted-foreground">
              Auf welcher Hierarchie-Ebene sitzen deine Ansprechpartner?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SENIORITY_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={seniority.includes(value)}
                    onCheckedChange={(v) => toggleSeniority(value, v === true)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Abteilungen */}
          <div className="flex flex-col gap-1.5">
            <Label>Relevante Abteilungen</Label>
            <p className="text-xs text-muted-foreground">
              In welchen Fachbereichen arbeiten deine idealen Kontakte?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENT_OPTIONS.map((dept) => (
                <label key={dept} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={departments.includes(dept)}
                    onCheckedChange={(v) => toggleDepartment(dept, v === true)}
                  />
                  {dept}
                </label>
              ))}
            </div>
          </div>

          {/* Bevorzugte Kanäle */}
          <div className="flex flex-col gap-1.5">
            <Label>Bevorzugte Kontakt-Kanäle</Label>
            <p className="text-xs text-muted-foreground">
              Wie möchtest du diese Personen ansprechen? Kanäle mit höherer Priorität
              werden im Erreichbarkeits-Score stärker gewichtet.
            </p>
            <div className="flex flex-col gap-2">
              {CHANNEL_OPTIONS.map(({ value, label, description }) => (
                <label
                  key={value}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={channels.includes(value)}
                    onCheckedChange={(v) => toggleChannel(value, v === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || channels.length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {isPending ? 'Scoring läuft...' : 'Person-Scoring starten'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
