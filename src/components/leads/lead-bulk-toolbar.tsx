'use client'

import { useTransition } from 'react'
import { Download, Loader2, Trash2, Zap, X } from 'lucide-react'
import {
  bulkScoreLeadsAction,
  bulkExportLeadsAction,
  bulkDeleteLeadsAction,
} from '@/app/actions/leads.actions'
import { toast } from 'sonner'

interface LeadBulkToolbarProps {
  selectedIds: Set<string>
  onClearSelection: () => void
}

export function LeadBulkToolbar({ selectedIds, onClearSelection }: LeadBulkToolbarProps) {
  const [isPending, startTransition] = useTransition()
  const count = selectedIds.size

  if (count === 0) return null

  const leadIds = Array.from(selectedIds)

  function handleScore() {
    startTransition(async () => {
      const result = await bulkScoreLeadsAction({ leadIds })
      if (result.success) {
        toast.success(`Scoring für ${result.data.totalLeads} Leads gestartet`)
        onClearSelection()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleExport() {
    startTransition(async () => {
      const result = await bulkExportLeadsAction({ leadIds })
      if (result.success) {
        // Trigger CSV download
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sarah-leads-export-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`${result.data.count} Leads exportiert`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    if (!confirm(`${count} Lead${count !== 1 ? 's' : ''} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }
    startTransition(async () => {
      const result = await bulkDeleteLeadsAction({ leadIds })
      if (result.success) {
        toast.success(`${result.data.deleted} Leads gelöscht`)
        onClearSelection()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      role="toolbar"
      aria-label="Bulk-Aktionen"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-accent bg-accent-light px-3 py-2 md:gap-3 md:px-4 md:py-2.5"
    >
      <span className="text-sm font-semibold text-accent">
        {count} {count === 1 ? 'Lead' : 'Leads'} ausgewählt
      </span>

      <div className="mx-1 hidden h-4 w-px bg-border md:block" />

      {/* Actions */}
      <button
        type="button"
        onClick={handleScore}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Scoring starten</span>
        <span className="sm:hidden">Score</span>
      </button>

      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Exportieren</span>
        <span className="sm:hidden">CSV</span>
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 md:ml-auto"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Löschen</span>
      </button>

      <button
        type="button"
        onClick={onClearSelection}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        aria-label="Auswahl aufheben"
      >
        <X className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Aufheben</span>
      </button>
    </div>
  )
}
