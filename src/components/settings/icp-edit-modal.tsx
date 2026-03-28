'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
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

export interface IcpFormData {
  industries: string[]
  company_sizes: string[]
  regions: string[]
  job_titles: string[]
  seniority_levels: string[]
  tech_stack: string[]
}

interface IcpEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: IcpFormData
  onSave: (data: IcpFormData) => void
  isPending?: boolean
}

const COMPANY_SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001+',
]

const SENIORITY_OPTIONS = [
  'owner',
  'founder',
  'c_suite',
  'vp',
  'director',
  'head',
  'manager',
  'senior',
  'entry',
]

const REGION_OPTIONS = [
  'Österreich',
  'Deutschland',
  'Schweiz',
]

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }

  function handleRemove(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
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
                onClick={() => handleRemove(tag)}
                className="inline-flex items-center justify-center rounded-sm hover:text-accent/70"
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder={placeholder}
          className="h-8 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}) {
  function toggle(value: string, checked: boolean) {
    if (checked) {
      onChange([...selected, value])
    } else {
      onChange(selected.filter((s) => s !== value))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={(v) => toggle(option, v === true)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

export function IcpEditModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  isPending,
}: IcpEditModalProps) {
  const [formData, setFormData] = useState<IcpFormData>(initialData)

  // Re-sync when modal opens with new data
  function handleOpenChange(next: boolean) {
    if (next) {
      setFormData(initialData)
    }
    onOpenChange(next)
  }

  function update<K extends keyof IcpFormData>(key: K, value: IcpFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ICP bearbeiten</DialogTitle>
          <DialogDescription>
            Passe dein Ideal Customer Profile an. Änderungen gelten für künftige Suchen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto py-2">
          <TagInput
            label="Zielbranchen"
            tags={formData.industries}
            onChange={(v) => update('industries', v)}
            placeholder="z. B. SaaS, FinTech..."
          />

          <CheckboxGroup
            label="Unternehmensgröße"
            options={COMPANY_SIZE_OPTIONS}
            selected={formData.company_sizes}
            onChange={(v) => update('company_sizes', v)}
          />

          <CheckboxGroup
            label="Region"
            options={REGION_OPTIONS}
            selected={formData.regions}
            onChange={(v) => update('regions', v)}
          />

          <TagInput
            label="Jobtitel"
            tags={formData.job_titles}
            onChange={(v) => update('job_titles', v)}
            placeholder="z. B. CTO, Head of Sales..."
          />

          <CheckboxGroup
            label="Seniority"
            options={SENIORITY_OPTIONS}
            selected={formData.seniority_levels}
            onChange={(v) => update('seniority_levels', v)}
          />

          <TagInput
            label="Tech-Stack"
            tags={formData.tech_stack}
            onChange={(v) => update('tech_stack', v)}
            placeholder="z. B. React, AWS, HubSpot..."
          />
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
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {isPending ? 'Speichere...' : 'Speichern'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
