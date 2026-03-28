import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { ScoreBadge } from "@/components/leads/score-badge"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type { LeadListItem } from "@/types/lead"

type DisplayGrade = "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR_FIT"

interface LeadTableProps {
  leads: LeadListItem[]
  sort: string
  dir: string
  searchParams: string // current URL search params string for building sort links
}

function mapGrade(grade: string | null): DisplayGrade | null {
  if (!grade) return null
  if (grade === 'POOR') return 'POOR_FIT'
  return grade as DisplayGrade
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('de-AT')
}

function SortIcon({ field, currentSort, currentDir }: { field: string; currentSort: string; currentDir: string }) {
  if (currentSort !== field) {
    return (
      <>
        <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-50" />
        <span className="sr-only">, nicht sortiert</span>
      </>
    )
  }
  return currentDir === 'asc'
    ? (
      <>
        <ArrowUp className="ml-1 inline h-3 w-3" />
        <span className="sr-only">, aufsteigend sortiert</span>
      </>
    )
    : (
      <>
        <ArrowDown className="ml-1 inline h-3 w-3" />
        <span className="sr-only">, absteigend sortiert</span>
      </>
    )
}

function getAriaSortValue(field: string, currentSort: string, currentDir: string): "ascending" | "descending" | "none" {
  if (currentSort !== field) return "none"
  return currentDir === 'asc' ? "ascending" : "descending"
}

function sortHref(field: string, currentSort: string, currentDir: string, searchParams: string): string {
  const params = new URLSearchParams(searchParams)
  params.set('sort', field)
  params.set('dir', currentSort === field && currentDir === 'desc' ? 'asc' : 'desc')
  params.delete('page')
  return `/leads?${params.toString()}`
}

export function LeadTable({ leads, sort, dir, searchParams }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-12 text-center">
        <p className="text-sm text-muted-foreground">Keine Leads gefunden.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox aria-label="Alle auswählen" />
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground" aria-sort={getAriaSortValue('company_name', sort, dir)}>
              <Link href={sortHref('company_name', sort, dir, searchParams)} className="inline-flex items-center hover:text-foreground">
                Unternehmen
                <SortIcon field="company_name" currentSort={sort} currentDir={dir} />
              </Link>
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Branche
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Standort
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground" aria-sort={getAriaSortValue('total_score', sort, dir)}>
              <Link href={sortHref('total_score', sort, dir, searchParams)} className="inline-flex items-center hover:text-foreground">
                Score
                <SortIcon field="total_score" currentSort={sort} currentDir={dir} />
              </Link>
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground" aria-sort={getAriaSortValue('created_at', sort, dir)}>
              <Link href={sortHref('created_at', sort, dir, searchParams)} className="inline-flex items-center hover:text-foreground">
                Aktualisiert
                <SortIcon field="created_at" currentSort={sort} currentDir={dir} />
              </Link>
            </TableHead>
            <TableHead className="w-12 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {/* Actions */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const displayGrade = mapGrade(lead.grade)
            return (
              <TableRow key={lead.id} className="hover:bg-muted/50">
                <TableCell>
                  <Checkbox aria-label={`${lead.company_name ?? 'Lead'} auswählen`} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-foreground hover:text-accent hover:underline"
                  >
                    {lead.company_name ?? (`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || '—')}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {lead.industry ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {lead.location ?? '—'}
                </TableCell>
                <TableCell>
                  {lead.total_score != null ? (
                    <span className="text-base font-bold">{lead.total_score}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {displayGrade ? <ScoreBadge grade={displayGrade} /> : <span className="text-sm text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(lead.updated_at)}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Aktionen für ${lead.company_name ?? 'Lead'}`}
                  >
                    ...
                  </button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
