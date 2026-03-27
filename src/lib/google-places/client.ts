import type {
  PlaceTextSearchParams,
  PlaceTextSearchResponse,
  PlaceDetails,
  Place,
} from './types'

const PLACES_BASE_URL = 'https://places.googleapis.com/v1'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

const TEXT_SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.types',
  'places.location',
  'nextPageToken',
].join(',')

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'rating',
  'userRatingCount',
  'businessStatus',
  'types',
  'location',
  'reviews',
  'regularOpeningHours',
  'editorialSummary',
].join(',')

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not set')
  return key
}

async function placesFetch<T>(endpoint: string, options: RequestInit & { fieldMask: string }): Promise<T> {
  const { fieldMask, ...fetchOptions } = options

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${PLACES_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getApiKey(),
        'X-Goog-FieldMask': fieldMask,
        ...fetchOptions.headers,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      if (attempt < MAX_RETRIES && response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
        continue
      }
      throw new Error(`Google Places API error ${response.status}: ${errorBody}`)
    }

    return (await response.json()) as T
  }

  throw new Error('Google Places API: max retries exceeded')
}

export async function textSearch(params: PlaceTextSearchParams): Promise<PlaceTextSearchResponse> {
  const body: Record<string, unknown> = {
    textQuery: params.query,
    languageCode: 'de',
  }

  if (params.region) {
    body.regionCode = params.region
  }

  if (params.pageToken) {
    body.pageToken = params.pageToken
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await placesFetch<{ places?: any[]; nextPageToken?: string }>(
    '/places:searchText',
    {
      method: 'POST',
      body: JSON.stringify(body),
      fieldMask: TEXT_SEARCH_FIELDS,
    },
  )

  return {
    places: (response.places ?? []).map(normalizePlace),
    nextPageToken: response.nextPageToken ?? null,
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await placesFetch<any>(
    `/places/${placeId}`,
    {
      method: 'GET',
      fieldMask: DETAIL_FIELDS,
    },
  )

  return {
    ...normalizePlace(response),
    reviews: response.reviews ?? [],
    regularOpeningHours: response.regularOpeningHours ?? null,
    editorialSummary: response.editorialSummary ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePlace(raw: any): Place {
  const displayName = raw.displayName
  return {
    id: raw.id ?? '',
    displayName: typeof displayName === 'object' ? displayName?.text ?? '' : displayName ?? '',
    formattedAddress: raw.formattedAddress ?? '',
    websiteUri: raw.websiteUri ?? null,
    nationalPhoneNumber: raw.nationalPhoneNumber ?? null,
    internationalPhoneNumber: raw.internationalPhoneNumber ?? null,
    rating: raw.rating ?? null,
    userRatingCount: raw.userRatingCount ?? null,
    businessStatus: raw.businessStatus ?? null,
    types: raw.types ?? [],
    location: raw.location ?? { latitude: 0, longitude: 0 },
  }
}
