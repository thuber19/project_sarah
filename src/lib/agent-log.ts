import type { SupabaseClient } from '@supabase/supabase-js'
import type { AgentLog } from '@/types/lead'

type AgentEventType = AgentLog['event_type']

export async function logAgentEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: AgentEventType,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabase.from('agent_logs').insert({
    user_id: userId,
    event_type: eventType,
    message,
    metadata: metadata ?? null,
  })

  if (error) {
    console.error('[AgentLog] Failed to log event:', error.message)
  }
}
