import type { BusinessProfile, IcpProfile } from '@/types/database'

interface SystemPromptContext {
  business?: Partial<BusinessProfile> | null
  icp?: Partial<IcpProfile> | null
}

const DACH_KNOWLEDGE = `## DACH-Markt Expertise

### Sprache & Konventionen
- B2B-Kommunikation im DACH-Raum: "Sie"-Anrede im Erstkontakt, formeller Ton
- Österreich: "Sehr geehrte/r", Deutschland: "Sehr geehrte/r", Schweiz: "Geschätzte/r"

### Deutsche & österreichische Jobtitel
- C-Level: Geschäftsführer (GF), Vorstand, CEO, CFO, CTO, CIO, COO
- Eigentümer: Inhaber, Gesellschafter, Prokurist, Gründer
- Leitung: Leiter/Leiterin, Abteilungsleiter, Bereichsleiter, Head of
- Management: Direktor, Manager, Teamleiter, Gruppenleiter
- Spezialisten: Referent, Sachbearbeiter, Berater, Consultant

### Regionale Branchenmuster
- Österreich (AT): Tourismus, Energie, Maschinenbau, Lebensmittel, IT-Dienstleistungen, Bau
- Deutschland (DE): Automotive, Maschinenbau, Chemie, Elektrotechnik, Logistik, Pharma
- Schweiz (CH): Pharma, Finance/Banking, Medtech, Uhren/Luxus, Versicherungen

### Unternehmensregister & Quellen
- Österreich: Firmenbuch (firmenbuch.at), WKO (wko.at), Herold
- Deutschland: Handelsregister (handelsregister.de), IHK, Bundesanzeiger
- Schweiz: Zefix (zefix.ch), Handelsregisteramt

### Firmengröße-Klassifizierung (EU-Standard)
- Kleinstunternehmen: 1-9 Mitarbeiter
- Kleine Unternehmen: 10-49 Mitarbeiter
- Mittlere Unternehmen: 50-249 Mitarbeiter (KMU-Grenze)
- Großunternehmen: 250+ Mitarbeiter`

function buildBusinessContext(business: Partial<BusinessProfile>): string {
  const lines = ['## Unternehmensprofil']
  if (business.company_name) lines.push(`- Firma: ${business.company_name}`)
  if (business.industry) lines.push(`- Branche: ${business.industry}`)
  if (business.description) lines.push(`- Beschreibung: ${business.description}`)
  if (business.product_summary) lines.push(`- Produkt/Service: ${business.product_summary}`)
  if (business.value_proposition) lines.push(`- Value Proposition: ${business.value_proposition}`)
  if (business.target_market) lines.push(`- Zielmarkt: ${business.target_market}`)
  if (business.website_url) lines.push(`- Website: ${business.website_url}`)
  return lines.length > 1 ? lines.join('\n') : ''
}

function buildIcpContext(icp: Partial<IcpProfile>): string {
  const lines = ['## Ideal Customer Profile (ICP)']
  const fields: { label: string; value: string[] | null | undefined }[] = [
    { label: 'Zielbranchen', value: icp.industries },
    { label: 'Firmengrößen', value: icp.company_sizes },
    { label: 'Regionen', value: icp.regions },
    { label: 'Jobtitel', value: icp.job_titles },
    { label: 'Seniority-Level', value: icp.seniority_levels },
    { label: 'Tech Stack', value: icp.tech_stack },
    { label: 'Umsatzklassen', value: icp.revenue_ranges },
    { label: 'Funding-Stages', value: icp.funding_stages },
    { label: 'Keywords', value: icp.keywords },
  ]

  for (const f of fields) {
    if (f.value && f.value.length > 0) {
      lines.push(`- ${f.label}: ${f.value.join(', ')}`)
    }
  }

  return lines.length > 1 ? lines.join('\n') : ''
}

/**
 * Builds a central system prompt with dynamic user/business context and static DACH knowledge.
 * Used as the single source of truth for all AI endpoints.
 */
export function buildSystemPrompt(role: string, ctx: SystemPromptContext = {}): string {
  const sections = [
    `Du bist ${role}, spezialisiert auf den DACH-Markt (Deutschland, Österreich, Schweiz). Antworte immer auf Deutsch.`,
  ]

  if (ctx.business) {
    const businessCtx = buildBusinessContext(ctx.business)
    if (businessCtx) sections.push(businessCtx)
  }

  if (ctx.icp) {
    const icpCtx = buildIcpContext(ctx.icp)
    if (icpCtx) sections.push(icpCtx)
  }

  sections.push(DACH_KNOWLEDGE)

  return sections.join('\n\n')
}
