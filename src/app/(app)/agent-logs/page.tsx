import { Bot, Play } from 'lucide-react'
import { requireAuth } from '@/lib/supabase/server'
import { EmptyState } from '@/components/shared/empty-state'
import { AppTopbar } from '@/components/layout/app-topbar'
import { AgentLogsClient } from './agent-logs-client'
import type { AgentLogEntry, AgentLogsStats } from './agent-logs-client'
import type { Grade } from '@/components/leads/score-badge'

type ActionType =
  | 'campaign_started'
  | 'campaign_completed'
  | 'campaign_failed'
  | 'leads_discovered'
  | 'lead_scored'
  | 'query_optimized'
  | 'website_scraped'
  | 'website_analyzed'

function mapActionType(actionType: ActionType): AgentLogEntry['type'] {
  if (actionType === 'campaign_failed') return 'Error'
  if (actionType === 'lead_scored') return 'Scoring'
  if (actionType === 'website_scraped' || actionType === 'website_analyzed') return 'Enrichment'
  return 'Discovery'
}

function mapStatus(actionType: ActionType): AgentLogEntry['status'] {
  if (actionType === 'campaign_failed') return 'Fehler'
  if (actionType === 'campaign_started' || actionType === 'query_optimized') return 'Info'
  return 'Erfolg'
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tagen`
}

export default async function AgentLogsPage() {
  const { user, supabase } = await requireAuth()

  // Fetch last 50 agent logs for this user
  const { data: rawLogs } = await supabase
    .from('agent_logs')
    .select('id, action_type, message, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const VALID_GRADES = new Set<Grade>([
    'HOT',
    'QUALIFIED',
    'ENGAGED',
    'POTENTIAL',
    'POOR',
    'POOR_FIT',
  ])

  const logs: AgentLogEntry[] = (rawLogs ?? []).map((log) => {
    const entry: AgentLogEntry = {
      id: log.id,
      time: formatTime(log.created_at),
      type: mapActionType(log.action_type),
      message: log.message,
      status: mapStatus(log.action_type),
    }

    // Extract grade from metadata for scoring events
    if (
      log.action_type === 'lead_scored' &&
      log.metadata &&
      typeof log.metadata === 'object' &&
      !Array.isArray(log.metadata) &&
      'grade' in log.metadata &&
      typeof log.metadata.grade === 'string' &&
      VALID_GRADES.has(log.metadata.grade as Grade)
    ) {
      entry.grade = log.metadata.grade as Grade
    }

    return entry
  })

  // Calculate stats from today's entries
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayLogs = (rawLogs ?? []).filter((l) => new Date(l.created_at) >= today)
  const errorCount = todayLogs.filter((l) => l.action_type === 'campaign_failed').length
  const totalToday = todayLogs.length
  const successRate =
    totalToday > 0 ? Math.round(((totalToday - errorCount) / totalToday) * 100 * 10) / 10 : 0
  const lastActivity = rawLogs?.[0]?.created_at
    ? formatRelativeTime(rawLogs[0].created_at)
    : '\u2014'

  const stats: AgentLogsStats = { totalToday, successRate, lastActivity }
  const hasLogs = logs.length > 0

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar title="Agent-Aktivitäten" />

      {!hasLogs ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyState
            icon={Bot}
            title="Keine Agent-Aktivitäten"
            description="Sobald du eine Discovery startest, siehst du hier die Aktivitäten deiner KI-Agenten."
            primaryAction={{
              label: 'Discovery starten',
              href: '/discovery',
              icon: Play,
            }}
          />
        </div>
      ) : (
        <AgentLogsClient logs={logs} stats={stats} />
      )}
    </div>
  )
}
