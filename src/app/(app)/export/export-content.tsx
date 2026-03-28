'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Link2, Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/leads/score-badge'
import { Button } from '@/components/ui/button'
import { exportLeadsAction } from '@/app/actions/export.actions'

type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR'

interface ExportContentProps {
  totalLeads: number
  scoredLeads: number
  gradeCounts: Record<Grade, number>
}

const gradeOrder: Grade[] = ['HOT', 'QUALIFIED', 'ENGAGED', 'POTENTIAL', 'POOR']

export function ExportContent({ totalLeads, scoredLeads, gradeCounts }: ExportContentProps) {
  const [isExporting, setIsExporting] = useState(false)

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

  async function handleExport(grade?: Grade) {
    setIsExporting(true)
    try {
      const result = await exportLeadsAction(grade ? { grade } : {})
      if (!result.success) {
        toast.error(result.error.message)
        return
      }

      // Trigger browser download
      const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`${result.data.rowCount} Leads exportiert`)
    } catch {
      toast.error('Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Export &amp; CRM</h1>
          <p className="text-sm text-muted-foreground">
            Exportiere deine Leads als CSV oder verbinde dein CRM
          </p>
        </div>
        <Button className="gap-2" onClick={() => handleExport()} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {isExporting ? 'Exportiert...' : 'Alle Leads exportieren'}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
          <p className="text-sm text-muted-foreground">Leads gesamt</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-2xl font-bold text-foreground">{scoredLeads}</p>
          <p className="text-sm text-muted-foreground">Bewertete Leads</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <p className="text-2xl font-bold text-foreground">{totalLeads - scoredLeads}</p>
          <p className="text-sm text-muted-foreground">Unbewertete Leads</p>
        </div>
      </div>

      {/* Grade distribution + filtered export */}
      {scoredLeads > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-base font-semibold text-foreground">Export nach Score-Kategorie</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Exportiere Leads gefiltert nach Score-Bewertung
          </p>

          <div className="flex flex-col gap-3">
            {gradeOrder.map((grade) => {
              const count = gradeCounts[grade]
              return (
                <div
                  key={grade}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <ScoreBadge grade={grade} />
                    <span className="text-sm text-muted-foreground">
                      {count} {count === 1 ? 'Lead' : 'Leads'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
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
      <div className="rounded-xl border border-dashed border-border bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-lg font-bold text-orange-500">
            H
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">HubSpot CRM Integration</h2>
            <p className="text-sm text-muted-foreground">Demnächst verfügbar</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Link2 className="size-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Synchronisiere Leads automatisch mit HubSpot. Diese Funktion wird bald freigeschaltet.
          </p>
        </div>
      </div>
    </div>
  )
}
