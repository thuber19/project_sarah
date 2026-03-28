// @vitest-environment node
import { describe, it, expect } from 'vitest'

import { getGradeForScore } from '@/lib/scoring/grade'

describe('getGradeForScore', () => {
  it('returns HOT for score >= 80', () => {
    expect(getGradeForScore(95)).toBe('HOT')
  })

  it('returns QUALIFIED for score 65-79', () => {
    expect(getGradeForScore(70)).toBe('QUALIFIED')
  })

  it('returns ENGAGED for score 48-64', () => {
    expect(getGradeForScore(55)).toBe('ENGAGED')
  })

  it('returns POTENTIAL for score 30-47', () => {
    expect(getGradeForScore(35)).toBe('POTENTIAL')
  })

  it('returns POOR for score < 30', () => {
    expect(getGradeForScore(20)).toBe('POOR')
  })

  // Boundary tests
  it('handles boundary: 80 is HOT', () => {
    expect(getGradeForScore(80)).toBe('HOT')
  })

  it('handles boundary: 79 is QUALIFIED', () => {
    expect(getGradeForScore(79)).toBe('QUALIFIED')
  })

  it('handles boundary: 65 is QUALIFIED', () => {
    expect(getGradeForScore(65)).toBe('QUALIFIED')
  })

  it('handles boundary: 64 is ENGAGED', () => {
    expect(getGradeForScore(64)).toBe('ENGAGED')
  })

  it('handles boundary: 48 is ENGAGED', () => {
    expect(getGradeForScore(48)).toBe('ENGAGED')
  })

  it('handles boundary: 47 is POTENTIAL', () => {
    expect(getGradeForScore(47)).toBe('POTENTIAL')
  })

  it('handles boundary: 30 is POTENTIAL', () => {
    expect(getGradeForScore(30)).toBe('POTENTIAL')
  })

  it('handles boundary: 29 is POOR', () => {
    expect(getGradeForScore(29)).toBe('POOR')
  })

  it('handles boundary: 0 is POOR', () => {
    expect(getGradeForScore(0)).toBe('POOR')
  })

  it('handles boundary: 100 is HOT', () => {
    expect(getGradeForScore(100)).toBe('HOT')
  })
})
