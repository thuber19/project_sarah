import * as cheerio from 'cheerio'

const FETCH_TIMEOUT_MS = 10_000
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

export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const response = await fetch(normalizedUrl, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  // Remove noise
  $('script, style, noscript, iframe, svg, nav, [role="navigation"]').remove()

  // Title
  const title = $('title').first().text().trim()

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ??
    $('meta[property="og:description"]').attr('content')?.trim() ??
    ''

  // Headings h1-h3
  const headings: string[] = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text) headings.push(text)
  })

  // Body text (paragraphs)
  const paragraphs: string[] = []
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 20) paragraphs.push(text)
  })
  const bodyText = paragraphs.join('\n\n')

  // About section
  const aboutSection = extractSection($, ABOUT_SELECTORS)

  // Services section
  const servicesSection = extractSection($, SERVICES_SELECTORS)

  // Footer
  const footerText = $('footer').first().text().replace(/\s+/g, ' ').trim()

  return {
    url: normalizedUrl,
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
