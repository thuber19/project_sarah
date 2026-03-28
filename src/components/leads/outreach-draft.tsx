'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { GeneratedContentCard } from '@/components/shared/generated-content-card'

interface OutreachDraftProps {
  leadId: string
}

type Template = 'initial_contact' | 'follow_up' | 'meeting_proposal'

const TEMPLATE_LABELS: Record<Template, string> = {
  initial_contact: 'Erstkontakt',
  follow_up: 'Follow-up',
  meeting_proposal: 'Terminvorschlag',
}

export function OutreachDraft({ leadId }: OutreachDraftProps) {
  const [template, setTemplate] = useState<Template>('initial_contact')

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/outreach/draft',
    body: { leadId, template },
    streamProtocol: 'text',
    onError: () => toast.error('E-Mail konnte nicht generiert werden'),
  })

  return (
    <GeneratedContentCard
      title="Outreach E-Mail"
      description="Generiere eine personalisierte E-Mail-Vorlage basierend auf den Lead-Daten und deinem Unternehmensprofil."
      icon={<Mail className="h-4 w-4" />}
      isLoading={isLoading}
      completion={completion || null}
      onGenerate={() => complete('')}
      generateLabel="E-Mail generieren"
      regenerateLabel="Neu generieren"
      emptyLabel="Noch keine E-Mail generiert"
    >
      {/* Template selector */}
      <div className="mb-4 flex gap-2">
        {(Object.entries(TEMPLATE_LABELS) as [Template, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTemplate(key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              template === key
                ? 'border-accent bg-accent-light text-accent'
                : 'border-border bg-white text-muted-foreground hover:bg-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </GeneratedContentCard>
  )
}
