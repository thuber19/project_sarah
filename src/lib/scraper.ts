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

export interface ScrapedContent {
  url: string
  title: string
  metaDescription: string
  headings: string[]
  bodyText: string
  aboutSection: string
  servicesSection: string
  footerText: string
}

function isBlockedHost(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true
  if (/^10\./.test(hostname)) return true
  if (/^192\.168\./.test(hostname)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true
  if (/^169\.254\./.test(hostname)) return true
  return false
}

export async function scrapeWebsite(rawUrl: string): Promise<ScrapedContent> {
  const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

  let url: URL
  try {
    url = new URL(normalizedUrl)
  } catch {
    throw new Error('Ungültige URL — bitte vollständige Adresse eingeben (z.B. https://beispiel.at)')
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
  const footerText = $('footer').first().text().replace(/\s+/g, ' ').trim()

  return {
    url: url.toString(),
    title,
    metaDescription,
    headings: headings.slice(0, 20),
    bodyText: truncate(bodyText, MAX_CONTENT_LENGTH),
    aboutSection: truncate(aboutSection, 3000),
    servicesSection: truncate(servicesSection, 3000),
    footerText: truncate(footerText, 1000),
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

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
