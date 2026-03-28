import { requireAuth } from '@/lib/supabase/server'
import { CompetitorClient } from './competitor-client'

export default async function CompetitorAnalysisPage() {
  await requireAuth()

  return <CompetitorClient />
}
