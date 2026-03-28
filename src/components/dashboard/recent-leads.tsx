import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'

interface RecentLead {
  lead_id: string
  total_score: number
  grade: Grade
  leads: {
    company_name: string | null
    first_name: string | null
    last_name: string | null
  }
}

interface RecentLeadsProps {
  leads: RecentLead[]
}

function getDisplayName(lead: RecentLead): string {
  const { company_name, first_name, last_name } = lead.leads
  if (company_name) return company_name
  const name = [first_name, last_name].filter(Boolean).join(' ')
  return name || 'Unbekannter Lead'
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <div className="rounded-[--radius-card] border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">Neueste Leads</span>
        <Link
          href="/leads"
          className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Alle anzeigen
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-col">
        {leads.map((lead, index) => {
          const isLast = index === leads.length - 1
          return (
            <Link
              key={lead.lead_id}
              href={`/leads/${lead.lead_id}`}
              className={`flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted ${
                !isLast ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {getDisplayName(lead)}
                </p>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  KI-Analyse verfügbar
                </span>
              </div>
              <ScoreBadge grade={lead.grade} className="shrink-0" />
              <span className="w-10 shrink-0 text-right text-sm font-semibold text-foreground">
                {lead.total_score}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
