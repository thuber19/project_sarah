import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import {
  createConversationAction,
  listConversationsAction,
  getConversationMessagesAction,
  deleteConversationAction,
  saveMessageAction,
} from './conversations.actions'
import { requireAuth } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_USER = { id: 'user-123', email: 'test@example.com' }
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

/**
 * Build a chainable mock that mirrors the Supabase PostgREST query builder.
 *
 * Every method returns `this` (chainable). Terminal methods like `.single()`
 * resolve with `{ data, error }`.
 */
function createMockQuery(data: unknown = null, error: null | { message: string } = null) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {}
  query.select = vi.fn().mockReturnValue(query)
  query.insert = vi.fn().mockReturnValue(query)
  query.update = vi.fn().mockReturnValue(query)
  query.delete = vi.fn().mockReturnValue(query)
  query.eq = vi.fn().mockReturnValue(query)
  query.order = vi.fn().mockReturnValue(query)
  query.limit = vi.fn().mockReturnValue(query)
  query.single = vi.fn().mockResolvedValue({ data, error })
  // Make the builder thenable so `await query` (without .single()) works
  query.then = vi.fn((resolve: (val: unknown) => void) =>
    Promise.resolve({ data, error }).then(resolve),
  )
  return query
}

function createMockSupabase(data: unknown = null, error: null | { message: string } = null) {
  const query = createMockQuery(data, error)
  return {
    supabase: { from: vi.fn().mockReturnValue(query) },
    query,
  }
}

function mockAuth(data: unknown = null, error: null | { message: string } = null) {
  const { supabase, query } = createMockSupabase(data, error)
  vi.mocked(requireAuth).mockResolvedValue({
    user: TEST_USER as never,
    supabase: supabase as never,
  })
  return { supabase, query }
}

/**
 * Helper for saveMessageAction: we need two different tables to return
 * different results (agent_messages insert + agent_conversations update).
 */
function mockAuthMultiTable(
  insertData: unknown = null,
  insertError: null | { message: string } = null,
  updateError: null | { message: string } = null,
) {
  const messagesQuery = createMockQuery(insertData, insertError)
  const conversationsQuery = createMockQuery(null, updateError)

  const fromMock = vi.fn((table: string) => {
    if (table === 'agent_messages') return messagesQuery
    if (table === 'agent_conversations') return conversationsQuery
    return createMockQuery()
  })

  const supabase = { from: fromMock }
  vi.mocked(requireAuth).mockResolvedValue({
    user: TEST_USER as never,
    supabase: supabase as never,
  })
  return { supabase, messagesQuery, conversationsQuery }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('conversations.actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // createConversationAction
  // =========================================================================

  describe('createConversationAction', () => {
    it('should create a conversation with a custom title', async () => {
      const mockConversation = {
        id: VALID_UUID,
        user_id: TEST_USER.id,
        title: 'Mein Gespräch',
        model: null,
        metadata: null,
        created_at: '2026-03-28T10:00:00Z',
        updated_at: '2026-03-28T10:00:00Z',
      }
      const { supabase, query } = mockAuth(mockConversation)

      const result = await createConversationAction('Mein Gespräch')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual(mockConversation)
      expect(supabase.from).toHaveBeenCalledWith('agent_conversations')
      expect(query.insert).toHaveBeenCalledWith({
        user_id: TEST_USER.id,
        title: 'Mein Gespräch',
      })
      expect(query.select).toHaveBeenCalled()
      expect(query.single).toHaveBeenCalled()
    })

    it('should create a conversation with default title when no title provided', async () => {
      const mockConversation = {
        id: VALID_UUID,
        user_id: TEST_USER.id,
        title: 'Neues Gespräch',
        model: null,
        metadata: null,
        created_at: '2026-03-28T10:00:00Z',
        updated_at: '2026-03-28T10:00:00Z',
      }
      const { query } = mockAuth(mockConversation)

      const result = await createConversationAction()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.title).toBe('Neues Gespräch')
      expect(query.insert).toHaveBeenCalledWith({
        user_id: TEST_USER.id,
        title: 'Neues Gespräch',
      })
    })

    it('should return INTERNAL_ERROR when database insert fails', async () => {
      mockAuth(null, { message: 'insert failed' })

      const result = await createConversationAction('Test')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('Gespräch konnte nicht erstellt werden')
    })

    it('should call requireAuth before any DB operation', async () => {
      mockAuth({ id: VALID_UUID, user_id: TEST_USER.id, title: 'Test' })

      await createConversationAction('Test')

      expect(requireAuth).toHaveBeenCalledOnce()
    })
  })

  // =========================================================================
  // listConversationsAction
  // =========================================================================

  describe('listConversationsAction', () => {
    it('should return sorted conversations', async () => {
      const mockConversations = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          user_id: TEST_USER.id,
          title: 'Gespräch 2',
          model: null,
          metadata: null,
          created_at: '2026-03-28T12:00:00Z',
          updated_at: '2026-03-28T12:00:00Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          user_id: TEST_USER.id,
          title: 'Gespräch 1',
          model: null,
          metadata: null,
          created_at: '2026-03-28T10:00:00Z',
          updated_at: '2026-03-28T10:00:00Z',
        },
      ]
      const { supabase, query } = mockAuth(mockConversations)

      const result = await listConversationsAction()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual(mockConversations)
      expect(supabase.from).toHaveBeenCalledWith('agent_conversations')
      expect(query.select).toHaveBeenCalledWith(
        'id, user_id, title, model, metadata, created_at, updated_at',
      )
      expect(query.eq).toHaveBeenCalledWith('user_id', TEST_USER.id)
      expect(query.order).toHaveBeenCalledWith('updated_at', { ascending: false })
      expect(query.limit).toHaveBeenCalledWith(50)
    })

    it('should return empty array when no conversations exist', async () => {
      mockAuth([])

      const result = await listConversationsAction()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual([])
    })

    it('should return empty array when data is null', async () => {
      mockAuth(null)

      const result = await listConversationsAction()

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual([])
    })

    it('should return INTERNAL_ERROR when database query fails', async () => {
      mockAuth(null, { message: 'query failed' })

      const result = await listConversationsAction()

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('Gespräche konnten nicht geladen werden')
    })
  })

  // =========================================================================
  // getConversationMessagesAction
  // =========================================================================

  describe('getConversationMessagesAction', () => {
    it('should return messages ordered by created_at', async () => {
      const mockMessages = [
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          conversation_id: VALID_UUID,
          user_id: TEST_USER.id,
          role: 'user',
          content: 'Hallo',
          parts: null,
          tool_invocations: null,
          created_at: '2026-03-28T10:00:00Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          conversation_id: VALID_UUID,
          user_id: TEST_USER.id,
          role: 'assistant',
          content: 'Wie kann ich helfen?',
          parts: null,
          tool_invocations: null,
          created_at: '2026-03-28T10:01:00Z',
        },
      ]
      const { supabase, query } = mockAuth(mockMessages)

      const result = await getConversationMessagesAction(VALID_UUID)

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual(mockMessages)
      expect(supabase.from).toHaveBeenCalledWith('agent_messages')
      expect(query.select).toHaveBeenCalledWith(
        'id, conversation_id, user_id, role, content, parts, tool_invocations, created_at',
      )
      expect(query.eq).toHaveBeenCalledWith('conversation_id', VALID_UUID)
      expect(query.eq).toHaveBeenCalledWith('user_id', TEST_USER.id)
      expect(query.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('should return VALIDATION_ERROR for invalid UUID', async () => {
      mockAuth()

      const result = await getConversationMessagesAction('not-a-uuid')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Gesprächs-ID')
    })

    it('should return VALIDATION_ERROR for empty string', async () => {
      mockAuth()

      const result = await getConversationMessagesAction('')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return empty array when no messages exist', async () => {
      mockAuth([])

      const result = await getConversationMessagesAction(VALID_UUID)

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual([])
    })

    it('should return empty array when data is null', async () => {
      mockAuth(null)

      const result = await getConversationMessagesAction(VALID_UUID)

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual([])
    })

    it('should return INTERNAL_ERROR when database query fails', async () => {
      mockAuth(null, { message: 'query failed' })

      const result = await getConversationMessagesAction(VALID_UUID)

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('Nachrichten konnten nicht geladen werden')
    })
  })

  // =========================================================================
  // deleteConversationAction
  // =========================================================================

  describe('deleteConversationAction', () => {
    it('should delete a conversation successfully', async () => {
      const { supabase, query } = mockAuth()
      // Override .then for delete path (no error)
      query.then.mockImplementation((resolve: (val: unknown) => void) =>
        Promise.resolve({ error: null }).then(resolve),
      )

      const result = await deleteConversationAction(VALID_UUID)

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('agent_conversations')
      expect(query.delete).toHaveBeenCalled()
      expect(query.eq).toHaveBeenCalledWith('id', VALID_UUID)
      expect(query.eq).toHaveBeenCalledWith('user_id', TEST_USER.id)
    })

    it('should return VALIDATION_ERROR for invalid UUID', async () => {
      mockAuth()

      const result = await deleteConversationAction('not-a-uuid')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Gesprächs-ID')
    })

    it('should return VALIDATION_ERROR for empty string', async () => {
      mockAuth()

      const result = await deleteConversationAction('')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return INTERNAL_ERROR when database delete fails', async () => {
      const { query } = mockAuth()
      query.then.mockImplementation((resolve: (val: unknown) => void) =>
        Promise.resolve({ error: { message: 'delete failed' } }).then(resolve),
      )

      const result = await deleteConversationAction(VALID_UUID)

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('Gespräch konnte nicht gelöscht werden')
    })
  })

  // =========================================================================
  // saveMessageAction
  // =========================================================================

  describe('saveMessageAction', () => {
    it('should save a message and update conversation timestamp', async () => {
      const mockMessage = {
        id: '550e8400-e29b-41d4-a716-446655440020',
        conversation_id: VALID_UUID,
        user_id: TEST_USER.id,
        role: 'user',
        content: 'Hallo, wie geht es?',
        tool_invocations: null,
        created_at: '2026-03-28T10:00:00Z',
      }
      const { supabase, messagesQuery, conversationsQuery } = mockAuthMultiTable(mockMessage)

      const result = await saveMessageAction(VALID_UUID, 'user', 'Hallo, wie geht es?')

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual(mockMessage)

      // Verify message insert
      expect(supabase.from).toHaveBeenCalledWith('agent_messages')
      expect(messagesQuery.insert).toHaveBeenCalledWith({
        conversation_id: VALID_UUID,
        user_id: TEST_USER.id,
        role: 'user',
        content: 'Hallo, wie geht es?',
        tool_invocations: null,
      })
      expect(messagesQuery.select).toHaveBeenCalled()
      expect(messagesQuery.single).toHaveBeenCalled()

      // Verify conversation timestamp update
      expect(supabase.from).toHaveBeenCalledWith('agent_conversations')
      expect(conversationsQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ updated_at: expect.any(String) }),
      )
      expect(conversationsQuery.eq).toHaveBeenCalledWith('id', VALID_UUID)
    })

    it('should save a message with tool invocations', async () => {
      const toolInvocations = [{ toolName: 'search', args: { query: 'test' } }]
      const mockMessage = {
        id: '550e8400-e29b-41d4-a716-446655440021',
        conversation_id: VALID_UUID,
        user_id: TEST_USER.id,
        role: 'assistant',
        content: 'Hier sind die Ergebnisse',
        tool_invocations: toolInvocations,
        created_at: '2026-03-28T10:01:00Z',
      }
      const { messagesQuery } = mockAuthMultiTable(mockMessage)

      const result = await saveMessageAction(
        VALID_UUID,
        'assistant',
        'Hier sind die Ergebnisse',
        toolInvocations,
      )

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual(mockMessage)
      expect(messagesQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          tool_invocations: toolInvocations,
        }),
      )
    })

    it('should return VALIDATION_ERROR for invalid conversationId', async () => {
      mockAuth()

      const result = await saveMessageAction('not-a-uuid', 'user', 'Hello')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Nachricht')
    })

    it('should return VALIDATION_ERROR for empty content', async () => {
      mockAuth()

      const result = await saveMessageAction(VALID_UUID, 'user', '')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Nachricht')
    })

    it('should return VALIDATION_ERROR for invalid role', async () => {
      mockAuth()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await saveMessageAction(VALID_UUID, 'system' as any, 'Hello')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('VALIDATION_ERROR')
      expect(result.error.message).toBe('Ungültige Nachricht')
    })

    it('should return INTERNAL_ERROR when message insert fails', async () => {
      mockAuthMultiTable(null, { message: 'insert failed' })

      const result = await saveMessageAction(VALID_UUID, 'user', 'Hello')

      expect(result.success).toBe(false)
      if (result.success) throw new Error('Expected failure')
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('Nachricht konnte nicht gespeichert werden')
    })

    it('should call requireAuth before any DB operation', async () => {
      mockAuthMultiTable({
        id: VALID_UUID,
        conversation_id: VALID_UUID,
        user_id: TEST_USER.id,
        role: 'user',
        content: 'Test',
      })

      await saveMessageAction(VALID_UUID, 'user', 'Test')

      expect(requireAuth).toHaveBeenCalledOnce()
    })
  })
})
