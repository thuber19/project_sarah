import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  urlSchema,
  profileSchema,
  discoveryFormSchema,
  onboardingProfileSchema,
  onboardingIcpSchema,
  communicationStyleSchema,
} from './schemas'

// ---------------------------------------------------------------------------
// emailSchema
// ---------------------------------------------------------------------------

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true)
  })

  it('accepts email with subdomain', () => {
    expect(emailSchema.safeParse('user@mail.example.co.at').success).toBe(true)
  })

  it('accepts email with plus alias', () => {
    expect(emailSchema.safeParse('user+tag@example.com').success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false)
  })

  it('rejects email missing domain', () => {
    expect(emailSchema.safeParse('user@').success).toBe(false)
  })

  it('rejects email missing @', () => {
    expect(emailSchema.safeParse('userexample.com').success).toBe(false)
  })

  it('returns German error message on invalid input', () => {
    const result = emailSchema.safeParse('bad')
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Ungültige E-Mail-Adresse')
    }
  })
})

// ---------------------------------------------------------------------------
// urlSchema
// ---------------------------------------------------------------------------

describe('urlSchema', () => {
  it('accepts valid https URL', () => {
    expect(urlSchema.safeParse('https://example.com').success).toBe(true)
  })

  it('accepts valid http URL', () => {
    expect(urlSchema.safeParse('http://example.com').success).toBe(true)
  })

  it('accepts URL with path', () => {
    expect(urlSchema.safeParse('https://example.com/path/to/page').success).toBe(true)
  })

  it('accepts empty string (optional URL)', () => {
    expect(urlSchema.safeParse('').success).toBe(true)
  })

  it('rejects invalid URL', () => {
    expect(urlSchema.safeParse('not-a-url').success).toBe(false)
  })

  it('rejects URL without protocol', () => {
    expect(urlSchema.safeParse('example.com').success).toBe(false)
  })

  it('returns German error message on invalid input', () => {
    const result = urlSchema.safeParse('bad-url')
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Ungültige URL')
    }
  })
})

// ---------------------------------------------------------------------------
// profileSchema
// ---------------------------------------------------------------------------

describe('profileSchema', () => {
  const validProfile = {
    company_name: 'Acme GmbH',
    industry: 'Software',
    description: 'We build things',
    target_market: 'DACH',
    website_url: 'https://acme.at',
  }

  it('accepts valid profile with all fields', () => {
    const result = profileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
  })

  it('accepts profile with only required company_name', () => {
    const result = profileSchema.safeParse({ company_name: 'Acme GmbH' })
    expect(result.success).toBe(true)
  })

  it('accepts optional fields as undefined', () => {
    const result = profileSchema.safeParse({
      company_name: 'Acme GmbH',
      industry: undefined,
      description: undefined,
      target_market: undefined,
      website_url: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty company_name', () => {
    const result = profileSchema.safeParse({ company_name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Firmenname ist erforderlich')
    }
  })

  it('rejects missing company_name', () => {
    const result = profileSchema.safeParse({ industry: 'Software' })
    expect(result.success).toBe(false)
  })

  it('accepts empty string as website_url', () => {
    const result = profileSchema.safeParse({
      company_name: 'Acme',
      website_url: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid website_url', () => {
    const result = profileSchema.safeParse({
      company_name: 'Acme',
      website_url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('parses output shape correctly', () => {
    const result = profileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validProfile)
    }
  })
})

// ---------------------------------------------------------------------------
// onboardingProfileSchema
// ---------------------------------------------------------------------------

describe('onboardingProfileSchema', () => {
  const validOnboardingProfile = {
    website_url: 'https://acme.at',
    company_name: 'Acme GmbH',
    description: 'We build things',
    industry: 'Software',
    product_summary: 'SaaS platform for lead scoring',
    value_proposition: 'Automate your lead pipeline',
    target_market: 'DACH SMBs',
    raw_scraped_content: 'Some scraped content from the website',
  }

  it('accepts valid onboarding profile with all fields', () => {
    const result = onboardingProfileSchema.safeParse(validOnboardingProfile)
    expect(result.success).toBe(true)
  })

  it('requires website_url', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      website_url: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires company_name', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      company_name: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires description', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires industry', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      industry: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires product_summary', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      product_summary: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires value_proposition', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      value_proposition: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires target_market', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      target_market: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts empty raw_scraped_content', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      raw_scraped_content: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const result = onboardingProfileSchema.safeParse({ company_name: 'Acme GmbH' })
    expect(result.success).toBe(false)
  })

  it('returns German error for empty company_name', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      company_name: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Firmenname ist erforderlich')
    }
  })

  it('returns German error for empty description', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      description: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Beschreibung ist erforderlich')
    }
  })

  it('returns German error for empty industry', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      industry: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Branche ist erforderlich')
    }
  })

  it('accepts multi-sentence Fließtext description from AI analysis', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      description:
        'Acme GmbH ist ein B2B-SaaS-Unternehmen, das Vertriebsteams bei der Lead-Qualifizierung unterstützt. Die Plattform richtet sich an mittelständische Unternehmen im DACH-Raum.',
    })
    expect(result.success).toBe(true)
  })

  it('returns German error for empty product_summary', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      product_summary: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Produktübersicht ist erforderlich')
    }
  })

  it('returns German error for empty value_proposition', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      value_proposition: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Nutzenversprechen ist erforderlich')
    }
  })

  it('returns German error for empty target_market', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      target_market: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Zielmarkt ist erforderlich')
    }
  })

  it('returns German error for empty website_url', () => {
    const result = onboardingProfileSchema.safeParse({
      ...validOnboardingProfile,
      website_url: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Website-URL ist erforderlich')
    }
  })
})

// ---------------------------------------------------------------------------
// onboardingIcpSchema
// ---------------------------------------------------------------------------

describe('onboardingIcpSchema', () => {
  const validOnboardingIcp = {
    job_titles: ['CTO', 'VP Engineering'],
    seniority_levels: ['C-Level'],
    industries: ['SaaS'],
    company_sizes: ['10-50'],
    regions: ['DACH'],
  }

  it('accepts valid onboarding ICP with all fields', () => {
    const result = onboardingIcpSchema.safeParse(validOnboardingIcp)
    expect(result.success).toBe(true)
  })

  it('accepts all empty arrays', () => {
    const result = onboardingIcpSchema.safeParse({
      job_titles: [],
      seniority_levels: [],
      industries: [],
      company_sizes: [],
      regions: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const result = onboardingIcpSchema.safeParse({ job_titles: ['CTO'] })
    expect(result.success).toBe(false)
  })

  it('rejects non-string items in arrays', () => {
    const result = onboardingIcpSchema.safeParse({
      ...validOnboardingIcp,
      job_titles: [123],
    })
    expect(result.success).toBe(false)
  })

  it('does not accept tech_stack field (not in onboarding schema)', () => {
    const result = onboardingIcpSchema.safeParse({
      ...validOnboardingIcp,
      tech_stack: ['React'],
    })
    // Zod strips unknown keys by default, so it parses successfully
    // but the output should not include tech_stack
    expect(result.success).toBe(true)
    if (result.success) {
      expect('tech_stack' in result.data).toBe(false)
    }
  })

  it('accepts free-text company_sizes like "10-100" (text input, not dropdown)', () => {
    const result = onboardingIcpSchema.safeParse({
      ...validOnboardingIcp,
      company_sizes: ['10-100', '500+', 'Mittelstand'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company_sizes).toEqual(['10-100', '500+', 'Mittelstand'])
    }
  })

  it('accepts single free-text company_size entry', () => {
    const result = onboardingIcpSchema.safeParse({
      ...validOnboardingIcp,
      company_sizes: ['50-500 Mitarbeiter'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company_sizes).toEqual(['50-500 Mitarbeiter'])
    }
  })

  it('requires all five ICP array fields to be present', () => {
    // Missing seniority_levels, industries, company_sizes, regions
    const result = onboardingIcpSchema.safeParse({ job_titles: ['CTO'] })
    expect(result.success).toBe(false)

    // Missing only regions
    const result2 = onboardingIcpSchema.safeParse({
      job_titles: ['CTO'],
      seniority_levels: ['C-Level'],
      industries: ['SaaS'],
      company_sizes: ['10-50'],
    })
    expect(result2.success).toBe(false)
  })

  it('parses output shape correctly', () => {
    const result = onboardingIcpSchema.safeParse(validOnboardingIcp)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validOnboardingIcp)
    }
  })
})

// ---------------------------------------------------------------------------
// discoveryFormSchema
// ---------------------------------------------------------------------------

describe('discoveryFormSchema', () => {
  const validForm = {
    industries: 'SaaS, FinTech',
    companySize: '10-50',
    region: 'DACH',
    technologies: 'React, TypeScript',
    keywords: 'AI, Automation',
  }

  it('accepts valid discovery form', () => {
    const result = discoveryFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('rejects empty industries', () => {
    const result = discoveryFormSchema.safeParse({ ...validForm, industries: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Branchen sind erforderlich')
    }
  })

  it('rejects empty companySize', () => {
    const result = discoveryFormSchema.safeParse({ ...validForm, companySize: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Unternehmensgröße ist erforderlich')
    }
  })

  it('rejects empty region', () => {
    const result = discoveryFormSchema.safeParse({ ...validForm, region: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Region ist erforderlich')
    }
  })

  it('allows optional technologies as undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { technologies: _technologies, ...rest } = validForm
    const result = discoveryFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('allows optional keywords as undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { keywords: _keywords, ...rest } = validForm
    const result = discoveryFormSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('accepts form with only required fields', () => {
    const result = discoveryFormSchema.safeParse({
      industries: 'SaaS',
      companySize: '10-50',
      region: 'DACH',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields entirely', () => {
    const result = discoveryFormSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('parses output shape correctly', () => {
    const result = discoveryFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validForm)
    }
  })
})

// ---------------------------------------------------------------------------
// communicationStyleSchema
// ---------------------------------------------------------------------------

describe('communicationStyleSchema', () => {
  const fullStyle = {
    email_example: 'Hallo Herr Müller, ...',
    email_signature: 'Mit freundlichen Grüßen, Sarah',
    writing_style: 'formal',
    salutation_preference: 'sie' as const,
    voice_example: 'Guten Tag, hier ist Sarah von...',
    speaking_style: 'freundlich und professionell',
    opening_phrase: 'Darf ich Ihnen kurz vorstellen...',
    call_to_action: 'Wollen wir einen Termin vereinbaren?',
    additional_notes: 'DACH-Markt, immer Sie-Ansprache',
  }

  it('accepts full communication style data', () => {
    const result = communicationStyleSchema.safeParse(fullStyle)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(fullStyle)
    }
  })

  it('accepts empty object — all fields are optional', () => {
    const result = communicationStyleSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('applies defaults correctly for empty object', () => {
    const result = communicationStyleSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        email_example: '',
        email_signature: '',
        writing_style: '',
        salutation_preference: 'sie',
        voice_example: '',
        speaking_style: '',
        opening_phrase: '',
        call_to_action: '',
        additional_notes: '',
      })
    }
  })

  it('accepts "du" as salutation_preference', () => {
    const result = communicationStyleSchema.safeParse({
      salutation_preference: 'du',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.salutation_preference).toBe('du')
    }
  })

  it('accepts "sie" as salutation_preference', () => {
    const result = communicationStyleSchema.safeParse({
      salutation_preference: 'sie',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.salutation_preference).toBe('sie')
    }
  })

  it('rejects invalid salutation_preference value', () => {
    const result = communicationStyleSchema.safeParse({
      salutation_preference: 'ihr',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-string salutation_preference', () => {
    const result = communicationStyleSchema.safeParse({
      salutation_preference: 123,
    })
    expect(result.success).toBe(false)
  })

  it('defaults salutation_preference to "sie" when omitted', () => {
    const result = communicationStyleSchema.safeParse({
      email_example: 'Hallo...',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.salutation_preference).toBe('sie')
    }
  })

  it('preserves provided values and fills defaults for omitted fields', () => {
    const partial = {
      email_example: 'Hallo Herr Schmidt',
      salutation_preference: 'du' as const,
    }
    const result = communicationStyleSchema.safeParse(partial)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email_example).toBe('Hallo Herr Schmidt')
      expect(result.data.salutation_preference).toBe('du')
      expect(result.data.email_signature).toBe('')
      expect(result.data.writing_style).toBe('')
      expect(result.data.voice_example).toBe('')
      expect(result.data.speaking_style).toBe('')
      expect(result.data.opening_phrase).toBe('')
      expect(result.data.call_to_action).toBe('')
      expect(result.data.additional_notes).toBe('')
    }
  })
})
