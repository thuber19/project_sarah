export interface ApolloOrgSearchParams {
  organization_num_employees_ranges?: string[] // e.g. "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"
  organization_locations?: string[]
  organization_keywords?: string[] // free-form text; use for industry and topic filtering
  organization_technologies?: string[]
  organization_revenue_ranges?: string[]
  organization_funding_stages?: string[]
  per_page?: number
  page?: number
}

export interface ApolloPersonSearchParams {
  person_titles?: string[]
  person_seniorities?: string[]
  organization_names?: string[] // filter contacts to specific companies
  organization_num_employees_ranges?: string[]
  organization_locations?: string[]
  organization_technologies?: string[]
  organization_keywords?: string[]
  organization_revenue_ranges?: string[]
  organization_funding_stages?: string[]
  per_page?: number
  page?: number
}

export interface ApolloPerson {
  id: string
  first_name: string | null
  last_name: string | null
  name: string | null
  title: string | null
  seniority: string | null
  email: string | null
  email_status: string | null
  phone_numbers: ApolloPhoneNumber[]
  linkedin_url: string | null
  organization_id: string | null
  organization: ApolloOrganization | null
}

export interface ApolloPhoneNumber {
  raw_number: string
  sanitized_number: string
  type: string
}

export interface ApolloOrganization {
  id: string
  name: string | null
  website_url: string | null
  industry: string | null
  estimated_num_employees: number | null
  annual_revenue: number | null
  annual_revenue_printed: string | null
  country: string | null
  city: string | null
  state: string | null
  linkedin_url: string | null
  twitter_url: string | null
  founded_year: number | null
  total_funding: number | null
  total_funding_printed: string | null
  latest_funding_round_type: string | null
  technologies: string[]
  keywords: string[]
}

export interface ApolloSearchResponse {
  people: ApolloPerson[]
  pagination: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}

export interface ApolloOrgSearchResponse {
  organizations: ApolloOrganization[]
  pagination: {
    page: number
    per_page: number
    total_entries: number
    total_pages: number
  }
}

export interface ApolloEnrichmentParams {
  first_name?: string
  last_name?: string
  domain?: string
  email?: string
  linkedin_url?: string
  reveal_personal_emails?: boolean
  reveal_phone_number?: boolean
}

export interface ApolloEnrichmentResponse {
  person: ApolloPerson | null
}
