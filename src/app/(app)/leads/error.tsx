'use client'

import { ErrorCard } from '@/components/shared/error-card'

export default function SegmentError({ reset }: { reset: () => void }) {
  return <ErrorCard reset={reset} />
}
