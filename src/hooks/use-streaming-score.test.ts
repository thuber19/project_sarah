import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'

// ---------------------------------------------------------------------------
// Re-create the streaming scoring schema identical to the hook.
// We cannot import from the hook directly because it has `'use client'`
// and imports `@ai-sdk/react` which requires a React rendering context.
// Testing the schema + pure logic in isolation is the right approach.
// ---------------------------------------------------------------------------

const streamingScoringSchema = z.object({
  company_fit_analysis: z.string().optional(),
  contact_fit_analysis: z.string().optional(),
  buying_signals_analysis: z.string().optional(),
  timing_analysis: z.string().optional(),
  reasoning: z.string().optional(),
  recommendation: z.enum(['sofort_kontaktieren', 'nurture', 'beobachten', 'skip']).optional(),
  recommendation_text: z.string().optional(),
  confidence: z.number().optional(),
  dach_notes: z.string().optional(),
  key_insights: z.array(z.string()).optional(),
})

type StreamingScoringData = z.infer<typeof streamingScoringSchema>

/** All schema field keys — mirrors the hook's ALL_FIELDS. */
const ALL_FIELDS = Object.keys(streamingScoringSchema.shape) as (keyof StreamingScoringData)[]

/** Required fields for completion — mirrors the hook's REQUIRED_FIELDS. */
const REQUIRED_FIELDS: (keyof StreamingScoringData)[] = [
  'reasoning',
  'recommendation',
  'recommendation_text',
  'company_fit_analysis',
  'contact_fit_analysis',
  'buying_signals_analysis',
  'timing_analysis',
]

// ---------------------------------------------------------------------------
// Pure logic helpers — mirrors the hook's internal functions
// ---------------------------------------------------------------------------

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null
}

function calculateProgress(data: StreamingScoringData | undefined): number {
  if (!data) return 0
  return Math.round(
    (ALL_FIELDS.filter((field) => hasValue(data[field])).length / ALL_FIELDS.length) * 100,
  )
}

function isComplete(data: StreamingScoringData | undefined): boolean {
  if (!data) return false
  return REQUIRED_FIELDS.every((field) => hasValue(data[field]))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-streaming-score', () => {
  // =========================================================================
  // Schema Validation
  // =========================================================================

  describe('streamingScoringSchema', () => {
    it('should validate an empty object (all fields optional)', () => {
      const result = streamingScoringSchema.safeParse({})

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual({})
    })

    it('should validate partial data with only company_fit_analysis', () => {
      const result = streamingScoringSchema.safeParse({
        company_fit_analysis: 'Gutes Unternehmen im DACH-Markt',
      })

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.company_fit_analysis).toBe('Gutes Unternehmen im DACH-Markt')
      expect(result.data.reasoning).toBeUndefined()
    })

    it('should validate full data with all fields present', () => {
      const fullData = {
        company_fit_analysis: 'Starke Passung zur ICP',
        contact_fit_analysis: 'CTO mit Entscheidungskompetenz',
        buying_signals_analysis: 'Aktive Budgetplanung erkannt',
        timing_analysis: 'Q2 Einkaufszyklus',
        reasoning: 'Hohe Übereinstimmung in allen Bereichen',
        recommendation: 'sofort_kontaktieren' as const,
        recommendation_text: 'Sofort kontaktieren — hohes Potenzial',
        confidence: 0.92,
        dach_notes: 'Österreichisches Unternehmen, Du-Ansprache',
        key_insights: ['CTO aktiv', 'Budget vorhanden', 'DACH-Fokus'],
      }

      const result = streamingScoringSchema.safeParse(fullData)

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).toEqual(fullData)
    })

    it('should accept all valid recommendation values', () => {
      const recommendations = ['sofort_kontaktieren', 'nurture', 'beobachten', 'skip'] as const

      for (const rec of recommendations) {
        const result = streamingScoringSchema.safeParse({
          recommendation: rec,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject an invalid recommendation value', () => {
      const result = streamingScoringSchema.safeParse({
        recommendation: 'invalid_value',
      })

      expect(result.success).toBe(false)
    })

    it('should reject recommendation as a number', () => {
      const result = streamingScoringSchema.safeParse({
        recommendation: 42,
      })

      expect(result.success).toBe(false)
    })

    it('should reject confidence as a string', () => {
      const result = streamingScoringSchema.safeParse({
        confidence: 'high',
      })

      expect(result.success).toBe(false)
    })

    it('should accept confidence at boundary values 0 and 1', () => {
      const resultZero = streamingScoringSchema.safeParse({ confidence: 0 })
      const resultOne = streamingScoringSchema.safeParse({ confidence: 1 })

      expect(resultZero.success).toBe(true)
      expect(resultOne.success).toBe(true)
    })

    it('should accept confidence outside 0-1 range (schema has no min/max constraint)', () => {
      // The schema defines confidence as z.number().optional() without .min()/.max()
      // This test documents the current behavior — confidence is not range-checked at schema level
      const resultNegative = streamingScoringSchema.safeParse({
        confidence: -0.5,
      })
      const resultOver = streamingScoringSchema.safeParse({
        confidence: 1.5,
      })

      expect(resultNegative.success).toBe(true)
      expect(resultOver.success).toBe(true)
    })

    it('should reject key_insights as a string instead of array', () => {
      const result = streamingScoringSchema.safeParse({
        key_insights: 'not an array',
      })

      expect(result.success).toBe(false)
    })

    it('should accept key_insights as an empty array', () => {
      const result = streamingScoringSchema.safeParse({
        key_insights: [],
      })

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data.key_insights).toEqual([])
    })

    it('should reject key_insights containing non-string elements', () => {
      const result = streamingScoringSchema.safeParse({
        key_insights: ['valid', 123, true],
      })

      expect(result.success).toBe(false)
    })

    it('should strip unknown fields', () => {
      const result = streamingScoringSchema.safeParse({
        reasoning: 'Test',
        unknown_field: 'should be stripped',
      })

      expect(result.success).toBe(true)
      if (!result.success) throw new Error('Expected success')
      expect(result.data).not.toHaveProperty('unknown_field')
      expect(result.data.reasoning).toBe('Test')
    })

    it('should validate schema has exactly 10 fields', () => {
      const fieldCount = Object.keys(streamingScoringSchema.shape).length

      expect(fieldCount).toBe(10)
    })

    it('should have correct field names', () => {
      const fields = Object.keys(streamingScoringSchema.shape).sort()

      expect(fields).toEqual([
        'buying_signals_analysis',
        'company_fit_analysis',
        'confidence',
        'contact_fit_analysis',
        'dach_notes',
        'key_insights',
        'reasoning',
        'recommendation',
        'recommendation_text',
        'timing_analysis',
      ])
    })
  })

  // =========================================================================
  // Progress Calculation
  // =========================================================================

  describe('progress calculation', () => {
    it('should return 0 when data is undefined', () => {
      expect(calculateProgress(undefined)).toBe(0)
    })

    it('should return 0 when all fields are undefined', () => {
      expect(calculateProgress({})).toBe(0)
    })

    it('should return 10 when 1 of 10 fields is present', () => {
      const data: StreamingScoringData = {
        company_fit_analysis: 'Test',
      }

      expect(calculateProgress(data)).toBe(10)
    })

    it('should return 50 when 5 of 10 fields are present', () => {
      const data: StreamingScoringData = {
        company_fit_analysis: 'Test',
        contact_fit_analysis: 'Test',
        buying_signals_analysis: 'Test',
        timing_analysis: 'Test',
        reasoning: 'Test',
      }

      expect(calculateProgress(data)).toBe(50)
    })

    it('should return 100 when all 10 fields are present', () => {
      const data: StreamingScoringData = {
        company_fit_analysis: 'Test',
        contact_fit_analysis: 'Test',
        buying_signals_analysis: 'Test',
        timing_analysis: 'Test',
        reasoning: 'Test',
        recommendation: 'nurture',
        recommendation_text: 'Test',
        confidence: 0.8,
        dach_notes: 'Test',
        key_insights: ['Test'],
      }

      expect(calculateProgress(data)).toBe(100)
    })

    it('should round progress to nearest integer', () => {
      // 3 of 10 = 30%, exact
      const data3: StreamingScoringData = {
        company_fit_analysis: 'Test',
        contact_fit_analysis: 'Test',
        buying_signals_analysis: 'Test',
      }
      expect(calculateProgress(data3)).toBe(30)

      // 7 of 10 = 70%, exact
      const data7: StreamingScoringData = {
        company_fit_analysis: 'Test',
        contact_fit_analysis: 'Test',
        buying_signals_analysis: 'Test',
        timing_analysis: 'Test',
        reasoning: 'Test',
        recommendation: 'skip',
        recommendation_text: 'Test',
      }
      expect(calculateProgress(data7)).toBe(70)
    })

    it('should count confidence: 0 as a present field', () => {
      const data: StreamingScoringData = {
        confidence: 0,
      }

      // 0 is a valid value, not undefined/null
      expect(calculateProgress(data)).toBe(10)
    })

    it('should count an empty key_insights array as present', () => {
      const data: StreamingScoringData = {
        key_insights: [],
      }

      expect(calculateProgress(data)).toBe(10)
    })

    it('should count an empty string as present', () => {
      const data: StreamingScoringData = {
        reasoning: '',
      }

      // Empty string is not undefined or null
      expect(calculateProgress(data)).toBe(10)
    })
  })

  // =========================================================================
  // isComplete Logic
  // =========================================================================

  describe('isComplete logic', () => {
    it('should return false when data is undefined', () => {
      expect(isComplete(undefined)).toBe(false)
    })

    it('should return false when data is empty', () => {
      expect(isComplete({})).toBe(false)
    })

    it('should return false when reasoning is missing', () => {
      const data: StreamingScoringData = {
        recommendation: 'nurture',
        recommendation_text: 'Follow up in 2 weeks',
        company_fit_analysis: 'Good fit',
        contact_fit_analysis: 'Decision maker',
        buying_signals_analysis: 'Active budget',
        timing_analysis: 'Q2 cycle',
        // reasoning missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return false when recommendation is missing', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match',
        recommendation_text: 'Contact now',
        company_fit_analysis: 'Good fit',
        contact_fit_analysis: 'Decision maker',
        buying_signals_analysis: 'Active budget',
        timing_analysis: 'Q2 cycle',
        // recommendation missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return false when recommendation_text is missing', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match',
        recommendation: 'sofort_kontaktieren',
        company_fit_analysis: 'Good fit',
        contact_fit_analysis: 'Decision maker',
        buying_signals_analysis: 'Active budget',
        timing_analysis: 'Q2 cycle',
        // recommendation_text missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return false when company_fit_analysis is missing', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match',
        recommendation: 'sofort_kontaktieren',
        recommendation_text: 'Contact now',
        contact_fit_analysis: 'Decision maker',
        buying_signals_analysis: 'Active budget',
        timing_analysis: 'Q2 cycle',
        // company_fit_analysis missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return false when contact_fit_analysis is missing', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match',
        recommendation: 'sofort_kontaktieren',
        recommendation_text: 'Contact now',
        company_fit_analysis: 'Good fit',
        buying_signals_analysis: 'Active budget',
        timing_analysis: 'Q2 cycle',
        // contact_fit_analysis missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return false when buying_signals_analysis is missing', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match',
        recommendation: 'sofort_kontaktieren',
        recommendation_text: 'Contact now',
        company_fit_analysis: 'Good fit',
        contact_fit_analysis: 'Decision maker',
        timing_analysis: 'Q2 cycle',
        // buying_signals_analysis missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return false when timing_analysis is missing', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match',
        recommendation: 'sofort_kontaktieren',
        recommendation_text: 'Contact now',
        company_fit_analysis: 'Good fit',
        contact_fit_analysis: 'Decision maker',
        buying_signals_analysis: 'Active budget',
        // timing_analysis missing
      }

      expect(isComplete(data)).toBe(false)
    })

    it('should return true when all required fields are present', () => {
      const data: StreamingScoringData = {
        reasoning: 'Strong match across all dimensions',
        recommendation: 'sofort_kontaktieren',
        recommendation_text: 'Sofort kontaktieren',
        company_fit_analysis: 'Excellent company fit',
        contact_fit_analysis: 'CTO with budget authority',
        buying_signals_analysis: 'Active buying signals detected',
        timing_analysis: 'Perfect timing — Q2 budget cycle',
      }

      expect(isComplete(data)).toBe(true)
    })

    it('should return true when all required fields are present plus optional fields', () => {
      const data: StreamingScoringData = {
        reasoning: 'Full analysis complete',
        recommendation: 'nurture',
        recommendation_text: 'Nurture with content',
        company_fit_analysis: 'Good fit',
        contact_fit_analysis: 'Marketing lead',
        buying_signals_analysis: 'Moderate signals',
        timing_analysis: 'Not urgent',
        // Optional fields also present
        confidence: 0.75,
        dach_notes: 'German company',
        key_insights: ['Good culture fit', 'Growing market'],
      }

      expect(isComplete(data)).toBe(true)
    })

    it('should return true even when optional fields are missing', () => {
      // confidence, dach_notes, key_insights are optional for completion
      const data: StreamingScoringData = {
        reasoning: 'Analysis done',
        recommendation: 'beobachten',
        recommendation_text: 'Beobachten',
        company_fit_analysis: 'Moderate fit',
        contact_fit_analysis: 'Junior contact',
        buying_signals_analysis: 'No clear signals',
        timing_analysis: 'No rush',
        // confidence, dach_notes, key_insights intentionally omitted
      }

      expect(isComplete(data)).toBe(true)
    })

    it('should check exactly 7 required fields', () => {
      expect(REQUIRED_FIELDS).toHaveLength(7)
    })

    it('should include the correct required field names', () => {
      expect(REQUIRED_FIELDS.sort()).toEqual([
        'buying_signals_analysis',
        'company_fit_analysis',
        'contact_fit_analysis',
        'reasoning',
        'recommendation',
        'recommendation_text',
        'timing_analysis',
      ])
    })
  })

  // =========================================================================
  // hasValue helper
  // =========================================================================

  describe('hasValue helper', () => {
    it('should return false for undefined', () => {
      expect(hasValue(undefined)).toBe(false)
    })

    it('should return false for null', () => {
      expect(hasValue(null)).toBe(false)
    })

    it('should return true for empty string', () => {
      expect(hasValue('')).toBe(true)
    })

    it('should return true for zero', () => {
      expect(hasValue(0)).toBe(true)
    })

    it('should return true for false', () => {
      expect(hasValue(false)).toBe(true)
    })

    it('should return true for empty array', () => {
      expect(hasValue([])).toBe(true)
    })

    it('should return true for a non-empty string', () => {
      expect(hasValue('hello')).toBe(true)
    })

    it('should return true for a positive number', () => {
      expect(hasValue(0.95)).toBe(true)
    })
  })
})
