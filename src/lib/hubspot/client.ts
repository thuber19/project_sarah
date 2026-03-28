import type {
  HubSpotContact,
  HubSpotCreateContactInput,
  HubSpotCreateDealInput,
  HubSpotApiResponse,
} from './types'

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000
const MIN_REQUEST_INTERVAL_MS = 110 // 100 req/10s → ~10 req/s

let lastRequestTime = 0

function getApiKey(): string {
  const key = process.env.HUBSPOT_API_KEY
  if (!key) throw new Error('HUBSPOT_API_KEY is not set')
  return key
}

async function rateLimit() {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed))
  }
  lastRequestTime = Date.now()
}

async function hubspotFetch<T>(
  endpoint: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<T> {
  await rateLimit()

  const { method = 'GET', body } = options

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${HUBSPOT_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After') || '1')
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
      continue
    }

    if (response.status >= 500 && attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
      continue
    }

    if (!response.ok) {
      const error = await response.text().catch(() => 'Unknown error')
      throw new Error(`HubSpot API error ${response.status}: ${error}`)
    }

    return response.json() as Promise<T>
  }

  throw new Error('HubSpot API: max retries exceeded')
}

/** Create a contact in HubSpot */
export async function createContact(input: HubSpotCreateContactInput): Promise<HubSpotContact> {
  const properties: Record<string, string> = {
    email: input.email,
    firstname: input.firstname,
    lastname: input.lastname,
  }

  if (input.jobtitle) properties.jobtitle = input.jobtitle
  if (input.phone) properties.phone = input.phone
  if (input.company) properties.company = input.company
  if (input.website) properties.website = input.website
  if (input.lifecyclestage) properties.lifecyclestage = input.lifecyclestage
  if (input.hs_lead_status) properties.hs_lead_status = input.hs_lead_status
  if (input.sarah_lead_id) properties.sarah_lead_id = input.sarah_lead_id
  if (input.sarah_score) properties.sarah_score = input.sarah_score
  if (input.sarah_grade) properties.sarah_grade = input.sarah_grade

  return hubspotFetch<HubSpotContact>('/crm/v3/objects/contacts', {
    method: 'POST',
    body: { properties },
  })
}

/** Search for a contact by email */
export async function findContactByEmail(email: string): Promise<HubSpotContact | null> {
  const result = await hubspotFetch<HubSpotApiResponse<HubSpotContact>>(
    '/crm/v3/objects/contacts/search',
    {
      method: 'POST',
      body: {
        filterGroups: [
          {
            filters: [{ propertyName: 'email', operator: 'EQ', value: email }],
          },
        ],
        properties: ['email', 'firstname', 'lastname', 'jobtitle', 'company'],
        limit: 1,
      },
    }
  )
  return result.results?.[0] ?? null
}

/** Create a deal and associate it with a contact */
export async function createDeal(input: HubSpotCreateDealInput): Promise<{ id: string }> {
  const properties: Record<string, string> = {
    dealname: input.dealname,
    dealstage: input.dealstage,
    pipeline: input.pipeline ?? 'default',
  }
  if (input.amount) properties.amount = input.amount

  const associations = input.associated_contact_id
    ? [
        {
          to: { id: input.associated_contact_id },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
        },
      ]
    : []

  return hubspotFetch<{ id: string }>('/crm/v3/objects/deals', {
    method: 'POST',
    body: { properties, associations },
  })
}

/** Check if HubSpot API key is configured and valid */
export async function checkConnection(): Promise<boolean> {
  try {
    getApiKey()
    await hubspotFetch('/crm/v3/objects/contacts?limit=1')
    return true
  } catch {
    return false
  }
}
