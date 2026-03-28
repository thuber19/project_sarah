'use server'

import { requireAuth } from '@/lib/supabase/server'
import { z } from 'zod/v4'
import {
  createContact,
  findContactByEmail,
  createDeal,
  checkConnection,
} from '@/lib/hubspot/client'
import { GRADE_TO_DEAL_STAGE } from '@/lib/hubspot/types'

const exportLeadSchema = z.object({
  leadId: z.string().uuid(),
})

const bulkExportSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(100),
})

export async function exportLeadToHubSpotAction(data: { leadId: string }) {
  const { user, supabase } = await requireAuth()

  const parsed = exportLeadSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Lead-ID' }

  const { leadId } = parsed.data

  // Fetch lead + score
  const [leadResult, scoreResult] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).eq('user_id', user.id).single(),
    supabase.from('lead_scores').select('*').eq('lead_id', leadId).eq('user_id', user.id).maybeSingle(),
  ])

  if (leadResult.error || !leadResult.data) {
    return { success: false as const, error: 'Lead nicht gefunden' }
  }

  const lead = leadResult.data
  const score = scoreResult.data

  if (!lead.email) {
    return { success: false as const, error: 'Lead hat keine E-Mail-Adresse' }
  }

  try {
    // Check if contact already exists
    const existing = await findContactByEmail(lead.email)
    let contactId: string

    if (existing) {
      contactId = existing.id
    } else {
      const contact = await createContact({
        email: lead.email,
        firstname: lead.first_name ?? '',
        lastname: lead.last_name ?? '',
        jobtitle: lead.job_title ?? undefined,
        phone: lead.phone ?? undefined,
        company: lead.company_name ?? undefined,
        website: lead.company_website ?? lead.company_domain ?? undefined,
        lifecyclestage: 'lead',
        hs_lead_status: score?.grade === 'HOT' ? 'OPEN' : 'NEW',
        sarah_lead_id: lead.id,
        sarah_score: score ? String(score.total_score) : undefined,
        sarah_grade: score?.grade ?? undefined,
      })
      contactId = contact.id
    }

    // Create deal if lead is scored
    if (score) {
      const dealStage = GRADE_TO_DEAL_STAGE[score.grade] ?? 'appointmentscheduled'
      await createDeal({
        dealname: `${lead.company_name ?? lead.first_name} — Sarah Lead`,
        dealstage: dealStage,
        associated_contact_id: contactId,
      })
    }

    // Update lead with sync status
    await supabase
      .from('leads')
      .update({
        hubspot_contact_id: contactId,
        hubspot_synced_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .eq('user_id', user.id)

    return {
      success: true as const,
      data: { contactId, alreadyExisted: !!existing },
    }
  } catch (error) {
    console.error('HubSpot export failed:', error)
    return { success: false as const, error: 'Export nach HubSpot fehlgeschlagen' }
  }
}

export async function bulkExportToHubSpotAction(data: { leadIds: string[] }) {
  await requireAuth()

  const parsed = bulkExportSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Ungültige Lead-IDs' }

  const results: { leadId: string; success: boolean; error?: string }[] = []

  for (const leadId of parsed.data.leadIds) {
    const result = await exportLeadToHubSpotAction({ leadId })
    results.push({
      leadId,
      success: result.success,
      error: result.success ? undefined : result.error,
    })
  }

  const exported = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return {
    success: true as const,
    data: { exported, failed, results },
  }
}

export async function checkHubSpotConnectionAction() {
  await requireAuth()

  try {
    const connected = await checkConnection()
    return { success: true as const, data: { connected } }
  } catch {
    return { success: true as const, data: { connected: false } }
  }
}
