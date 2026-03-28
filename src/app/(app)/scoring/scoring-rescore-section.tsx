'use client'

import { useRouter } from 'next/navigation'
import { RescoreButton } from '@/components/scoring/rescore-button'

interface ScoringRescoreSectionProps {
  leadIds: string[]
}

export function ScoringRescoreSection({ leadIds }: ScoringRescoreSectionProps) {
  const router = useRouter()

  return (
    <RescoreButton
      leadIds={leadIds}
      onComplete={() => {
        router.refresh()
      }}
    />
  )
}
