'use client'

import { Target, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface LeadBulkToolbarProps {
  selectedCount: number
  onScore: () => void
  onExport: () => void
  onDelete: () => void
  onClearSelection: () => void
}

export function LeadBulkToolbar({
  selectedCount,
  onScore,
  onExport,
  onDelete,
  onClearSelection,
}: LeadBulkToolbarProps) {
  if (selectedCount <= 0) return null

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2.5 shadow-sm"
      role="toolbar"
      aria-label="Aktionen fur ausgewahlte Leads"
    >
      <div className="flex items-center gap-3">
        <label className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center">
          <Checkbox
            checked
            onCheckedChange={() => onClearSelection()}
            aria-label="Auswahl aufheben"
          />
        </label>
        <span className="text-sm font-medium">
          {selectedCount} ausgewahlt
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onScore}
          className="min-h-12 min-w-12 gap-2 sm:px-3"
          aria-label="Ausgewahlte Leads bewerten"
        >
          <Target className="size-4" />
          <span className="hidden sm:inline">Bewerten</span>
        </Button>
        <Button
          variant="outline"
          onClick={onExport}
          className="min-h-12 min-w-12 gap-2 sm:px-3"
          aria-label="Ausgewahlte Leads exportieren"
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Exportieren</span>
        </Button>
        <Button
          variant="destructive"
          onClick={onDelete}
          className="min-h-12 min-w-12 gap-2 sm:px-3"
          aria-label="Ausgewahlte Leads loschen"
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Loschen</span>
        </Button>
      </div>
    </div>
  )
}

export type { LeadBulkToolbarProps }
