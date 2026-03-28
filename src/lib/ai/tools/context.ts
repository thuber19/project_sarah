import type { SupabaseClient } from '@supabase/supabase-js'
import type { AgentLog } from '@/types/database'

export interface ToolContext {
  supabase: SupabaseClient
  userId: string
}

type ActionType = AgentLog['action_type']

/**
 * Logs an agent action to the agent_logs table. Non-throwing — errors are logged to console.
 */
export async function logToolAction(
  ctx: ToolContext,
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
    console.error('[ToolLog] Failed to log action:', error.message)
  }
}
