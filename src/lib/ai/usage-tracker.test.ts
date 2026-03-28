import { describe, it, expect } from 'vitest'
import { calculateCost, buildUsageMetadata } from './usage-tracker'

describe('usage-tracker', () => {
  describe('calculateCost', () => {
    it('calculates cost for Haiku model', () => {
      const cost = calculateCost({ inputTokens: 1000, outputTokens: 500 })
      // 1000/1M * 0.80 + 500/1M * 4.00 = 0.0008 + 0.002 = 0.0028
      expect(cost).toBeCloseTo(0.0028, 6)
    })

    it('returns 0 for zero tokens', () => {
      expect(calculateCost({ inputTokens: 0, outputTokens: 0 })).toBe(0)
    })

    it('handles large token counts', () => {
      const cost = calculateCost({ inputTokens: 1_000_000, outputTokens: 1_000_000 })
      // 1M/1M * 0.80 + 1M/1M * 4.00 = 0.80 + 4.00 = 4.80
      expect(cost).toBeCloseTo(4.8, 6)
    })
  })

  describe('buildUsageMetadata', () => {
    it('builds complete metadata', () => {
      const usage = { inputTokens: 1000, outputTokens: 500, totalTokens: 1500 }
      const meta = buildUsageMetadata(usage)
      expect(meta.inputTokens).toBe(1000)
      expect(meta.outputTokens).toBe(500)
      expect(meta.totalTokens).toBe(1500)
      expect(meta.estimatedCostUsd).toBeCloseTo(0.0028, 6)
    })

    it('includes estimated cost of zero for zero tokens', () => {
      const usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
      const meta = buildUsageMetadata(usage)
      expect(meta.estimatedCostUsd).toBe(0)
    })

    it('defaults undefined token counts to 0', () => {
      const usage = { inputTokens: undefined, outputTokens: undefined, totalTokens: undefined }
      const meta = buildUsageMetadata(usage)
      expect(meta.inputTokens).toBe(0)
      expect(meta.outputTokens).toBe(0)
      expect(meta.totalTokens).toBe(0)
      expect(meta.estimatedCostUsd).toBe(0)
    })
  })
})
