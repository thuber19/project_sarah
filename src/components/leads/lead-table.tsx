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
import type { LeadWithScore } from '@/app/actions/leads.actions'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface Props {
  leads: LeadWithScore[]
}

export function LeadTable({ leads }: Props) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white py-16 text-center">
        <p className="text-sm font-semibold text-foreground">Keine Leads gefunden</p>
        <p className="text-sm text-muted-foreground">
          Passe die Filter an oder starte eine neue Discovery.
        </p>
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
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Unternehmen
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Branche
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Standort
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Score
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hinzugefügt
            </TableHead>
            <TableHead className="w-12 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {/* Actions */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox aria-label={`${lead.company_name ?? lead.full_name} auswählen`} />
              </TableCell>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium text-foreground hover:text-accent hover:underline"
                >
                  {lead.company_name ?? lead.full_name ?? '—'}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.industry ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.location ?? '—'}
              </TableCell>
              <TableCell>
                {lead.total_score !== null ? (
                  <span className="text-base font-bold">{lead.total_score}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">–</span>
                )}
              </TableCell>
              <TableCell>
                {lead.grade ? (
                  <ScoreBadge grade={lead.grade} />
                ) : (
                  <span className="text-xs text-muted-foreground">Nicht bewertet</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(lead.created_at)}
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Aktionen für ${lead.company_name ?? lead.full_name}`}
                >
                  ...
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
