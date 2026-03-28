'use client'

import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { GeneratedContentCard } from '@/components/shared/generated-content-card'

interface LeadResearchProps {
  leadId: string
  cachedReport?: string | null
}

export function LeadResearch({ leadId, cachedReport }: LeadResearchProps) {
  const [report, setReport] = useState(cachedReport || '')
  const [isCached, setIsCached] = useState(!!cachedReport)

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/research/stream',
    body: { leadId },
    streamProtocol: 'text',
    onFinish: (_prompt, completionText) => {
      setReport(completionText)
      setIsCached(false)
    },
    onError: () => toast.error('Research konnte nicht durchgeführt werden'),
  })

  const displayText = isLoading ? completion : report

  function handleResearch() {
    setIsCached(false)
    complete('')
  }

  return (
    <GeneratedContentCard
      title="Lead-Recherche"
      description="Klicke auf &quot;Lead recherchieren&quot; für eine detaillierte Unternehmensanalyse."
      icon={<Search className="h-4 w-4" />}
      isLoading={isLoading}
      completion={displayText || null}
      onGenerate={handleResearch}
      generateLabel="Lead recherchieren"
      regenerateLabel="Erneut recherchieren"
      emptyLabel="Noch keine Recherche durchgeführt"
    >
      {isCached && report && (
        <p className="mb-4 text-xs text-muted-foreground">
          Gespeicherter Report (max. 7 Tage alt)
        </p>
      )}
    </GeneratedContentCard>
  )
}
