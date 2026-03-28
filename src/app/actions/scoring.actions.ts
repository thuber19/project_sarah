'use server'

import { requireAuth } from '@/lib/supabase/server'

export type ScoringRun = {
  id: string
  status: 'running' | 'completed' | 'failed'
  total_leads: number
  scored_leads: number
  failed_leads: number
  started_at: string
  completed_at: string | null
}

export async function getActiveRun(): Promise<ScoringRun | null> {
  const { user, supabase } = await requireAuth()

  const { data } = await supabase
    .from('scoring_runs')
    .select('id, status, total_leads, scored_leads, failed_leads, started_at, completed_at')
    .eq('user_id', user.id)
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as ScoringRun | null) ?? null
}

export async function getLatestRun(): Promise<ScoringRun | null> {
  const { user, supabase } = await requireAuth()

  const { data } = await supabase
    .from('scoring_runs')
    .select('id, status, total_leads, scored_leads, failed_leads, started_at, completed_at')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as ScoringRun | null) ?? null
}

export async function getRunById(runId: string): Promise<ScoringRun | null> {
  const { user, supabase } = await requireAuth()

  const { data } = await supabase
    .from('scoring_runs')
    .select('id, status, total_leads, scored_leads, failed_leads, started_at, completed_at')
    .eq('id', runId)
    .eq('user_id', user.id)
    .maybeSingle()

  return (data as ScoringRun | null) ?? null
}
