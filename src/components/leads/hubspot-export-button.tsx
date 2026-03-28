'use client'

import { useState, useTransition } from 'react'
import { Upload, Check, Loader2 } from 'lucide-react'
import { exportLeadToHubSpotAction } from '@/app/actions/hubspot.actions'
import { toast } from 'sonner'

interface HubSpotExportButtonProps {
  leadId: string
  alreadySynced?: boolean
  syncedAt?: string | null
}

export function HubSpotExportButton({ leadId, alreadySynced, syncedAt }: HubSpotExportButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [synced, setSynced] = useState(alreadySynced ?? false)

  function handleExport() {
    startTransition(async () => {
      const result = await exportLeadToHubSpotAction({ leadId })
      if (result.success) {
        setSynced(true)
        toast.success(
          result.data.alreadyExisted
            ? 'Kontakt existiert bereits in HubSpot'
            : 'Lead erfolgreich nach HubSpot exportiert'
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  if (synced) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" />
        <span>
          In HubSpot
          {syncedAt && (
            <> · {new Date(syncedAt).toLocaleDateString('de-AT')}</>
          )}
        </span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Upload className="h-3.5 w-3.5" />
      )}
      Nach HubSpot
    </button>
  )
}
