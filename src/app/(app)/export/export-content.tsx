import { Link2, Download } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ExportConnected } from "./export-connected";

interface ExportContentProps {
  hasConnection: boolean;
}

export function ExportContent({ hasConnection }: ExportContentProps) {
  if (!hasConnection) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState
          icon={Link2}
          title="Kein CRM verbunden"
          description="Verbinde dein CRM, um Leads automatisch zu synchronisieren und deine Sales-Pipeline zu optimieren."
          primaryAction={{
            label: "HubSpot verbinden",
            href: "/settings?tab=integrations",
            icon: Link2,
          }}
          secondaryAction={{
            label: "CSV Export",
            href: "/export/csv",
            icon: Download,
          }}
        />
      </div>
    );
  }

  return <ExportConnected />;
}
