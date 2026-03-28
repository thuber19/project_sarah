'use client'

import { useTransition } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportLeadsAction } from '@/app/actions/export.actions'

interface LeadExportButtonProps {
  grade?: string
  q?: string
}

export function LeadExportButton({ grade, q }: LeadExportButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleExport() {
    startTransition(async () => {
      const result = await exportLeadsAction({
        grade: grade as 'ALL' | 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR' | undefined,
        q,
      })

      if (!result.success) {
        toast.error(result.error.message)
        return
      }

      // Trigger browser download
      const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${result.data.rowCount} Leads exportiert`)
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
