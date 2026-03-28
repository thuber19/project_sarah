'use client'

import { useState } from 'react'
import { AlertCircle, Compass, Sparkles, Target } from 'lucide-react'
import { ScoreBadge, type Grade } from '@/components/leads/score-badge'

type LogCategory = 'Alle' | 'Discovery' | 'Scoring' | 'Enrichment' | 'Errors'
type LogStatus = 'Erfolg' | 'Fehler' | 'Info'
type EventType = 'Discovery' | 'Scoring' | 'Enrichment' | 'Error'

export interface AgentLogEntry {
  id: string
  time: string
  type: EventType
  message: string
  status: LogStatus
  grade?: Grade
}

export interface AgentLogsStats {
  totalToday: number
  successRate: number
  lastActivity: string
}

interface AgentLogsClientProps {
  logs: AgentLogEntry[]
  stats: AgentLogsStats
}

const filterTabs: LogCategory[] = ['Alle', 'Discovery', 'Scoring', 'Enrichment', 'Errors']

function getEventIcon(type: EventType) {
  switch (type) {
    case 'Discovery':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <Compass className="h-4 w-4 text-accent" />
        </div>
      )
    case 'Scoring':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
          <Target className="h-4 w-4 text-success" />
        </div>
      )
    case 'Enrichment':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-50">
          <Sparkles className="h-4 w-4 text-warning" />
        </div>
      )
    case 'Error':
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
      )
  }
}

function getStatusBadge(status: LogStatus) {
  switch (status) {
    case 'Erfolg':
      return <span className="shrink-0 text-xs font-medium text-success">Erfolg</span>
    case 'Fehler':
      return <span className="shrink-0 text-xs font-medium text-destructive">Fehler</span>
    case 'Info':
      return <span className="shrink-0 text-xs font-medium text-accent">Info</span>
  }
}

export function AgentLogsClient({ logs, stats }: AgentLogsClientProps) {
  const [activeFilter, setActiveFilter] = useState<LogCategory>('Alle')

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'Alle') return true
    if (activeFilter === 'Errors') return log.type === 'Error'
    return log.type === activeFilter
  })

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 lg:gap-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
          <span className="text-xs text-muted-foreground lg:text-sm">Aktionen heute</span>
          <p className="mt-1 text-2xl font-bold text-foreground lg:text-3xl">{stats.totalToday}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
          <span className="text-xs text-muted-foreground lg:text-sm">Erfolgsrate</span>
          <p className="mt-1 text-2xl font-bold text-success lg:text-3xl">{stats.successRate}%</p>
        </div>
        <div className="col-span-2 rounded-xl border border-border bg-white p-4 lg:col-span-1 lg:p-5">
          <span className="text-xs text-muted-foreground lg:text-sm">Letzte Aktion</span>
          <p className="mt-1 text-2xl font-bold text-foreground lg:text-3xl">{stats.lastActivity}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`min-h-12 cursor-pointer whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors lg:min-h-0 ${
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
          {filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className={`flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-start lg:gap-4 lg:px-6 lg:py-4 ${
                index < filteredLogs.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="flex items-center gap-3 lg:contents">
                <span className="shrink-0 pt-0.5 text-xs text-muted-foreground lg:w-[72px]">
                  {log.time}
                </span>
                {getEventIcon(log.type)}
                <div className="ml-auto lg:hidden">{getStatusBadge(log.status)}</div>
              </div>

              <div className="flex flex-1 items-center gap-2">
                <p className="text-sm text-foreground">{log.message}</p>
                {log.grade && <ScoreBadge grade={log.grade} className="ml-1" />}
              </div>

              <div className="hidden lg:block">{getStatusBadge(log.status)}</div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Keine Einträge für diesen Filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
