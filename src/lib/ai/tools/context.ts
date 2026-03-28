import { logAgentAction, type LogContext } from '@/lib/agent-log'

export type ToolContext = LogContext

export { logAgentAction }

// Keep backward compat alias
export async function logToolAction(
  ctx: ToolContext,
  actionType: Parameters<typeof logAgentAction>[1],
  message: string,
  metadata?: Record<string, unknown>,
) {
  return logAgentAction(ctx, actionType, message, metadata)
}
