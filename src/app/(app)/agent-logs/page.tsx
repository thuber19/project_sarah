'use client'

import { useState } from 'react'
import { AlertCircle, Bell, Compass, Loader2, Search, Sparkles, Target } from 'lucide-react'
import { useAgentLogs } from '@/hooks/use-agent-logs'
import type { AgentLog } from '@/types/database'

type LogCategory = 'Alle' | 'Discovery' | 'Scoring' | 'Enrichment' | 'Errors'

function categorize(actionType: AgentLog['action_type']): LogCategory {
  switch (actionType) {
    case 'leads_discovered':
    case 'campaign_started':
    case 'campaign_completed':
    case 'query_optimized':
      return 'Discovery'
    case 'lead_scored':
      return 'Scoring'
    case 'website_scraped':
    case 'website_analyzed':
      return 'Enrichment'
    case 'campaign_failed':
      return 'Errors'
    default:
      return 'Discovery'
  }
}

const filterTabs: LogCategory[] = ['Alle', 'Discovery', 'Scoring', 'Enrichment', 'Errors']

function getEventIcon(category: LogCategory) {
  const configs: Record<Exclude<LogCategory, 'Alle'>, { icon: React.ElementType; bg: string; color: string }> = {
    Discovery: { icon: Compass, bg: 'bg-blue-50', color: 'text-accent' },
    Scoring: { icon: Target, bg: 'bg-green-50', color: 'text-success' },
    Enrichment: { icon: Sparkles, bg: 'bg-yellow-50', color: 'text-warning' },
    Errors: { icon: AlertCircle, bg: 'bg-red-50', color: 'text-destructive' },
  }
  const config = configs[category === 'Alle' ? 'Discovery' : category]
  const Icon = config.icon
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
    </div>
  )
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatLastAction(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tag(en)`
}

export default function AgentLogsPage() {
  const [activeFilter, setActiveFilter] = useState<LogCategory>('Alle')
  const [searchQuery, setSearchQuery] = useState('')
  const { logs, isLoading, stats } = useAgentLogs({ limit: 100 })

  const currentStats = stats()

  const filteredLogs = logs.filter((log) => {
    const category = categorize(log.action_type)
    const matchesFilter = activeFilter === 'Alle' || category === activeFilter
    const matchesSearch = !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Agent-Aktivitäten</span>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Suchen"
            />
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-white p-5">
            <span className="text-sm text-muted-foreground">Aktionen heute</span>
            <p className="mt-1 text-3xl font-bold text-foreground">{currentStats.todayCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <span className="text-sm text-muted-foreground">Erfolgsrate</span>
            <p className="mt-1 text-3xl font-bold text-success">{currentStats.successRate}%</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5">
            <span className="text-sm text-muted-foreground">Letzte Aktion</span>
            <p className="mt-1 text-3xl font-bold text-foreground">{formatLastAction(currentStats.lastAction)}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Activity timeline */}
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Keine Aktivitäten gefunden</p>
            ) : (
              filteredLogs.map((log, index) => {
                const category = categorize(log.action_type)
                const isFailed = log.action_type === 'campaign_failed'

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-6 py-4 ${
                      index < filteredLogs.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <span className="w-[72px] shrink-0 pt-0.5 text-xs text-muted-foreground">
                      {formatTime(log.created_at)}
                    </span>
                    {getEventIcon(category)}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{log.message}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium ${isFailed ? 'text-destructive' : 'text-success'}`}>
                      {isFailed ? 'Fehler' : 'Erfolg'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
