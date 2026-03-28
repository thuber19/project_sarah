// @vitest-environment node
import { describe, it, expect } from 'vitest'

import { getGradeForScore, mapLegacyGrade } from '@/lib/scoring/grade'

describe('getGradeForScore', () => {
  it('returns TOP_MATCH for score >= 60', () => {
    expect(getGradeForScore(95)).toBe('TOP_MATCH')
  })

  it('returns GOOD_FIT for score 30-59', () => {
    expect(getGradeForScore(45)).toBe('GOOD_FIT')
  })

  it('returns POOR_FIT for score < 30', () => {
    expect(getGradeForScore(20)).toBe('POOR_FIT')
  })

  // Boundary tests
  it('handles boundary: 60 is TOP_MATCH', () => {
    expect(getGradeForScore(60)).toBe('TOP_MATCH')
  })

  it('handles boundary: 59 is GOOD_FIT', () => {
    expect(getGradeForScore(59)).toBe('GOOD_FIT')
  })

  it('handles boundary: 30 is GOOD_FIT', () => {
    expect(getGradeForScore(30)).toBe('GOOD_FIT')
  })

  it('handles boundary: 29 is POOR_FIT', () => {
    expect(getGradeForScore(29)).toBe('POOR_FIT')
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
