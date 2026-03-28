'use client'

import Link from 'next/link'
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

export interface LeadRow {
  id: string
  company: string
  industry: string
  location: string
  score: number
  status: Grade
  updated: string
}

interface LeadTableProps {
  leads?: LeadRow[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

const mockLeads: LeadRow[] = [
  { id: '1', company: 'TechVentures GmbH', industry: 'SaaS', location: 'Wien', score: 97, status: 'HOT', updated: '24.03.2026' },
  { id: '2', company: 'DataFlow AG', industry: 'Analytics', location: 'München', score: 92, status: 'HOT', updated: '22.03.2026' },
  { id: '3', company: 'AlpenTech Solutions', industry: 'IT', location: 'Zürich', score: 85, status: 'QUALIFIED', updated: '24.03.2026' },
  { id: '4', company: 'NextCloud Systems', industry: 'Cloud', location: 'Hamburg', score: 73, status: 'POTENTIAL', updated: '10.01.2026' },
  { id: '5', company: 'WindSoft GmbH', industry: 'Security', location: 'Wien', score: 68, status: 'ENGAGED', updated: '22.02.2026' },
  { id: '6', company: 'Helvetia Digital', industry: 'FinTech', location: 'Bern', score: 55, status: 'POTENTIAL', updated: '18.01.2026' },
  { id: '7', company: 'BavariaConnect', industry: 'Logistik', location: 'Nürnberg', score: 42, status: 'POOR_FIT', updated: '15.02.2026' },
]

export function LeadTable({ leads, selectedIds, onSelectionChange }: LeadTableProps) {
  const data = leads ?? mockLeads

  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0 && !allSelected

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map((l) => l.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-white md:block">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((lead) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Mobile select all */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
          <Checkbox
            aria-label="Alle auswählen"
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
          </span>
          {selectedIds.size > 0 && (
            <span className="ml-auto text-xs font-medium text-accent">
              {selectedIds.size} ausgewählt
            </span>
          )}
        </div>

        {data.map((lead) => {
          const isSelected = selectedIds.has(lead.id)
          return (
            <div
              key={lead.id}
              className={`flex items-start gap-3 rounded-xl border bg-white p-4 ${
                isSelected ? 'border-accent bg-accent-light/30' : 'border-border'
              }`}
            >
              <Checkbox
                aria-label={`${lead.company} auswählen`}
                checked={isSelected}
                onCheckedChange={() => toggleOne(lead.id)}
                className="mt-0.5"
              />
              <Link href={`/leads/${lead.id}`} className="flex flex-1 flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{lead.company}</span>
                  <ScoreBadge grade={lead.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{lead.industry}</span>
                  <span>·</span>
                  <span>{lead.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{lead.score}</span>
                  <span className="text-xs text-muted-foreground">{lead.updated}</span>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
