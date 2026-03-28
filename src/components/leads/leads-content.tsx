'use client'

import { useState } from 'react'
import { LeadTable } from '@/components/leads/lead-table'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadBulkToolbar } from '@/components/leads/lead-bulk-toolbar'

export function LeadsContent() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  return (
    <>
      <LeadFilters />
      <LeadBulkToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds(new Set())}
      />
      <LeadTable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </>
  )
}
