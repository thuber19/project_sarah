'use client'

import { ErrorCard } from '@/components/shared/error-card'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex h-full flex-1 flex-col">
      <ErrorCard reset={reset} />
    </div>
  )
}
