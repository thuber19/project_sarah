import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  urlSchema,
  profileSchema,
  icpSchema,
  discoveryFormSchema,
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
// icpSchema
// ---------------------------------------------------------------------------

describe('icpSchema', () => {
  const validIcp = {
    industries: ['SaaS', 'FinTech'],
    company_sizes: ['10-50', '50-200'],
    regions: ['DACH'],
    job_titles: ['CTO'],
    seniority_levels: ['C-Level'],
    tech_stack: ['React', 'Node.js'],
  }

  it('accepts valid ICP with all fields', () => {
    const result = icpSchema.safeParse(validIcp)
    expect(result.success).toBe(true)
  })

  it('requires at least one industry', () => {
    const result = icpSchema.safeParse({ ...validIcp, industries: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Mindestens eine Branche erforderlich')
    }
  })

  it('requires at least one region', () => {
    const result = icpSchema.safeParse({ ...validIcp, regions: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      expect(messages).toContain('Mindestens eine Region erforderlich')
    }
  })

  it('accepts empty arrays for optional list fields', () => {
    const result = icpSchema.safeParse({
      industries: ['SaaS'],
      company_sizes: [],
      regions: ['DACH'],
      job_titles: [],
      seniority_levels: [],
      tech_stack: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing industries field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { industries: _industries, ...rest } = validIcp
    const result = icpSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects missing regions field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { regions: _regions, ...rest } = validIcp
    const result = icpSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects non-string items in industries', () => {
    const result = icpSchema.safeParse({ ...validIcp, industries: [123] })
    expect(result.success).toBe(false)
  })

  it('parses output shape correctly', () => {
    const result = icpSchema.safeParse(validIcp)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validIcp)
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
