import type {
  Lead,
  ContactPreferences,
  PersonScoreBreakdownV2,
  PersonaTag,
  ContactChannel,
} from '@/types/lead'

// ---------------------------------------------------------------------------
// Decision Power (0-30)
// ---------------------------------------------------------------------------

const SENIORITY_POWER: Record<string, number> = {
  owner: 30, founder: 30, cxo: 28, c_suite: 28,
  vp: 22, director: 18, head: 14, manager: 8, senior: 3, entry: 1,
}

const DACH_TITLE_POWER: Array<[string, number]> = [
  ['geschäftsführer', 30], ['geschäftsführerin', 30],
  ['inhaber', 30], ['inhaberin', 30],
  ['vorstand', 28], ['vorstandsmitglied', 28],
  ['prokurist', 22], ['prokuristin', 22],
  ['bereichsleiter', 18], ['bereichsleiterin', 18],
  ['abteilungsleiter', 14], ['abteilungsleiterin', 14],
  ['teamleiter', 8], ['teamleiterin', 8],
]

function scoreDecisionPower(lead: Lead, prefs: ContactPreferences): number {
  let score = 0

  // Seniority enum
  if (lead.seniority) {
    const s = lead.seniority.toLowerCase()
    score = SENIORITY_POWER[s] ?? 0
    // Bonus if seniority matches user preference
    if (prefs.ideal_seniority.some((ps) => ps.toLowerCase() === s)) {
      score = Math.min(30, score + 4)
    }
  }

  // DACH title fallback
  if (score === 0 && lead.job_title) {
    const title = lead.job_title.toLowerCase()
    for (const [keyword, power] of DACH_TITLE_POWER) {
      if (title.includes(keyword)) {
        score = power
        break
      }
    }
  }

  return Math.min(score, 30)
}

// ---------------------------------------------------------------------------
// Budget Access (0-25)
// ---------------------------------------------------------------------------

const BUDGET_KEYWORDS = [
  'cfo', 'finance', 'finanzen', 'controlling', 'controller',
  'einkauf', 'procurement', 'purchasing', 'budget', 'commercial',
  'kaufmännisch', 'treasury', 'accounting', 'buchhaltung',
]

function scoreBudgetAccess(lead: Lead): number {
  if (!lead.job_title) return 0
  const title = lead.job_title.toLowerCase()

  // Direct budget title
  if (BUDGET_KEYWORDS.some((k) => title.includes(k))) return 25

  // C-level always has budget
  if (['ceo', 'coo', 'cmo', 'geschäftsführer', 'vorstand', 'inhaber'].some((k) => title.includes(k))) return 22

  // Directors/VPs often control budget
  if (['director', 'vp', 'bereichsleiter', 'prokurist'].some((k) => title.includes(k))) return 15

  // Managers sometimes
  if (['manager', 'abteilungsleiter', 'teamleiter'].some((k) => title.includes(k))) return 8

  return 0
}

// ---------------------------------------------------------------------------
// Domain Relevance (0-25)
// ---------------------------------------------------------------------------

function scoreDomainRelevance(lead: Lead, prefs: ContactPreferences): number {
  if (!lead.job_title) return 0
  const title = lead.job_title.toLowerCase()

  // Exact title match with user's ideal titles
  if (prefs.ideal_titles.some((t) => title.includes(t.toLowerCase()))) return 25

  // Department match
  if (prefs.ideal_departments.length > 0) {
    const deptKeywords: Record<string, string[]> = {
      'Geschäftsführung': ['geschäftsführ', 'ceo', 'managing director', 'vorstand', 'inhaber'],
      'Vertrieb / Sales': ['sales', 'vertrieb', 'account', 'business development', 'bdm'],
      'Marketing': ['marketing', 'growth', 'brand', 'content', 'demand gen'],
      'IT / Engineering': ['cto', 'engineering', 'developer', 'architect', 'devops', 'it '],
      'Finanzen / Controlling': ['cfo', 'finance', 'finanzen', 'controlling', 'accounting'],
      'Einkauf / Procurement': ['einkauf', 'procurement', 'purchasing', 'sourcing'],
      'HR / People': ['hr', 'human resources', 'people', 'talent', 'recruiting', 'personal'],
      'Operations': ['operations', 'ops', 'coo', 'supply chain', 'logistik'],
      'Produkt / Product': ['product', 'produkt', 'cpo', 'product manager'],
    }

    for (const dept of prefs.ideal_departments) {
      const keywords = deptKeywords[dept]
      if (keywords && keywords.some((k) => title.includes(k))) return 20
    }
  }

  // C-level fallback (always somewhat relevant)
  if (['ceo', 'cto', 'cfo', 'cmo', 'coo', 'geschäftsführer', 'vorstand'].some((k) => title.includes(k))) return 10

  return 0
}

// ---------------------------------------------------------------------------
// Reachability (0-20) — weighted by user's preferred channels
// ---------------------------------------------------------------------------

/** Base points per channel. Preferred channels get a multiplier. */
const CHANNEL_POINTS: Record<ContactChannel, { field: keyof Lead | string; base: number }> = {
  email: { field: 'email', base: 6 },
  linkedin: { field: 'linkedin_url', base: 5 },
  phone: { field: 'phone', base: 4 },
  xing: { field: 'xing_url', base: 3 },
}

function scoreReachability(lead: Lead, prefs: ContactPreferences): number {
  let score = 0
  const preferred = new Set(prefs.preferred_channels)
  const raw = lead.raw_data ?? {}

  for (const [channel, config] of Object.entries(CHANNEL_POINTS)) {
    const ch = channel as ContactChannel
    // Check if contact has this channel available
    const fieldValue = config.field in lead
      ? (lead as unknown as Record<string, unknown>)[config.field]
      : raw[config.field]

    if (fieldValue) {
      // Preferred channels get 1.5x points
      const multiplier = preferred.has(ch) ? 1.5 : 1
      score += Math.round(config.base * multiplier)
    }
  }

  // Recency bonus
  if (raw.last_activity_date) {
    const daysSince = (Date.now() - new Date(raw.last_activity_date as string).getTime()) / 86_400_000
    if (daysSince < 30) score += 2
  }

  return Math.min(score, 20)
}

// ---------------------------------------------------------------------------
// Persona Tags
// ---------------------------------------------------------------------------

function assignPersonaTag(breakdown: PersonScoreBreakdownV2): PersonaTag | null {
  const { decision_power, budget_access, domain_relevance, reachability } = breakdown

  // Entscheider: high decision power AND budget access
  if (decision_power >= 22 && budget_access >= 15) return 'entscheider'

  // Budget Holder: high budget access regardless of decision power
  if (budget_access >= 20) return 'budget_holder'

  // Champion: high domain relevance AND reachable (internal advocate)
  if (domain_relevance >= 20 && reachability >= 12) return 'champion'

  // Influencer: moderate decision power AND relevant
  if (decision_power >= 10 && domain_relevance >= 15) return 'influencer'

  return null
}

// ---------------------------------------------------------------------------
// Main Person Scoring Function
// ---------------------------------------------------------------------------

export function calculatePersonScoreV2(
  lead: Lead,
  prefs: ContactPreferences,
): { score: number; breakdown: PersonScoreBreakdownV2 } {
  const decision_power = scoreDecisionPower(lead, prefs)
  const budget_access = scoreBudgetAccess(lead)
  const domain_relevance = scoreDomainRelevance(lead, prefs)
  const reachability = scoreReachability(lead, prefs)

  const breakdown: PersonScoreBreakdownV2 = {
    decision_power,
    budget_access,
    domain_relevance,
    reachability,
    persona_tag: null,
  }

  breakdown.persona_tag = assignPersonaTag(breakdown)

  const score = Math.min(100, decision_power + budget_access + domain_relevance + reachability)

  return { score, breakdown }
}
