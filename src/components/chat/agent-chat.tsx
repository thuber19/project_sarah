'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { Bot, CheckCircle, Loader2, MessageCircle, Send, X, XCircle } from 'lucide-react'

const TOOL_LABELS: Record<string, string> = {
  searchLeads: 'Lead-Suche via Apollo.io',
  enrichLead: 'Lead-Enrichment',
  scoreLead: 'Lead-Scoring',
  analyzeWebsite: 'Website-Analyse',
  getIcpProfile: 'ICP-Profil laden',
  getLeadDetails: 'Lead-Details laden',
}

interface ToolPart {
  toolName: string
  state: 'call' | 'result' | 'partial-call'
  result?: unknown
}

function extractToolParts(msg: UIMessage): ToolPart[] {
  const parts: ToolPart[] = []
  for (const part of msg.parts) {
    if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
      const p = part as unknown as { toolName?: string; state?: string; result?: unknown }
      parts.push({
        toolName: p.toolName ?? part.type.replace('tool-', ''),
        state: (p.state as ToolPart['state']) ?? 'result',
        result: p.result,
      })
    }
  }
  return parts
}

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, status, sendMessage, stop } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (error: Error) => {
      console.error('[Chat] Stream error:', error.message)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('message') as HTMLInputElement
    const text = input.value.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    input.value = ''
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Chat mit Sarah öffnen"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent" />
          <span className="text-sm font-semibold text-white">Sarah</span>
          {isLoading && (
            <span className="flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Live
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Chat schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Bot className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Hallo! Ich bin Sarah.</p>
            <p className="text-xs text-muted-foreground">
              Frag mich nach Leads, Unternehmen oder Scoring.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent px-3 py-2 text-sm text-white">
                  {msg.parts
                    .filter((p) => p.type === 'text')
                    .map((p, i) => (
                      <span key={i}>{'text' in p ? (p as { text: string }).text : ''}</span>
                    ))}
                </div>
              </div>
            )
          }

          if (msg.role === 'assistant') {
            const toolParts = extractToolParts(msg)
            const textParts = msg.parts.filter((p) => p.type === 'text')

            return (
              <div key={msg.id} className="flex flex-col gap-1.5">
                {/* Tool calls */}
                {toolParts.length > 0 && (
                  <div className="flex flex-col gap-1 rounded-xl bg-muted px-3 py-2">
                    {toolParts.map((t, i) => {
                      const isComplete = t.state === 'result'
                      const isFailed =
                        isComplete &&
                        typeof t.result === 'object' &&
                        t.result !== null &&
                        'success' in t.result &&
                        !(t.result as Record<string, unknown>).success

                      return (
                        <div key={`${t.toolName}-${i}`} className="flex items-center gap-2 py-0.5">
                          {!isComplete ? (
                            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-accent" />
                          ) : isFailed ? (
                            <XCircle className="h-3 w-3 shrink-0 text-destructive" />
                          ) : (
                            <CheckCircle className="h-3 w-3 shrink-0 text-success" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {TOOL_LABELS[t.toolName] ?? t.toolName}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Text response */}
                {textParts.length > 0 && (
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm text-foreground">
                    {textParts.map((p, i) => (
                      <span key={i} className="whitespace-pre-wrap">
                        {'text' in p ? (p as { text: string }).text : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return null
        })}

        {/* Streaming indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-2 px-1">
            <Loader2 className="h-3 w-3 animate-spin text-accent" />
            <span className="text-xs text-muted-foreground">Sarah denkt nach...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-3 py-3"
      >
        <input
          ref={inputRef}
          name="message"
          type="text"
          placeholder="Nachricht an Sarah..."
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Nachricht eingeben"
          autoComplete="off"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            aria-label="Abbrechen"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent/90"
            aria-label="Senden"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  )
}
