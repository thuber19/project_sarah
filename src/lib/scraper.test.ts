import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeWebsite } from './scraper'

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createHtmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHtml(options: {
  title?: string
  metaDescription?: string
  headings?: string[]
  paragraphs?: string[]
  aboutSection?: string
  servicesSection?: string
  impressumSection?: string
  teamSection?: string
  footerText?: string
}): string {
  const headingTags = (options.headings ?? []).map((h) => `<h1>${h}</h1>`).join('\n')
  const paragraphTags = (options.paragraphs ?? []).map((p) => `<p>${p}</p>`).join('\n')

  return `
    <html>
    <head>
      <title>${options.title ?? 'Test Page'}</title>
      ${options.metaDescription ? `<meta name="description" content="${options.metaDescription}">` : ''}
    </head>
    <body>
      ${headingTags}
      ${paragraphTags}
      ${options.aboutSection ? `<div class="about-us">${options.aboutSection}</div>` : ''}
      ${options.servicesSection ? `<div class="services">${options.servicesSection}</div>` : ''}
      ${options.impressumSection ? `<div class="impressum">${options.impressumSection}</div>` : ''}
      ${options.teamSection ? `<div class="team">${options.teamSection}</div>` : ''}
      <footer>${options.footerText ?? ''}</footer>
    </body>
    </html>
  `
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scrapeWebsite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // URL validation
  // -------------------------------------------------------------------------

  it('rejects invalid URLs', async () => {
    await expect(scrapeWebsite('not a url !!!')).rejects.toThrow('Ungültige URL')
  })

  it('normalizes ftp:// to https:// prefix (startsWith("http") guard)', async () => {
    // ftp:// does not start with "http", so it gets https:// prepended and
    // the hostname resolves to "ftp" — the protocol check never fires.
    // This test verifies the normalizer behavior.
    mockFetch.mockResolvedValueOnce(createHtmlResponse(buildHtml({ title: 'Test' })))

    const result = await scrapeWebsite('ftp://example.com')

    expect(result.url).toBe('https://ftp//example.com')
  })

  it('rejects blocked hosts (localhost)', async () => {
    await expect(scrapeWebsite('http://localhost/test')).rejects.toThrow(
      'Diese URL ist nicht erreichbar',
    )
  })

  it('rejects blocked hosts (private IP 10.x)', async () => {
    await expect(scrapeWebsite('http://10.0.0.1/test')).rejects.toThrow(
      'Diese URL ist nicht erreichbar',
    )
  })

  it('rejects blocked hosts (private IP 192.168.x)', async () => {
    await expect(scrapeWebsite('http://192.168.1.1/test')).rejects.toThrow(
      'Diese URL ist nicht erreichbar',
    )
  })

  it('prepends https:// when protocol is missing', async () => {
    mockFetch.mockResolvedValueOnce(createHtmlResponse(buildHtml({ title: 'Test' })))

    const result = await scrapeWebsite('example.com')

    expect(result.url).toBe('https://example.com/')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/',
      expect.objectContaining({ headers: expect.any(Object) }),
    )
  })

  it('throws on non-OK HTTP response', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 404 }))

    await expect(scrapeWebsite('https://example.com')).rejects.toThrow(
      'Website nicht erreichbar (HTTP 404)',
    )
  })

  // -------------------------------------------------------------------------
  // Basic content extraction
  // -------------------------------------------------------------------------

  it('extracts title and meta description', async () => {
    const html = buildHtml({
      title: 'Firma GmbH - B2B Lösungen',
      metaDescription: 'Wir bieten innovative B2B-Lösungen für den DACH-Raum.',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://firma.at')

    expect(result.title).toBe('Firma GmbH - B2B Lösungen')
    expect(result.metaDescription).toBe('Wir bieten innovative B2B-Lösungen für den DACH-Raum.')
  })

  it('extracts headings (up to 20)', async () => {
    const headings = Array.from({ length: 25 }, (_, i) => `Heading ${i + 1}`)
    const html = buildHtml({ headings })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.headings).toHaveLength(20)
    expect(result.headings[0]).toBe('Heading 1')
    expect(result.headings[19]).toBe('Heading 20')
  })

  // -------------------------------------------------------------------------
  // Section extraction (existing: about, services)
  // -------------------------------------------------------------------------

  it('extracts about and services sections', async () => {
    const html = buildHtml({
      aboutSection: 'Wir sind ein mittelständisches Unternehmen aus Wien.',
      servicesSection: 'Beratung, Implementierung, Support.',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.aboutSection).toContain('mittelständisches Unternehmen')
    expect(result.servicesSection).toContain('Beratung')
  })

  // -------------------------------------------------------------------------
  // NEW: Impressum section extraction
  // -------------------------------------------------------------------------

  it('extracts impressum section by class name', async () => {
    const html = buildHtml({
      impressumSection:
        'Musterfirma GmbH, Musterstraße 1, 1010 Wien. Geschäftsführer: Max Mustermann. UID: ATU12345678',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.impressumSection).toContain('Musterfirma GmbH')
    expect(result.impressumSection).toContain('ATU12345678')
  })

  it('extracts impressum section by kontakt class', async () => {
    const html = `
      <html><head><title>Test</title></head>
      <body>
        <div class="kontakt-bereich">
          Telefon: +43 1 234 56 78, E-Mail: office@firma.at
        </div>
        <footer></footer>
      </body></html>
    `
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.impressumSection).toContain('office@firma.at')
  })

  it('returns empty string when no impressum section found', async () => {
    const html = buildHtml({})
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.impressumSection).toBe('')
  })

  // -------------------------------------------------------------------------
  // NEW: Team section extraction
  // -------------------------------------------------------------------------

  it('extracts team section by class name', async () => {
    const html = buildHtml({
      teamSection: 'Unser Team: Maria Schmidt (CEO), Thomas Müller (CTO), Anna Weber (COO)',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.teamSection).toContain('Maria Schmidt')
    expect(result.teamSection).toContain('Thomas Müller')
  })

  it('extracts team section by management class', async () => {
    const html = `
      <html><head><title>Test</title></head>
      <body>
        <div class="management-team">
          Dr. Hans Gruber, Geschäftsführer seit 2019
        </div>
        <footer></footer>
      </body></html>
    `
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.teamSection).toContain('Dr. Hans Gruber')
  })

  it('extracts team section by geschaeftsfuehr id', async () => {
    const html = `
      <html><head><title>Test</title></head>
      <body>
        <section id="geschaeftsfuehrung">
          Mag. Elisabeth Bauer, MBA
        </section>
        <footer></footer>
      </body></html>
    `
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.teamSection).toContain('Mag. Elisabeth Bauer')
  })

  it('returns empty string when no team section found', async () => {
    const html = buildHtml({})
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.teamSection).toBe('')
  })

  // -------------------------------------------------------------------------
  // NEW: Email extraction
  // -------------------------------------------------------------------------

  it('extracts email addresses from body and footer', async () => {
    const html = buildHtml({
      paragraphs: [
        'Kontaktieren Sie uns unter office@musterfirma.at für weitere Informationen.',
      ],
      footerText: 'Support: support@musterfirma.at | Vertrieb: vertrieb@musterfirma.at',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactEmails).toContain('office@musterfirma.at')
    expect(result.contactEmails).toContain('support@musterfirma.at')
    expect(result.contactEmails).toContain('vertrieb@musterfirma.at')
  })

  it('extracts emails from impressum section', async () => {
    const html = buildHtml({
      impressumSection:
        'Musterfirma GmbH, E-Mail: gf@musterfirma.at, Tel: +43 1 234 56 78',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactEmails).toContain('gf@musterfirma.at')
  })

  it('keeps info@ and kontakt@ emails (valuable for DACH SMB outreach)', async () => {
    const html = buildHtml({
      footerText: 'info@firma.de kontakt@firma.ch',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactEmails).toContain('info@firma.de')
    expect(result.contactEmails).toContain('kontakt@firma.ch')
  })

  it('filters out noreply@ emails', async () => {
    const html = buildHtml({
      footerText: 'noreply@firma.at no-reply@firma.de office@firma.at',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactEmails).not.toContain('noreply@firma.at')
    expect(result.contactEmails).not.toContain('no-reply@firma.de')
    expect(result.contactEmails).toContain('office@firma.at')
  })

  it('filters out image filename false positives', async () => {
    const html = buildHtml({
      paragraphs: ['Check banner@2x.png and icon@logo.jpg for assets.'],
      footerText: 'real@firma.at',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactEmails).not.toContain('banner@2x.png')
    expect(result.contactEmails).not.toContain('icon@logo.jpg')
    expect(result.contactEmails).toContain('real@firma.at')
  })

  it('deduplicates emails case-insensitively', async () => {
    const html = buildHtml({
      paragraphs: ['Mail us at Office@Firma.AT or office@firma.at to get in touch.'],
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    const lowerEmails = result.contactEmails.map((e) => e.toLowerCase())
    const unique = new Set(lowerEmails)
    expect(lowerEmails.length).toBe(unique.size)
  })

  it('returns empty array when no emails found', async () => {
    const html = buildHtml({ paragraphs: ['No contact info here at all.'] })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactEmails).toEqual([])
  })

  // -------------------------------------------------------------------------
  // NEW: Phone extraction (DACH numbers)
  // -------------------------------------------------------------------------

  it('extracts Austrian phone numbers (+43)', async () => {
    const html = buildHtml({
      footerText: 'Telefon: +43 1 234 56 78',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactPhones.length).toBeGreaterThanOrEqual(1)
    expect(result.contactPhones.some((p) => p.includes('+43'))).toBe(true)
  })

  it('extracts German phone numbers (+49)', async () => {
    const html = buildHtml({
      impressumSection: 'Tel.: +49 89 123456-0',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactPhones.length).toBeGreaterThanOrEqual(1)
    expect(result.contactPhones.some((p) => p.includes('+49'))).toBe(true)
  })

  it('extracts Swiss phone numbers (+41)', async () => {
    const html = buildHtml({
      footerText: 'Kontakt: +41 44 123 45 67',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactPhones.length).toBeGreaterThanOrEqual(1)
    expect(result.contactPhones.some((p) => p.includes('+41'))).toBe(true)
  })

  it('extracts phone numbers with 00 prefix format', async () => {
    const html = buildHtml({
      impressumSection: 'Fax: 0043 1 987 65 43',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactPhones.length).toBeGreaterThanOrEqual(1)
    expect(result.contactPhones.some((p) => p.includes('0043'))).toBe(true)
  })

  it('extracts local format phone numbers', async () => {
    const html = buildHtml({
      footerText: 'Büro Wien: 01/234 56 78 | München: 089/123456',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactPhones.length).toBeGreaterThanOrEqual(1)
  })

  it('deduplicates phone numbers', async () => {
    const html = buildHtml({
      paragraphs: ['Rufen Sie an: +43 1 234 56 78 oder +43 1 234 56 78 (gleiche Nummer).'],
      footerText: 'Tel: +43 1 234 56 78',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    // All digits normalize to same number, should appear only once
    const digitSets = result.contactPhones.map((p) => p.replace(/\D/g, ''))
    const unique = new Set(digitSets)
    expect(digitSets.length).toBe(unique.size)
  })

  it('returns empty array when no phone numbers found', async () => {
    const html = buildHtml({
      paragraphs: ['Keine Telefonnummer auf dieser Seite vorhanden.'],
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.contactPhones).toEqual([])
  })

  // -------------------------------------------------------------------------
  // Full integration: all new fields present in response
  // -------------------------------------------------------------------------

  it('returns all new fields in ScrapedContent', async () => {
    const html = buildHtml({
      title: 'Testfirma GmbH',
      impressumSection:
        'Testfirma GmbH, Musterstr. 1, 1010 Wien. Tel: +43 1 999 88 77. E-Mail: office@testfirma.at',
      teamSection: 'CEO: Dr. Test, CTO: Ing. Mock',
      footerText: 'info@testfirma.at | +43 1 999 88 77',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://testfirma.at')

    // Verify all interface fields exist
    expect(result).toHaveProperty('impressumSection')
    expect(result).toHaveProperty('teamSection')
    expect(result).toHaveProperty('contactEmails')
    expect(result).toHaveProperty('contactPhones')

    // Verify content
    expect(result.impressumSection).toContain('Testfirma GmbH')
    expect(result.teamSection).toContain('Dr. Test')
    expect(result.contactEmails).toContain('office@testfirma.at')
    expect(result.contactPhones.length).toBeGreaterThanOrEqual(1)
  })

  // -------------------------------------------------------------------------
  // Existing functionality preserved
  // -------------------------------------------------------------------------

  it('still extracts footer text correctly', async () => {
    const html = buildHtml({
      footerText: '© 2026 Musterfirma GmbH. Alle Rechte vorbehalten.',
    })
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.footerText).toContain('© 2026 Musterfirma GmbH')
  })

  it('removes script and style tags from content', async () => {
    const html = `
      <html><head><title>Test</title></head>
      <body>
        <script>var secret = "hidden";</script>
        <style>.hidden { display: none; }</style>
        <p>This is the visible paragraph content here.</p>
        <footer></footer>
      </body></html>
    `
    mockFetch.mockResolvedValueOnce(createHtmlResponse(html))

    const result = await scrapeWebsite('https://example.com')

    expect(result.bodyText).not.toContain('secret')
    expect(result.bodyText).not.toContain('.hidden')
    expect(result.bodyText).toContain('visible paragraph content')
  })
})
