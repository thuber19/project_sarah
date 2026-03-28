'use client'

import { toast } from 'sonner'
import { Search } from 'lucide-react'

export function DiscoveryStartButton() {
  return (
    <button
      type="button"
      onClick={() => toast.info('Discovery wird gestartet…')}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
    >
      Discovery starten
    </button>
  )
}

export function LeadsFindButton() {
  return (
    <button
      type="button"
      onClick={() => toast.info('Suche läuft…')}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
    >
      <Search className="h-4 w-4" />
      Leads finden
    </button>
  )
}

export function AddLeadButton({ company }: { company: string }) {
  return (
    <button
      type="button"
      onClick={() => toast.success(`${company} zu Leads hinzugefügt`)}
      className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent/90"
    >
      Hinzufügen
    </button>
  )
}

export function AddAllLeadsButton() {
  return (
    <button
      type="button"
      onClick={() => toast.success('Alle Leads wurden hinzugefügt')}
      className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
    >
      Alle hinzufügen
    </button>
  )
}
