export class PipelineTimer {
  private marks = new Map<string, number>()
  private durations = new Map<string, number>()

  start(step: string): void {
    this.marks.set(step, performance.now())
  }

  stop(step: string): void {
    const startTime = this.marks.get(step)
    if (startTime !== undefined) {
      this.durations.set(step, Math.round(performance.now() - startTime))
      this.marks.delete(step)
    }
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.durations)
  }
}
