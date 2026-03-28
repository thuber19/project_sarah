// @vitest-environment node
import { describe, it, expect } from 'vitest'

import { getGradeForScore, mapLegacyGrade } from '@/lib/scoring/grade'

describe('getGradeForScore', () => {
  it('returns TOP_MATCH for score >= 70', () => {
    expect(getGradeForScore(95)).toBe('TOP_MATCH')
  })

  it('returns GOOD_FIT for score 40-69', () => {
    expect(getGradeForScore(55)).toBe('GOOD_FIT')
  })

  it('returns POOR_FIT for score < 40', () => {
    expect(getGradeForScore(20)).toBe('POOR_FIT')
  })

  // Boundary tests
  it('handles boundary: 70 is TOP_MATCH', () => {
    expect(getGradeForScore(70)).toBe('TOP_MATCH')
  })

  it('handles boundary: 69 is GOOD_FIT', () => {
    expect(getGradeForScore(69)).toBe('GOOD_FIT')
  })

  it('handles boundary: 40 is GOOD_FIT', () => {
    expect(getGradeForScore(40)).toBe('GOOD_FIT')
  })

  it('handles boundary: 39 is POOR_FIT', () => {
    expect(getGradeForScore(39)).toBe('POOR_FIT')
  })

  it('handles boundary: 0 is POOR_FIT', () => {
    expect(getGradeForScore(0)).toBe('POOR_FIT')
  })

  it('handles boundary: 100 is TOP_MATCH', () => {
    expect(getGradeForScore(100)).toBe('TOP_MATCH')
  })
})

describe('mapLegacyGrade', () => {
  it('maps HOT to TOP_MATCH', () => {
    expect(mapLegacyGrade('HOT')).toBe('TOP_MATCH')
  })

  it('maps QUALIFIED to TOP_MATCH', () => {
    expect(mapLegacyGrade('QUALIFIED')).toBe('TOP_MATCH')
  })

  it('maps ENGAGED to GOOD_FIT', () => {
    expect(mapLegacyGrade('ENGAGED')).toBe('GOOD_FIT')
  })

  it('maps POTENTIAL to GOOD_FIT', () => {
    expect(mapLegacyGrade('POTENTIAL')).toBe('GOOD_FIT')
  })

  it('maps POOR to POOR_FIT', () => {
    expect(mapLegacyGrade('POOR')).toBe('POOR_FIT')
  })

  it('maps POOR_FIT to POOR_FIT', () => {
    expect(mapLegacyGrade('POOR_FIT')).toBe('POOR_FIT')
  })

  it('maps unknown grade to POOR_FIT', () => {
    expect(mapLegacyGrade('UNKNOWN')).toBe('POOR_FIT')
  })
})
