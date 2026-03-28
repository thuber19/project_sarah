'use client'

import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportLeadsAction } from '@/app/actions/export.actions'
import { useServerAction } from '@/hooks/use-server-action'

interface LeadExportButtonProps {
  grade?: string
  q?: string
}

export function LeadExportButton({ grade, q }: LeadExportButtonProps) {
  const { execute: exportLeads, isPending } = useServerAction(exportLeadsAction, {
    onSuccess: (data) => {
      // Trigger browser download
      const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${data.rowCount} Leads exportiert`)
    },
  })

  function handleExport() {
    exportLeads({
      grade: grade as 'ALL' | 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR' | undefined,
      q,
    })
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export
    </button>
  )
}
