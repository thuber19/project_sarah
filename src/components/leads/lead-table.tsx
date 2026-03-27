import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ScoreBadge } from "@/components/leads/score-badge";

type Grade = "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR_FIT";

interface Lead {
  id: string;
  company: string;
  industry: string;
  location: string;
  score: number;
  status: Grade;
  updated: string;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    company: "TechVentures GmbH",
    industry: "SaaS",
    location: "Wien",
    score: 97,
    status: "HOT",
    updated: "24.03.2026",
  },
  {
    id: "2",
    company: "DataFlow AG",
    industry: "Analytics",
    location: "München",
    score: 92,
    status: "HOT",
    updated: "22.03.2026",
  },
  {
    id: "3",
    company: "AlpenTech Solutions",
    industry: "IT",
    location: "Zürich",
    score: 85,
    status: "QUALIFIED",
    updated: "24.03.2026",
  },
  {
    id: "4",
    company: "NextCloud Systems",
    industry: "Cloud",
    location: "Hamburg",
    score: 73,
    status: "POTENTIAL",
    updated: "10.01.2026",
  },
  {
    id: "5",
    company: "WindSoft GmbH",
    industry: "Security",
    location: "Wien",
    score: 68,
    status: "ENGAGED",
    updated: "22.02.2026",
  },
  {
    id: "6",
    company: "Helvetia Digital",
    industry: "FinTech",
    location: "Bern",
    score: 55,
    status: "POTENTIAL",
    updated: "18.01.2026",
  },
  {
    id: "7",
    company: "BavariaConnect",
    industry: "Logistik",
    location: "Nürnberg",
    score: 42,
    status: "POOR_FIT",
    updated: "15.02.2026",
  },
];

export function LeadTable() {
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
              Aktualisiert
            </TableHead>
            <TableHead className="w-12 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {/* Actions */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockLeads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/50">
              <TableCell>
                <Checkbox aria-label={`${lead.company} auswählen`} />
              </TableCell>
              <TableCell>
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium text-foreground hover:text-accent hover:underline"
                >
                  {lead.company}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.industry}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.location}
              </TableCell>
              <TableCell>
                <span className="text-base font-bold">{lead.score}</span>
              </TableCell>
              <TableCell>
                <ScoreBadge grade={lead.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lead.updated}
              </TableCell>
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
  );
}
