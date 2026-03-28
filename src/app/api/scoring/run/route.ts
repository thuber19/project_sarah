'use server'

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runScoringPipeline } from '@/lib/scoring/pipeline'
import type { Lead } from '@/types/lead'
import type { ICP } from '@/lib/scoring/rule-engine'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch leads for this user
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)

  if (leadsError) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: 'No leads to score' }, { status: 400 })
  }

  // Fetch ICP for this user
  const { data: icpData } = await supabase
    .from('business_profiles')
    .select('icp_settings')
    .eq('user_id', user.id)
    .maybeSingle()

  const icp = (icpData?.icp_settings as ICP | null) ?? ({} as ICP)

  // Create scoring run record
  const { data: run, error: runError } = await supabase
    .from('scoring_runs')
    .insert({
      user_id: user.id,
      status: 'running',
      total_leads: leads.length,
      scored_leads: 0,
      failed_leads: 0,
    })
    .select()
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Failed to create scoring run' }, { status: 500 })
  }

  // Run scoring pipeline in the background (non-blocking response)
  const serviceClient = createServiceClient()

  // Fire-and-forget: Vercel will keep the function alive until it completes
  void runScoringWithTracking(serviceClient, leads as Lead[], icp, user.id, run.id)

  return NextResponse.json({ runId: run.id, totalLeads: leads.length })
}

async function runScoringWithTracking(
  supabase: ReturnType<typeof createServiceClient>,
  leads: Lead[],
  icp: ICP,
  userId: string,
  runId: string,
) {
  try {
    const result = await runScoringPipeline(supabase, leads, icp, userId)

    await supabase
      .from('scoring_runs')
      .update({
        status: 'completed',
        scored_leads: result.scored,
        failed_leads: result.failed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)
  } catch {
    await supabase
      .from('scoring_runs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', runId)
  }
}
