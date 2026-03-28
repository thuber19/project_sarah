'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckSquare2, Download, Mail, Trash2, Zap } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ScoreBadge } from '@/components/leads/score-badge'

type Grade = 'HOT' | 'QUALIFIED' | 'ENGAGED' | 'POTENTIAL' | 'POOR_FIT'

interface Lead {
  id: string
  company: string
  industry: string
  location: string
  score: number
  status: Grade
  updated: string
}

const mockLeads: Lead[] = [
  { id: '1', company: 'TechVentures GmbH', industry: 'SaaS', location: 'Wien', score: 97, status: 'HOT', updated: '24.03.2026' },
  { id: '2', company: 'DataFlow AG', industry: 'Analytics', location: 'München', score: 92, status: 'HOT', updated: '22.03.2026' },
  { id: '3', company: 'AlpenTech Solutions', industry: 'IT', location: 'Zürich', score: 85, status: 'QUALIFIED', updated: '24.03.2026' },
  { id: '4', company: 'NextCloud Systems', industry: 'Cloud', location: 'Hamburg', score: 73, status: 'POTENTIAL', updated: '10.01.2026' },
  { id: '5', company: 'WindSoft GmbH', industry: 'Security', location: 'Wien', score: 68, status: 'ENGAGED', updated: '22.02.2026' },
  { id: '6', company: 'Helvetia Digital', industry: 'FinTech', location: 'Bern', score: 55, status: 'POTENTIAL', updated: '18.01.2026' },
  { id: '7', company: 'BavariaConnect', industry: 'Logistik', location: 'Nürnberg', score: 42, status: 'POOR_FIT', updated: '15.02.2026' },
]

export function LeadTable() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allSelected = selectedIds.size === mockLeads.length
  const someSelected = selectedIds.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(mockLeads.map((l) => l.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk-Action-Toolbar */}
      {selectedIds.size > 0 && (
        <div
          role="toolbar"
          aria-label="Bulk-Aktionen"
          className="flex items-center gap-3 rounded-lg border border-accent bg-accent-light px-4 py-2.5"
        >
          <span className="text-sm font-semibold text-accent">
            {selectedIds.size} {selectedIds.size === 1 ? 'Lead' : 'Leads'} ausgewählt
          </span>
          <div className="mx-2 h-4 w-px bg-border" />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
          >
            <Zap className="h-3.5 w-3.5" />
            Scoring starten
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Mail className="h-3.5 w-3.5" />
            Als kontaktiert markieren
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            Exportieren
          </button>
          <button
            type="button"
            className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Auswahl aufheben"
          >
            <CheckSquare2 className="h-3.5 w-3.5" />
            Aufheben
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky top-0 z-10 w-12 bg-white">
                  <Checkbox
                    aria-label="Alle auswählen"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Unternehmen
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Branche
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Standort
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Score
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="sticky top-0 z-10 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Aktualisiert
                </TableHead>
                <TableHead className="sticky top-0 z-10 w-12 bg-white text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {/* Actions */}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className={selectedIds.has(lead.id) ? 'bg-accent-light/40 hover:bg-accent-light/60' : 'hover:bg-muted/50'}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`${lead.company} auswählen`}
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={() => toggleOne(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-foreground hover:text-accent hover:underline"
                    >
                      {lead.company}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.industry}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.location}</TableCell>
                  <TableCell>
                    <span className="text-base font-bold">{lead.score}</span>
                  </TableCell>
                  <TableCell>
                    <ScoreBadge grade={lead.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.updated}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Aktionen für ${lead.company}`}
                    >
                      ...
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
