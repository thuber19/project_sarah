import type {
  ApolloPersonSearchParams,
  ApolloSearchResponse,
  ApolloEnrichmentParams,
  ApolloEnrichmentResponse,
  ApolloOrgSearchParams,
  ApolloOrgSearchResponse,
} from './types'

const APOLLO_BASE_URL = 'https://api.apollo.io'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000
const MIN_REQUEST_INTERVAL_MS = 1200 // ~50 req/min

let lastRequestTime = 0

function getApiKey(): string {
  const key = process.env.APOLLO_API_KEY
  if (!key) throw new Error('APOLLO_API_KEY is not set')
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

async function apolloFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  await rateLimit()

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${APOLLO_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': getApiKey(),
      },
      body: JSON.stringify(body),
    })

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after') || 60)
      console.warn(`[Apollo] Rate limited, waiting ${retryAfter}s`)
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
      continue
    }

    if (!response.ok) {
      const errorBody = await response.text()
      if (attempt < MAX_RETRIES && response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
        continue
      }
      throw new Error(`Apollo API error ${response.status}: ${errorBody}`)
    }

    return (await response.json()) as T
  }

  throw new Error('Apollo API: max retries exceeded')
}

export async function searchPeople(params: ApolloPersonSearchParams): Promise<ApolloSearchResponse> {
  return apolloFetch<ApolloSearchResponse>('/api/v1/mixed_people/search', {
    ...params,
    per_page: params.per_page ?? 25,
    page: params.page ?? 1,
  })
}

export async function enrichPerson(params: ApolloEnrichmentParams): Promise<ApolloEnrichmentResponse> {
  return apolloFetch<ApolloEnrichmentResponse>('/api/v1/people/match', {
    ...params,
    reveal_personal_emails: params.reveal_personal_emails ?? false,
    reveal_phone_number: params.reveal_phone_number ?? false,
  })
}

export async function searchOrganizations(params: ApolloOrgSearchParams): Promise<ApolloOrgSearchResponse> {
  return apolloFetch<ApolloOrgSearchResponse>('/api/v1/mixed_companies/search', {
    ...params,
    per_page: params.per_page ?? 25,
    page: params.page ?? 1,
  })
}
