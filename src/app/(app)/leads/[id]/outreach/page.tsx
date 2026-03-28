import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/supabase/server'
import { OutreachClient } from './outreach-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OutreachPage({ params }: Props) {
  const { id } = await params
  const { user, supabase } = await requireAuth()

  const [leadResult, scoreResult] = await Promise.all([
    supabase
      .from('leads')
      .select(
        'id, company_name, first_name, last_name, industry, location, company_website, company_size',
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('lead_scores')
      .select('total_score, grade')
      .eq('lead_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) notFound()

  const lead = leadResult.data
  const score = scoreResult.data

  return (
    <OutreachClient
      lead={{
        id: lead.id,
        companyName: lead.company_name ?? 'Unbekannt',
        firstName: lead.first_name ?? null,
        lastName: lead.last_name ?? null,
        industry: lead.industry ?? null,
        location: lead.location ?? null,
        website: lead.company_website ?? null,
        companySize: lead.company_size ?? null,
      }}
      score={
        score
          ? {
              totalScore: score.total_score,
              grade: score.grade,
            }
          : null
      }
    />
  )
}
