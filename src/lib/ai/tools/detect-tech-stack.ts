import type { TechSignals } from '@/lib/scraper'

interface DetectedTechnology {
  name: string
  category: 'framework' | 'cms' | 'hosting' | 'analytics' | 'cdn' | 'language' | 'library' | 'other'
  confidence: 'high' | 'medium' | 'low'
  source: 'html' | 'headers' | 'scripts' | 'css' | 'meta'
}

export interface TechStackResult {
  technologies: DetectedTechnology[]
  summary: string[]
}

interface PatternRule {
  pattern: RegExp
  name: string
  category: DetectedTechnology['category']
  source: DetectedTechnology['source']
}

const SCRIPT_PATTERNS: PatternRule[] = [
  { pattern: /react(?:\.production|\.development|[-.]dom)/i, name: 'React', category: 'framework', source: 'scripts' },
  { pattern: /vue(?:\.runtime|\.global|\.esm)/i, name: 'Vue.js', category: 'framework', source: 'scripts' },
  { pattern: /angular(?:\.min)?\.js/i, name: 'Angular', category: 'framework', source: 'scripts' },
  { pattern: /jquery(?:\.min)?\.js/i, name: 'jQuery', category: 'library', source: 'scripts' },
  { pattern: /lodash|underscore/i, name: 'Lodash/Underscore', category: 'library', source: 'scripts' },
  { pattern: /gsap|greensock/i, name: 'GSAP', category: 'library', source: 'scripts' },
  { pattern: /alpine(?:\.min)?\.js/i, name: 'Alpine.js', category: 'framework', source: 'scripts' },
  { pattern: /svelte/i, name: 'Svelte', category: 'framework', source: 'scripts' },
  { pattern: /gtag|google-analytics|googletagmanager/i, name: 'Google Analytics', category: 'analytics', source: 'scripts' },
  { pattern: /hotjar/i, name: 'Hotjar', category: 'analytics', source: 'scripts' },
  { pattern: /segment(?:\.analytics)?/i, name: 'Segment', category: 'analytics', source: 'scripts' },
  { pattern: /mixpanel/i, name: 'Mixpanel', category: 'analytics', source: 'scripts' },
  { pattern: /hubspot/i, name: 'HubSpot', category: 'analytics', source: 'scripts' },
  { pattern: /intercom/i, name: 'Intercom', category: 'library', source: 'scripts' },
  { pattern: /stripe(?:\.js)?/i, name: 'Stripe', category: 'library', source: 'scripts' },
  { pattern: /sentry/i, name: 'Sentry', category: 'library', source: 'scripts' },
  { pattern: /cloudflare/i, name: 'Cloudflare', category: 'cdn', source: 'scripts' },
  { pattern: /unpkg\.com|cdnjs\.cloudflare\.com|jsdelivr/i, name: 'Public CDN', category: 'cdn', source: 'scripts' },
  { pattern: /webpack|__webpack/i, name: 'Webpack', category: 'library', source: 'scripts' },
  { pattern: /vite/i, name: 'Vite', category: 'library', source: 'scripts' },
]

const CSS_PATTERNS: PatternRule[] = [
  { pattern: /bootstrap/i, name: 'Bootstrap', category: 'framework', source: 'css' },
  { pattern: /tailwind/i, name: 'Tailwind CSS', category: 'framework', source: 'css' },
  { pattern: /bulma/i, name: 'Bulma', category: 'framework', source: 'css' },
  { pattern: /materialize/i, name: 'Materialize', category: 'framework', source: 'css' },
  { pattern: /foundation/i, name: 'Foundation', category: 'framework', source: 'css' },
]

const HEADER_PATTERNS: { header: string; pattern: RegExp; name: string; category: DetectedTechnology['category'] }[] = [
  { header: 'server', pattern: /nginx/i, name: 'Nginx', category: 'hosting' },
  { header: 'server', pattern: /apache/i, name: 'Apache', category: 'hosting' },
  { header: 'server', pattern: /cloudflare/i, name: 'Cloudflare', category: 'cdn' },
  { header: 'x-powered-by', pattern: /express/i, name: 'Express.js', category: 'framework' },
  { header: 'x-powered-by', pattern: /php/i, name: 'PHP', category: 'language' },
  { header: 'x-powered-by', pattern: /asp\.net/i, name: 'ASP.NET', category: 'framework' },
  { header: 'x-powered-by', pattern: /next\.js/i, name: 'Next.js', category: 'framework' },
  { header: 'cf-ray', pattern: /.+/, name: 'Cloudflare', category: 'cdn' },
  { header: 'x-vercel-id', pattern: /.+/, name: 'Vercel', category: 'hosting' },
  { header: 'x-amz-cf-id', pattern: /.+/, name: 'AWS CloudFront', category: 'cdn' },
  { header: 'via', pattern: /cloudfront/i, name: 'AWS CloudFront', category: 'cdn' },
]

/**
 * Detect technologies from scraped HTML tech signals.
 * Pure pattern-matching — no AI calls needed.
 */
export function detectTechStack(signals: TechSignals, apolloTechnologies?: string[]): TechStackResult {
  const seen = new Set<string>()
  const technologies: DetectedTechnology[] = []

  function add(tech: Omit<DetectedTechnology, 'confidence'>, confidence: DetectedTechnology['confidence']) {
    if (seen.has(tech.name)) return
    seen.add(tech.name)
    technologies.push({ ...tech, confidence })
  }

  // Meta generator (high confidence)
  if (signals.metaGenerator) {
    add({ name: signals.metaGenerator, category: 'cms', source: 'meta' }, 'high')
  }

  // Framework hints from DOM structure (high confidence)
  for (const hint of signals.metaFrameworkHints) {
    const category = hint === 'WordPress' || hint === 'Shopify' || hint === 'Webflow' ? 'cms' : 'framework'
    add({ name: hint, category, source: 'html' }, 'high')
  }

  // Script source patterns (medium confidence)
  for (const src of signals.scriptSources) {
    for (const rule of SCRIPT_PATTERNS) {
      if (rule.pattern.test(src)) {
        add({ name: rule.name, category: rule.category, source: rule.source }, 'medium')
      }
    }
  }

  // CSS patterns (medium confidence)
  for (const css of signals.cssIndicators) {
    if (css === 'tailwind-classes-detected') {
      add({ name: 'Tailwind CSS', category: 'framework', source: 'css' }, 'medium')
      continue
    }
    if (css === 'bootstrap-classes-detected') {
      add({ name: 'Bootstrap', category: 'framework', source: 'css' }, 'medium')
      continue
    }
    for (const rule of CSS_PATTERNS) {
      if (rule.pattern.test(css)) {
        add({ name: rule.name, category: rule.category, source: rule.source }, 'medium')
      }
    }
  }

  // Response headers (high confidence)
  for (const rule of HEADER_PATTERNS) {
    const val = signals.responseHeaders[rule.header]
    if (val && rule.pattern.test(val)) {
      add({ name: rule.name, category: rule.category, source: 'headers' }, 'high')
    }
  }

  // Merge Apollo technologies (medium confidence — third-party data)
  if (apolloTechnologies) {
    for (const tech of apolloTechnologies) {
      add({ name: tech, category: 'other', source: 'meta' }, 'medium')
    }
  }

  const summary = technologies.map((t) => t.name)

  return { technologies, summary }
}

/**
 * Compute which detected technologies match the ICP tech stack.
 */
export function matchIcpTechStack(
  detected: string[],
  icpTechStack: string[]
): { matched: string[]; unmatched: string[] } {
  const icpSet = new Set(icpTechStack.map((t) => t.toLowerCase().trim()))
  const matched: string[] = []
  const unmatched: string[] = []

  for (const tech of detected) {
    if (icpSet.has(tech.toLowerCase().trim())) {
      matched.push(tech)
    } else {
      unmatched.push(tech)
    }
  }

  return { matched, unmatched }
}

// --- Competitor Detection ---

/** Category groupings of competing tools. Tools in the same category are competitors. */
const TOOL_CATEGORIES: Record<string, string[]> = {
  'CRM': ['salesforce', 'hubspot', 'pipedrive', 'zoho crm', 'close', 'freshsales', 'copper', 'monday sales'],
  'Marketing Automation': ['mailchimp', 'activecampaign', 'marketo', 'pardot', 'sendinblue', 'brevo', 'klaviyo', 'hubspot marketing'],
  'Analytics': ['google analytics', 'mixpanel', 'amplitude', 'heap', 'hotjar', 'segment', 'posthog', 'matomo', 'plausible'],
  'Live Chat': ['intercom', 'drift', 'zendesk', 'crisp', 'tidio', 'livechat', 'freshchat', 'olark'],
  'Payment': ['stripe', 'braintree', 'adyen', 'mollie', 'klarna', 'paypal'],
  'E-Commerce': ['shopify', 'woocommerce', 'magento', 'bigcommerce', 'shopware', 'prestashop'],
  'CMS': ['wordpress', 'webflow', 'contentful', 'strapi', 'sanity', 'ghost', 'typo3', 'drupal'],
  'Project Management': ['jira', 'asana', 'monday', 'clickup', 'notion', 'linear', 'trello', 'basecamp'],
  'Email': ['sendgrid', 'mailgun', 'postmark', 'ses', 'sparkpost'],
}

export interface CompetitorMatch {
  technology: string
  category: string
  competitors: string[]
}

/**
 * Detect whether a lead uses tools that compete with the user's product category.
 * @param detectedTech - List of technologies found on the lead's website
 * @param userCategories - Optional: categories the user's product competes in (e.g. ['CRM', 'Analytics'])
 */
export function detectCompetitors(
  detectedTech: string[],
  userCategories?: string[]
): CompetitorMatch[] {
  const matches: CompetitorMatch[] = []
  const detectedLower = detectedTech.map((t) => t.toLowerCase().trim())

  for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
    // If user specified categories, only check those
    if (userCategories && userCategories.length > 0) {
      if (!userCategories.some((c) => c.toLowerCase() === category.toLowerCase())) continue
    }

    for (const detected of detectedLower) {
      const matchedTool = tools.find((tool) => detected.includes(tool) || tool.includes(detected))
      if (matchedTool) {
        const others = tools.filter((t) => t !== matchedTool)
        matches.push({
          technology: detectedTech[detectedLower.indexOf(detected)],
          category,
          competitors: others,
        })
      }
    }
  }

  return matches
}
