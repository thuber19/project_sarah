import { AlertCircle, Search, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "@/components/leads/score-badge";

type EventType = "lead_discovered" | "lead_scored" | "lead_enriched" | "error";

interface FeedItem {
  id: string;
  type: EventType;
  message: string;
  detail: string;
  timestamp: string;
  grade?: "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR_FIT";
}

const eventConfig: Record<
  EventType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  lead_discovered: { icon: Search, bg: "bg-blue-50", color: "text-accent" },
  lead_scored: { icon: Target, bg: "bg-green-50", color: "text-success" },
  lead_enriched: {
    icon: Sparkles,
    bg: "bg-yellow-50",
    color: "text-warning",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50",
    color: "text-destructive",
  },
};

const mockFeedItems: FeedItem[] = [
  {
    id: "1",
    type: "lead_discovered",
    message: "Neuer Lead: TechVentures GmbH – Score 97",
    detail: "vor 5 Minuten",
    timestamp: "14:23",
    grade: "HOT",
  },
  {
    id: "2",
    type: "lead_scored",
    message: "AlpinData AG auf Score 82 aktualisiert",
    detail: "vor 12 Minuten",
    timestamp: "14:16",
    grade: "QUALIFIED",
  },
  {
    id: "3",
    type: "lead_enriched",
    message: "Firmendaten angereichert: CloudNine Solutions",
    detail: "vor 25 Minuten",
    timestamp: "14:03",
  },
  {
    id: "4",
    type: "lead_discovered",
    message: "Neuer Lead: Wiener Digitalwerk GmbH – Score 71",
    detail: "vor 1 Stunde",
    timestamp: "13:28",
    grade: "ENGAGED",
  },
  {
    id: "5",
    type: "error",
    message: "Apollo API Limit erreicht – Retry in 5 Min.",
    detail: "vor 2 Stunden",
    timestamp: "12:28",
  },
];

export function LiveFeed() {
  return (
    <div className="flex flex-1 flex-col rounded-[--radius-card] border border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">
          Letzte Aktivitäten
        </span>
        <span className="rounded-lg bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
          Live
        </span>
      </div>

      {/* Feed items */}
      <div className="flex flex-1 flex-col">
        {mockFeedItems.map((item, index) => {
          const config = eventConfig[item.type];
          const Icon = config.icon;
          const isLast = index === mockFeedItems.length - 1;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3",
                !isLast && "border-b border-border",
              )}
            >
              {/* Event icon */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  config.bg,
                )}
              >
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-sm text-foreground">{item.message}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                  {item.grade && <ScoreBadge grade={item.grade} />}
                </div>
              </div>

              {/* Timestamp */}
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
