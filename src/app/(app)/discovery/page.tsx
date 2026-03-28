'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Bell, CheckCircle, Loader2, Search, Square, XCircle } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'

interface ToolPart {
  type: string
  toolName: string
  state: 'call' | 'result' | 'partial-call'
  result?: unknown
}

function getToolParts(messages: UIMessage[]): ToolPart[] {
  const parts: ToolPart[] = []
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue
    for (const part of msg.parts) {
      // Tool parts have type like "tool-searchLeads" or "dynamic-tool"
      if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
        const p = part as unknown as ToolPart
        parts.push({
          type: p.type,
          toolName: 'toolName' in p ? p.toolName : part.type.replace('tool-', ''),
          state: 'state' in p ? (p.state as ToolPart['state']) : 'result',
          result: 'result' in p ? p.result : undefined,
        })
      }
    }
  }
  return parts
}

function getTextContent(messages: UIMessage[]): string {
  const assistant = messages.filter((m) => m.role === 'assistant')
  const last = assistant[assistant.length - 1]
  if (!last) return ''
  return last.parts
    .filter((p) => p.type === 'text')
    .map((p) => ('text' in p ? (p as { text: string }).text : ''))
    .join('')
}

const TOOL_LABELS: Record<string, string> = {
  searchLeads: 'Lead-Suche via Apollo.io',
  enrichLead: 'Lead-Enrichment',
  scoreLead: 'Lead-Scoring',
  analyzeWebsite: 'Website-Analyse',
  getIcpProfile: 'ICP-Profil laden',
}

export default function DiscoveryPage() {
  const formRef = useRef({
    industries: 'SaaS, FinTech, E-Commerce',
    companySize: '10-500 Mitarbeiter',
    region: 'DACH (AT, DE, CH)',
    technologies: '',
    keywords: '',
  })

  const { messages, status, stop, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: '/api/discovery/stream' }),
    onError: (error: Error) => {
      console.error('[Discovery] Stream error:', error.message)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  function handleSubmit() {
    const f = formRef.current
    sendMessage({
      text: `Starte eine Lead Discovery mit folgenden Kriterien:
- Branchen: ${f.industries}
- Unternehmensgröße: ${f.companySize}
- Region: ${f.region}
${f.technologies ? `- Technologien: ${f.technologies}` : ''}
${f.keywords ? `- Keywords: ${f.keywords}` : ''}

Nutze zuerst getIcpProfile um mein ICP zu laden, dann searchLeads um Leads zu finden. Fasse am Ende zusammen wie viele Leads gefunden wurden.`,
    })
  }

  const toolParts = getToolParts(messages)
  const textContent = getTextContent(messages)
  const hasResults = messages.some((m) => m.role === 'assistant')
  const hasLeads = toolParts.some((t) => t.toolName === 'searchLeads' && t.state === 'result')

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Lead Discovery</span>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <Square className="h-3 w-3" />
              Abbrechen
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Discovery starten
            </button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Suchen"
            />
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 gap-8 overflow-y-auto p-8">
        {/* Left column — Search criteria */}
        <div className="flex w-[320px] shrink-0 flex-col gap-6">
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">Suchkriterien</h2>
              <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                AI-gesteuert
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {([
                { id: 'branchen', label: 'Branchen', key: 'industries' as const, defaultVal: 'SaaS, FinTech, E-Commerce' },
                { id: 'unternehmensgroesse', label: 'Unternehmensgröße', key: 'companySize' as const, defaultVal: '10-500 Mitarbeiter' },
                { id: 'region', label: 'Region', key: 'region' as const, defaultVal: 'DACH (AT, DE, CH)' },
                { id: 'technologien', label: 'Technologien (Optional)', key: 'technologies' as const, defaultVal: '', placeholder: 'z.B. React, Python, AWS...' },
                { id: 'keywords', label: 'Keywords (Optional)', key: 'keywords' as const, defaultVal: '', placeholder: 'z.B. Series A, KMU, B2B...' },
              ] as const).map((field) => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label htmlFor={field.id} className="text-sm font-medium text-foreground">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type="text"
                    defaultValue={field.defaultVal}
                    onChange={(e) => { formRef.current[field.key] = e.target.value }}
                    placeholder={'placeholder' in field ? field.placeholder : undefined}
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {isLoading ? 'Suche läuft...' : 'Leads finden'}
            </button>
          </div>

          {/* Data sources */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">Datenquellen</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">A</div>
                <span className="text-sm font-medium text-foreground">Apollo.io</span>
                <span className="text-xs font-medium text-success">Aktiv</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">G</div>
                <span className="text-sm font-medium text-foreground">Google Places</span>
                <span className="text-xs font-medium text-success">Aktiv</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Results */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Agent-Aktivität</h2>
            {isLoading && (
              <span className="flex items-center gap-1.5 rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                <Loader2 className="h-3 w-3 animate-spin" /> Live
              </span>
            )}
          </div>

          {/* Tool execution timeline */}
          {toolParts.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4">
              {toolParts.map((t, i) => {
                const isComplete = t.state === 'result'
                const isFailed = isComplete && typeof t.result === 'object' && t.result !== null && 'success' in t.result && !(t.result as Record<string, unknown>).success

                return (
                  <div key={`${t.toolName}-${i}`} className="flex items-center gap-3 py-1">
                    {!isComplete ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                    ) : isFailed ? (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                    )}
                    <span className="text-sm text-foreground">
                      {TOOL_LABELS[t.toolName] ?? t.toolName}
                    </span>
                    {isComplete && !isFailed && t.toolName === 'searchLeads' && typeof t.result === 'object' && t.result !== null && 'totalResults' in t.result && (
                      <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                        {String((t.result as Record<string, unknown>).totalResults)} Ergebnisse
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Agent text response */}
          {textContent && (
            <div className="rounded-xl border border-border bg-white p-6">
              <p className="whitespace-pre-wrap text-sm text-foreground">{textContent}</p>
            </div>
          )}

          {/* Success CTA */}
          {!isLoading && hasLeads && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-white py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Discovery abgeschlossen</p>
              <Link
                href="/leads"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Zu den Leads
              </Link>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !hasResults && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white py-16">
              <Search className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Noch keine Suche gestartet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Passe die Suchkriterien an und klicke &quot;Leads finden&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
