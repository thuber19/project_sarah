'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AgentLog } from '@/types/database'

interface UseAgentLogsOptions {
  limit?: number
}

export function useAgentLogs({ limit = 50 }: UseAgentLogsOptions = {}) {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const supabaseRef = useRef(createClient())

  const latestLog = logs[0] ?? null
  const isAgentActive = latestLog
    ? !['campaign_completed', 'campaign_failed'].includes(latestLog.action_type)
    : false

  // Load historical logs
  useEffect(() => {
    const supabase = supabaseRef.current

    async function loadLogs() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('agent_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (data) {
        setLogs(data as AgentLog[])
      }
      setIsLoading(false)
    }

    loadLogs()
  }, [limit])

  // Realtime subscription
  useEffect(() => {
    const supabase = supabaseRef.current

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('agent-logs-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_logs',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newLog = payload.new as AgentLog
            setLogs((prev) => [newLog, ...prev].slice(0, limit))
          },
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED')
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = subscribe()
    return () => {
      cleanup.then((fn) => fn?.())
    }
  }, [limit])

  const stats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = logs.filter((l) => l.created_at.startsWith(today))
    const errors = todayLogs.filter((l) => l.action_type === 'campaign_failed')
    const successRate =
      todayLogs.length > 0
        ? (((todayLogs.length - errors.length) / todayLogs.length) * 100).toFixed(1)
        : '0'

    return {
      todayCount: todayLogs.length,
      successRate,
      lastAction: latestLog?.created_at ?? null,
    }
  }, [logs, latestLog])

  return { logs, isLoading, isLive, isAgentActive, stats }
}
