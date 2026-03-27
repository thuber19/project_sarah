export interface PlaceTextSearchParams {
  query: string
  region?: string
  pageToken?: string
}

export interface Place {
  id: string
  displayName: string
  formattedAddress: string
  websiteUri: string | null
  nationalPhoneNumber: string | null
  internationalPhoneNumber: string | null
  rating: number | null
  userRatingCount: number | null
  businessStatus: string | null
  types: string[]
  location: {
    latitude: number
    longitude: number
  }
}

export interface PlaceTextSearchResponse {
  places: Place[]
  nextPageToken: string | null
}

export interface PlaceDetails extends Place {
  reviews: PlaceReview[]
  regularOpeningHours: OpeningHours | null
  editorialSummary: string | null
}

export interface PlaceReview {
  authorName: string
  rating: number
  text: string
  relativePublishTimeDescription: string
}

export interface OpeningHours {
  weekdayDescriptions: string[]
}
