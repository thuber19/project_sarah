'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import {
  listConversationsAction,
  deleteConversationAction,
  createConversationAction,
} from '@/app/actions/conversations.actions'
import type { AgentConversation } from '@/types/database'

interface ConversationListProps {
  activeId?: string
  onSelect: (id: string) => void
  onNew: (id: string) => void
}

export function ConversationList({ activeId, onSelect, onNew }: ConversationListProps) {
  const [conversations, setConversations] = useState<AgentConversation[]>([])

  useEffect(() => {
    listConversationsAction().then((result) => {
      if (result.success) setConversations(result.data)
    })
  }, [])

  async function handleNew() {
    const result = await createConversationAction()
    if (result.success) {
      setConversations((prev) => [result.data, ...prev])
      onNew(result.data.id)
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteConversationAction(id)
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleNew}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10"
      >
        <Plus className="size-4" />
        Neues Gespräch
      </button>

      <div className="max-h-60 overflow-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer ${
              activeId === conv.id ? 'bg-accent/10 text-accent' : 'text-foreground hover:bg-muted'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(conv.id)}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label={`Gespräch "${conv.title}" löschen`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
