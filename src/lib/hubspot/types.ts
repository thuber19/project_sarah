export interface HubSpotContact {
  id: string
  properties: {
    email: string
    firstname: string
    lastname: string
    jobtitle?: string
    phone?: string
    company?: string
    website?: string
    lifecyclestage?: string
    hs_lead_status?: string
  }
}

export interface HubSpotDeal {
  id: string
  properties: {
    dealname: string
    dealstage: string
    pipeline: string
    amount?: string
    closedate?: string
  }
}

export interface HubSpotCreateContactInput {
  email: string
  firstname: string
  lastname: string
  jobtitle?: string
  phone?: string
  company?: string
  website?: string
  lifecyclestage?: string
  hs_lead_status?: string
  sarah_lead_id?: string
  sarah_score?: string
  sarah_grade?: string
}

export interface HubSpotCreateDealInput {
  dealname: string
  dealstage: string
  pipeline?: string
  amount?: string
  associated_contact_id?: string
}

export interface HubSpotApiResponse<T> {
  results?: T[]
  id?: string
  properties?: Record<string, string>
  total?: number
  paging?: { next?: { after: string } }
}

/** Maps our ScoreGrade to a HubSpot deal stage */
export const GRADE_TO_DEAL_STAGE: Record<string, string> = {
  HOT: 'qualifiedtobuy',
  QUALIFIED: 'presentationscheduled',
  ENGAGED: 'appointmentscheduled',
  POTENTIAL: 'decisionmakerboughtin',
  POOR_FIT: 'contractsent',
}
