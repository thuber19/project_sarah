import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/leads/score-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

type ExportStatus = "Exportiert" | "Ausstehend" | "Fehler";
type Grade = "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR";

interface ExportEntry {
  company: string;
  score: number;
  grade: Grade;
  status: ExportStatus;
  date: string;
  hubspotId: string;
}

const mockExports: ExportEntry[] = [
  { company: "TechVentures GmbH", score: 92, grade: "HOT", status: "Exportiert", date: "27. Mär. 2026, 14:32", hubspotId: "HS-4892" },
  { company: "DataFlow AG", score: 85, grade: "QUALIFIED", status: "Exportiert", date: "27. Mär. 2026, 14:15", hubspotId: "HS-4891" },
  { company: "CloudMesh GmbH", score: 79, grade: "QUALIFIED", status: "Ausstehend", date: "27. Mär. 2026, 13:58", hubspotId: "—" },
  { company: "AlpenTech Solutions", score: 73, grade: "ENGAGED", status: "Exportiert", date: "27. Mär. 2026, 13:44", hubspotId: "HS-4890" },
  { company: "SecureApp GmbH", score: 68, grade: "ENGAGED", status: "Fehler", date: "27. Mär. 2026, 13:30", hubspotId: "—" },
];

const fieldMappings = [
  { sarah: "Firmenname", hubspot: "company" },
  { sarah: "Firmenwebsite", hubspot: "website" },
  { sarah: "Score", hubspot: "sarah_score" },
  { sarah: "Status", hubspot: "lifecyclestage" },
  { sarah: "Branche", hubspot: "industry" },
  { sarah: "E-Mail", hubspot: "email" },
];

function getStatusBadge(status: ExportStatus) {
  switch (status) {
    case "Exportiert":
      return <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-success">Exportiert</span>;
    case "Ausstehend":
      return <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-warning">Ausstehend</span>;
    case "Fehler":
      return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-destructive">Fehler</span>;
  }
}

export function ExportConnected() {
  return (
    <div className="flex flex-1 gap-6 overflow-y-auto p-8">
      {/* Left column */}
      <div className="flex flex-1 flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Export &amp; CRM</h1>
            <p className="text-sm text-muted-foreground">
              Exportiere Leads und synchronisiere mit deinem CRM
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              CSV Export
            </Button>
            <Button className="gap-2 bg-orange-500 text-white hover:bg-orange-600">
              <RefreshCw className="size-4" />
              HubSpot synchen
            </Button>
          </div>
        </div>

        {/* HubSpot Connection Card */}
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-lg font-bold text-orange-500">
                H
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">HubSpot CRM</p>
                <p className="text-xs text-muted-foreground">Verbunden seit 15. März 2026</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-success">
              <span className="size-2 rounded-full bg-success" />
              Verbunden
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-2xl font-bold text-foreground">43</p>
              <p className="text-xs text-muted-foreground">Exportierte Leads</p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-2xl font-bold text-success">38</p>
              <p className="text-xs text-muted-foreground">Erfolgreich syncs</p>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-2xl font-bold text-warning">5</p>
              <p className="text-xs text-muted-foreground">Ausstehend</p>
            </div>
          </div>
        </div>

        {/* Export Queue */}
        <div className="rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">Export-Warteschlange</h2>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Alle</button>
              <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary">Ausstehend</button>
              <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary">Exportiert</button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Unternehmen</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Score</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Exportdatum</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">HubSpot-ID</TableHead>
                <TableHead className="text-xs font-medium uppercase text-muted-foreground">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExports.map((entry) => (
                <TableRow key={entry.company}>
                  <TableCell className="text-sm font-medium text-foreground">{entry.company}</TableCell>
                  <TableCell><ScoreBadge grade={entry.grade} /></TableCell>
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.hubspotId}</TableCell>
                  <TableCell>
                    {entry.status === "Fehler" && (
                      <button type="button" className="text-xs font-medium text-accent hover:underline">Erneut</button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right column */}
      <div className="flex w-[360px] shrink-0 flex-col gap-6">
        {/* Field Mapping */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="text-base font-semibold text-foreground">Feld-Mapping</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Ordne deine Sarah-Felder den HubSpot-Properties zu
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-medium uppercase text-muted-foreground">
              <span>Sarah-Feld</span>
              <span>HubSpot-Property</span>
            </div>
            {fieldMappings.map((mapping) => (
              <div key={mapping.sarah} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{mapping.sarah}</span>
                <span className="rounded bg-secondary px-2 py-1 text-xs font-mono text-muted-foreground">
                  {mapping.hubspot}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Export Settings */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Export-Einstellungen</h2>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Auto-Export</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Min. Score</span>
              <span className="text-sm text-muted-foreground">75+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Sync-Intervall</span>
              <span className="text-sm text-muted-foreground">Alle 6h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Duplikate</span>
              <span className="text-sm text-muted-foreground">Überspringen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
