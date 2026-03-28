'use server'

import { requireAuth } from '@/lib/supabase/server'
import { ok, fail, type ApiResponse } from '@/lib/api-response'
import { z } from 'zod/v4'
import type { AgentConversation, AgentMessage } from '@/types/database'

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
})

const conversationIdSchema = z.string().uuid()

const saveMessageSchema = z.object({
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(50_000),
  toolInvocations: z.unknown().optional(),
})

export async function createConversationAction(
  title?: string,
): Promise<ApiResponse<AgentConversation>> {
  const { user, supabase } = await requireAuth()

  const parsed = createConversationSchema.safeParse({ title })
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Ungültige Eingabe')
  }

  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({
      user_id: user.id,
      title: parsed.data.title || 'Neues Gespräch',
    })
    .select()
    .single()

  if (error) return fail('INTERNAL_ERROR', 'Gespräch konnte nicht erstellt werden')
  return ok(data)
}

export async function listConversationsAction(): Promise<ApiResponse<AgentConversation[]>> {
  const { user, supabase } = await requireAuth()

  const { data, error } = await supabase
    .from('agent_conversations')
    .select('id, user_id, title, model, metadata, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) return fail('INTERNAL_ERROR', 'Gespräche konnten nicht geladen werden')
  return ok(data ?? [])
}

export async function getConversationMessagesAction(
  conversationId: string,
): Promise<ApiResponse<AgentMessage[]>> {
  const { user, supabase } = await requireAuth()

  const parsed = conversationIdSchema.safeParse(conversationId)
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Ungültige Gesprächs-ID')
  }

  const { data, error } = await supabase
    .from('agent_messages')
    .select('id, conversation_id, user_id, role, content, parts, tool_invocations, created_at')
    .eq('conversation_id', parsed.data)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return fail('INTERNAL_ERROR', 'Nachrichten konnten nicht geladen werden')
  return ok(data ?? [])
}

export async function deleteConversationAction(conversationId: string): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const parsed = conversationIdSchema.safeParse(conversationId)
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Ungültige Gesprächs-ID')
  }

  const { error } = await supabase
    .from('agent_conversations')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id)

  if (error) return fail('INTERNAL_ERROR', 'Gespräch konnte nicht gelöscht werden')
  return ok(null)
}

export async function saveMessageAction(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  toolInvocations?: unknown,
): Promise<ApiResponse<AgentMessage>> {
  const { user, supabase } = await requireAuth()

  const parsed = saveMessageSchema.safeParse({
    conversationId,
    role,
    content,
    toolInvocations,
  })
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'Ungültige Nachricht')
  }

  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      conversation_id: parsed.data.conversationId,
      user_id: user.id,
      role: parsed.data.role,
      content: parsed.data.content,
      tool_invocations: parsed.data.toolInvocations ?? null,
    })
    .select()
    .single()

  if (error) return fail('INTERNAL_ERROR', 'Nachricht konnte nicht gespeichert werden')

  // Update conversation timestamp
  await supabase
    .from('agent_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', parsed.data.conversationId)

  return ok(data)
}
