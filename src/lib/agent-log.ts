import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type ActionType = Database['public']['Tables']['agent_logs']['Insert']['action_type']

export interface LogContext {
  supabase: SupabaseClient
  userId: string
}

export async function logAgentAction(
  ctx: LogContext,
  actionType: ActionType,
  message: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await ctx.supabase.from('agent_logs').insert({
    user_id: ctx.userId,
    action_type: actionType,
    message,
    metadata: metadata ?? null,
  })

  if (error) {
    console.error('[AgentLog] Failed to log action:', error.message)
  }
}
