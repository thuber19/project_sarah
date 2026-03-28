'use client'

import { useCallback } from 'react'
import { Download, FileSpreadsheet, Link2, Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/leads/score-badge'
import { Button } from '@/components/ui/button'
import { exportLeadsAction } from '@/app/actions/export.actions'
import { useServerAction } from '@/hooks/use-server-action'

type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'

interface ExportContentProps {
  totalLeads: number
  scoredLeads: number
  gradeCounts: Record<Grade, number>
}

const gradeOrder: Grade[] = ['HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR']

/** Trigger a browser file download from CSV string data. */
function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ExportContent({ totalLeads, scoredLeads, gradeCounts }: ExportContentProps) {
  const { execute: executeExport, isPending: isExporting } = useServerAction(exportLeadsAction, {
    errorMessage: 'Export fehlgeschlagen',
    onSuccess: (data) => {
      triggerCsvDownload(data.csv, data.filename)
      toast.success(`${data.rowCount} Leads exportiert`)
    },
  })

  const handleExport = useCallback(
    (grade?: Grade) => {
      executeExport(grade ? { grade } : {})
    },
    [executeExport],
  )

  if (totalLeads === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState
          icon={FileSpreadsheet}
          title="Keine Leads zum Exportieren"
          description="Starte eine Discovery, um Leads zu finden. Danach kannst du sie hier als CSV exportieren."
          primaryAction={{
            label: 'Discovery starten',
            href: '/discovery',
            icon: Play,
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 lg:gap-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Export &amp; CRM</h1>
          <p className="text-sm text-muted-foreground">
            Exportiere deine Leads als CSV oder verbinde dein CRM
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={() => handleExport()} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {isExporting ? 'Exportiert...' : 'Alle Leads exportieren'}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
          <p className="text-xl font-bold text-foreground lg:text-2xl">{totalLeads}</p>
          <p className="text-xs text-muted-foreground lg:text-sm">Leads gesamt</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
          <p className="text-xl font-bold text-foreground lg:text-2xl">{scoredLeads}</p>
          <p className="text-xs text-muted-foreground lg:text-sm">Bewertete Leads</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-white p-4 lg:col-span-1 lg:p-6">
          <p className="text-xl font-bold text-foreground lg:text-2xl">{totalLeads - scoredLeads}</p>
          <p className="text-xs text-muted-foreground lg:text-sm">Unbewertete Leads</p>
        </div>
      </div>

      {/* Grade distribution + filtered export */}
      {scoredLeads > 0 && (
        <div className="rounded-xl border border-border bg-white p-4 lg:p-6">
          <h2 className="text-base font-semibold text-foreground">Export nach Score-Kategorie</h2>
          <p className="mb-4 text-sm text-muted-foreground lg:mb-6">
            Exportiere Leads gefiltert nach Score-Bewertung
          </p>

          <div className="flex flex-col gap-3">
            {gradeOrder.map((grade) => {
              const count = gradeCounts[grade]
              return (
                <div
                  key={grade}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <ScoreBadge grade={grade} />
                    <span className="text-sm text-muted-foreground">
                      {count} {count === 1 ? 'Lead' : 'Leads'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => handleExport(grade)}
                    disabled={isExporting || count === 0}
                  >
                    <Download className="size-3.5" />
                    CSV Export
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* HubSpot CRM — Coming Soon */}
      <div className="rounded-xl border border-dashed border-border bg-white p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-lg font-bold text-orange-500">
            H
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">HubSpot CRM Integration</h2>
            <p className="text-sm text-muted-foreground">Demnächst verfügbar</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <Link2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Synchronisiere Leads automatisch mit HubSpot. Diese Funktion wird bald freigeschaltet.
          </p>
        </div>
      </div>
    </div>
  )
}
