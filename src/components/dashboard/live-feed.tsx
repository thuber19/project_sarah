import { AlertCircle, Search, Sparkles, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActionType =
  | 'campaign_started'
  | 'campaign_completed'
  | 'campaign_failed'
  | 'leads_discovered'
  | 'lead_scored'
  | 'query_optimized'
  | 'website_scraped'
  | 'website_analyzed'

interface FeedItem {
  id: string
  action_type: ActionType
  message: string
  created_at: string
}

interface LiveFeedProps {
  items: FeedItem[]
}

const eventConfig: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  leads_discovered: { icon: Search, bg: 'bg-blue-50', color: 'text-accent' },
  lead_scored: { icon: Target, bg: 'bg-green-50', color: 'text-success' },
  campaign_completed: { icon: Sparkles, bg: 'bg-yellow-50', color: 'text-warning' },
  campaign_failed: { icon: AlertCircle, bg: 'bg-red-50', color: 'text-destructive' },
  default: { icon: Zap, bg: 'bg-zinc-50', color: 'text-muted-foreground' },
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`
  return `vor ${Math.floor(diff / 86400)} Tagen`
}

export function LiveFeed({ items }: LiveFeedProps) {
  return (
    <div className="flex flex-1 flex-col rounded-[--radius-card] border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">Letzte Aktivitäten</span>
        <span className="rounded-lg bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
          Live
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Noch keine Aktivitäten
          </div>
        ) : (
          items.map((item, index) => {
            const config = eventConfig[item.action_type] ?? eventConfig.default
            const Icon = config.icon
            const isLast = index === items.length - 1

            return (
              <div
                key={item.id}
                className={cn('flex items-center gap-3 px-5 py-3', !isLast && 'border-b border-border')}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.bg)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.message}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
