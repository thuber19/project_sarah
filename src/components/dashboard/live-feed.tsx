'use client'

import { AlertCircle, Search, Sparkles, Target, Compass, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentLogs } from '@/hooks/use-agent-logs'
import type { AgentLog } from '@/types/database'

type ActionCategory = 'discovery' | 'scoring' | 'enrichment' | 'error' | 'other'

function categorize(actionType: AgentLog['action_type']): ActionCategory {
  switch (actionType) {
    case 'leads_discovered':
    case 'campaign_started':
    case 'query_optimized':
      return 'discovery'
    case 'lead_scored':
      return 'scoring'
    case 'website_scraped':
    case 'website_analyzed':
      return 'enrichment'
    case 'campaign_failed':
      return 'error'
    case 'campaign_completed':
      return 'other'
    default:
      return 'other'
  }
}

const categoryConfig: Record<ActionCategory, { icon: React.ElementType; bg: string; color: string }> = {
  discovery: { icon: Compass, bg: 'bg-blue-50', color: 'text-accent' },
  scoring: { icon: Target, bg: 'bg-green-50', color: 'text-success' },
  enrichment: { icon: Sparkles, bg: 'bg-yellow-50', color: 'text-warning' },
  error: { icon: AlertCircle, bg: 'bg-red-50', color: 'text-destructive' },
  other: { icon: Search, bg: 'bg-gray-50', color: 'text-muted-foreground' },
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tag(en)`
}

export function LiveFeed() {
  const { logs, isLoading, isLive } = useAgentLogs({ limit: 5 })

  return (
    <div className="flex flex-1 flex-col rounded-[--radius-card] border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">Letzte Aktivitäten</span>
        <span
          className={cn(
            'rounded-lg px-2 py-0.5 text-xs font-medium',
            isLive ? 'bg-accent-light text-accent' : 'bg-muted text-muted-foreground',
          )}
        >
          {isLive ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Noch keine Aktivitäten</p>
        ) : (
          logs.map((log, index) => {
            const category = categorize(log.action_type)
            const config = categoryConfig[category]
            const Icon = config.icon
            const isLast = index === logs.length - 1

            return (
              <div
                key={log.id}
                className={cn('flex items-center gap-3 px-5 py-3', !isLast && 'border-b border-border')}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', config.bg)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{log.message}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatTime(log.created_at)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
