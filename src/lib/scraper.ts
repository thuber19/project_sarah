import * as cheerio from 'cheerio'

const SAFE_PROTOCOLS = ['http:', 'https:']
const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])
const FETCH_TIMEOUT_MS = 15_000
const MAX_CONTENT_LENGTH = 15_000
const USER_AGENT = 'Mozilla/5.0 (compatible; ProjectSarahBot/1.0)'

const ABOUT_SELECTORS = [
  '[class*="about"]',
  '[id*="about"]',
  '[class*="ueber"]',
  '[id*="ueber"]',
  '[class*="über"]',
  '[id*="über"]',
]

const SERVICES_SELECTORS = [
  '[class*="service"]',
  '[id*="service"]',
  '[class*="leistung"]',
  '[id*="leistung"]',
  '[class*="produkt"]',
  '[id*="produkt"]',
  '[class*="product"]',
  '[id*="product"]',
]

const IMPRESSUM_SELECTORS = [
  '[class*="impressum"]',
  '[id*="impressum"]',
  '[class*="kontakt"]',
  '[id*="kontakt"]',
  '[class*="contact"]',
  '[id*="contact"]',
  '[class*="legal"]',
  '[id*="legal"]',
]

const TEAM_SELECTORS = [
  '[class*="team"]',
  '[id*="team"]',
  '[class*="mitarbeiter"]',
  '[id*="mitarbeiter"]',
  '[class*="management"]',
  '[id*="management"]',
  '[class*="geschaeftsfuehr"]',
  '[id*="geschaeftsfuehr"]',
]

// Email regex: standard format, case-insensitive
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// DACH phone regex: AT (+43/0043), DE (+49/0049), CH (+41/0041), and local formats
const DACH_PHONE_REGEX =
  /(?:\+|00)(4[139])[\s./-]?\(?\d{1,5}\)?[\s./-]?\d[\d\s./-]{4,12}\d|0\d{1,4}[\s./-]\d[\d\s./-]{4,12}\d/g

export interface ScrapedContent {
  url: string
  title: string
  metaDescription: string
  headings: string[]
  bodyText: string
  aboutSection: string
  servicesSection: string
  footerText: string
  impressumSection: string
  teamSection: string
  contactEmails: string[]
  contactPhones: string[]
}

function isBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true
  if (/^10\./.test(hostname)) return true // RFC-1918 Class A
  if (/^192\.168\./.test(hostname)) return true // RFC-1918 Class C
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true // RFC-1918 Class B
  if (/^169\.254\./.test(hostname)) return true // Link-local (APIPA)
  if (/^22[4-9]\./.test(hostname)) return true // Multicast 224.0.0.0/4
  if (/^23[0-9]\./.test(hostname)) return true // Multicast 230–239
  if (/^fc00:/i.test(hostname)) return true // IPv6 Unique Local
  if (/^fe80:/i.test(hostname)) return true // IPv6 Link-local
  return false
}

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedContent> {
  const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

  let url: URL
  try {
    url = new URL(normalizedUrl)
  } catch {
    throw new Error(
      'Ungültige URL — bitte vollständige Adresse eingeben (z.B. https://beispiel.at)',
    )
  }

  if (!SAFE_PROTOCOLS.includes(url.protocol)) {
    throw new Error('Nur HTTP und HTTPS sind erlaubt')
  }

  if (isBlockedHost(url.hostname)) {
    throw new Error('Diese URL ist nicht erreichbar')
  }

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Website nicht erreichbar (HTTP ${response.status})`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // Remove noise
  $('script, style, noscript, iframe, svg, nav, [role="navigation"]').remove()

  const title = $('title').first().text().trim()

  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ??
    $('meta[property="og:description"]').attr('content')?.trim() ??
    ''

  const headings: string[] = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text) headings.push(text)
  })

  const paragraphs: string[] = []
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 20) paragraphs.push(text)
  })
  const bodyText = paragraphs.join('\n\n')

  const aboutSection = extractSection($, ABOUT_SELECTORS)
  const servicesSection = extractSection($, SERVICES_SELECTORS)
  const impressumSection = extractSection($, IMPRESSUM_SELECTORS)
  const teamSection = extractSection($, TEAM_SELECTORS)
  const footerText = $('footer').first().text().replace(/\s+/g, ' ').trim()

  // Combine text sources for contact extraction
  const combinedText = [bodyText, footerText, impressumSection].join('\n')

  const contactEmails = extractEmails(combinedText)
  const contactPhones = extractPhones(combinedText)

  return {
    url: url.toString(),
    title,
    metaDescription,
    headings: headings.slice(0, 20),
    bodyText: truncate(bodyText, MAX_CONTENT_LENGTH),
    aboutSection: truncate(aboutSection, 3000),
    servicesSection: truncate(servicesSection, 3000),
    footerText: truncate(footerText, 1000),
    impressumSection: truncate(impressumSection, 3000),
    teamSection: truncate(teamSection, 3000),
    contactEmails,
    contactPhones,
  }
}

function extractSection($: cheerio.CheerioAPI, selectors: string[]): string {
  for (const selector of selectors) {
    const el = $(selector).first()
    if (el.length) {
      return el.text().replace(/\s+/g, ' ').trim()
    }
  }
  return ''
}

function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? []
  // Deduplicate (case-insensitive) and filter out obvious non-contact addresses
  const seen = new Set<string>()
  const filtered: string[] = []
  for (const email of matches) {
    const lower = email.toLowerCase()
    if (seen.has(lower)) continue
    // Filter false positives: image filenames, tracking pixels, placeholder domains
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.gif')) continue
    if (lower.includes('example.com') || lower.includes('sentry.io')) continue
    if (lower.startsWith('noreply@') || lower.startsWith('no-reply@')) continue
    seen.add(lower)
    filtered.push(email)
  }
  return filtered
}

function extractPhones(text: string): string[] {
  const matches = text.match(DACH_PHONE_REGEX) ?? []
  // Deduplicate by normalizing to digits-only for comparison
  const seen = new Set<string>()
  const filtered: string[] = []
  for (const phone of matches) {
    const digits = phone.replace(/\D/g, '')
    if (seen.has(digits)) continue
    seen.add(digits)
    filtered.push(phone.trim())
  }
  return filtered
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
