import { describe, it, expect } from 'vitest'
import { PipelineTimer } from './timer'

describe('PipelineTimer', () => {
  it('records duration for a step', async () => {
    const timer = new PipelineTimer()
    timer.start('step1')
    // Small delay to ensure measurable duration
    await new Promise((r) => setTimeout(r, 10))
    timer.stop('step1')

    const metrics = timer.getMetrics()
    expect(metrics.step1).toBeGreaterThanOrEqual(0)
    expect(typeof metrics.step1).toBe('number')
  })

  it('records multiple steps', () => {
    const timer = new PipelineTimer()
    timer.start('a')
    timer.stop('a')
    timer.start('b')
    timer.stop('b')

    const metrics = timer.getMetrics()
    expect('a' in metrics).toBe(true)
    expect('b' in metrics).toBe(true)
  })

  it('ignores stop without start', () => {
    const timer = new PipelineTimer()
    timer.stop('unknown')
    expect(timer.getMetrics()).toEqual({})
  })

  it('returns integer milliseconds', () => {
    const timer = new PipelineTimer()
    timer.start('step')
    timer.stop('step')
    expect(Number.isInteger(timer.getMetrics().step)).toBe(true)
  })

  it('cleans up start marks after stop', () => {
    const timer = new PipelineTimer()
    timer.start('step')
    timer.stop('step')
    // Stopping again should not overwrite the duration
    timer.stop('step')
    const metrics = timer.getMetrics()
    expect(metrics.step).toBeGreaterThanOrEqual(0)
  })

  it('supports overlapping timers', async () => {
    const timer = new PipelineTimer()
    timer.start('outer')
    timer.start('inner')
    await new Promise((r) => setTimeout(r, 5))
    timer.stop('inner')
    await new Promise((r) => setTimeout(r, 5))
    timer.stop('outer')

    const metrics = timer.getMetrics()
    expect(metrics.outer).toBeGreaterThanOrEqual(metrics.inner)
  })
})
