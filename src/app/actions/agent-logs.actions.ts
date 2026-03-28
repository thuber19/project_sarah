'use server'

import { requireAuth } from '@/lib/supabase/server'
import { ok, fail, type ApiResponse } from '@/lib/api-response'

export interface NotificationEntry {
  id: string
  message: string
  relativeTime: string
  dotColor: 'bg-success' | 'bg-accent' | 'bg-destructive'
  actionType: string
}

export interface NotificationGroup {
  label: string
  notifications: NotificationEntry[]
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  return `vor ${Math.floor(hours / 24)} Tagen`
}

function dotColor(actionType: string): NotificationEntry['dotColor'] {
  if (actionType === 'campaign_failed') return 'bg-destructive'
  if (actionType === 'lead_scored' || actionType === 'campaign_completed') return 'bg-success'
  return 'bg-accent'
}

function dateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((today.getTime() - dateDay.getTime()) / 86400000)

  if (diffDays === 0) return 'Heute'
  if (diffDays === 1) return 'Gestern'

  return date.toLocaleDateString('de-AT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function getRecentNotificationsAction(): Promise<
  ApiResponse<NotificationEntry[]>
> {
  try {
    const { supabase, user } = await requireAuth()

    const { data, error } = await supabase
      .from('agent_logs')
      .select('id, action_type, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) {
      console.error('[AgentLogs] Notifications query failed:', error)
      return fail('INTERNAL_ERROR', 'Benachrichtigungen konnten nicht geladen werden')
    }

    const notifications: NotificationEntry[] = (data ?? []).map((log) => ({
      id: log.id,
      message: log.message,
      relativeTime: relativeTime(log.created_at),
      dotColor: dotColor(log.action_type),
      actionType: log.action_type,
    }))

    return ok(notifications)
  } catch (error) {
    console.error('[AgentLogs] Notifications failed:', error)
    return fail('INTERNAL_ERROR', 'Benachrichtigungen konnten nicht geladen werden')
  }
}

export async function getGroupedNotificationsAction(): Promise<
  ApiResponse<NotificationGroup[]>
> {
  try {
    const { supabase, user } = await requireAuth()

    const { data, error } = await supabase
      .from('agent_logs')
      .select('id, action_type, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error('[AgentLogs] Grouped notifications query failed:', error)
      return fail('INTERNAL_ERROR', 'Benachrichtigungen konnten nicht geladen werden')
    }

    const entries: (NotificationEntry & { _dateKey: string })[] = (data ?? []).map(
      (log) => ({
        id: log.id,
        message: log.message,
        relativeTime: relativeTime(log.created_at),
        dotColor: dotColor(log.action_type),
        actionType: log.action_type,
        _dateKey: dateGroupLabel(log.created_at),
      }),
    )

    // Group by date label while preserving order
    const groupMap = new Map<string, NotificationEntry[]>()
    for (const { _dateKey, ...entry } of entries) {
      const existing = groupMap.get(_dateKey)
      if (existing) {
        existing.push(entry)
      } else {
        groupMap.set(_dateKey, [entry])
      }
    }

    const groups: NotificationGroup[] = Array.from(groupMap.entries()).map(
      ([label, notifications]) => ({ label, notifications }),
    )

    return ok(groups)
  } catch (error) {
    console.error('[AgentLogs] Grouped notifications failed:', error)
    return fail('INTERNAL_ERROR', 'Benachrichtigungen konnten nicht geladen werden')
  }
}

export async function markAllNotificationsReadAction(): Promise<ApiResponse<null>> {
  try {
    await requireAuth()
    // Stub: no read status column yet — always returns success
    return ok(null)
  } catch (error) {
    console.error('[AgentLogs] Mark all read failed:', error)
    return fail('INTERNAL_ERROR', 'Benachrichtigungen konnten nicht aktualisiert werden')
  }
}
