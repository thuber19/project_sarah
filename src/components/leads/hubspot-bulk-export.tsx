'use client'

import { useState, useTransition } from 'react'
import { Upload, Loader2, Check } from 'lucide-react'
import { bulkExportToHubSpotAction } from '@/app/actions/hubspot.actions'
import { toast } from 'sonner'

interface HubSpotBulkExportProps {
  /** Fetches qualified lead IDs server-side and passes them */
  qualifiedLeadIds: string[]
}

export function HubSpotBulkExport({ qualifiedLeadIds }: HubSpotBulkExportProps) {
  const [isPending, startTransition] = useTransition()
  const [exported, setExported] = useState(false)

  if (qualifiedLeadIds.length === 0) return null

  function handleBulkExport() {
    startTransition(async () => {
      const result = await bulkExportToHubSpotAction({ leadIds: qualifiedLeadIds })
      if (result.success) {
        setExported(true)
        toast.success(`${result.data.exported} Leads nach HubSpot exportiert${result.data.failed > 0 ? `, ${result.data.failed} fehlgeschlagen` : ''}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleBulkExport}
      disabled={isPending || exported}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : exported ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {exported ? 'Exportiert' : `HubSpot Export (${qualifiedLeadIds.length})`}
    </button>
  )
}
