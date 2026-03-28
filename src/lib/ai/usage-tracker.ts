export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

// Anthropic Claude Haiku 4.5 pricing (via Vercel AI Gateway)
// Source: https://www.anthropic.com/pricing
const PRICING = {
  inputPer1MTok: 0.8, // $0.80 per 1M input tokens
  outputPer1MTok: 4.0, // $4.00 per 1M output tokens
} as const

export function calculateCost(usage: { inputTokens: number; outputTokens: number }): number {
  return (
    (usage.inputTokens / 1_000_000) * PRICING.inputPer1MTok +
    (usage.outputTokens / 1_000_000) * PRICING.outputPer1MTok
  )
}

/**
 * Build a TokenUsage metadata object from a Vercel AI SDK LanguageModelUsage.
 * Token counts may be `undefined` when the provider does not report them,
 * so we default to 0 for safe arithmetic.
 */
export function buildUsageMetadata(usage: {
  inputTokens: number | undefined
  outputTokens: number | undefined
  totalTokens: number | undefined
}): TokenUsage {
  const inputTokens = usage.inputTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  const totalTokens = usage.totalTokens ?? 0
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: calculateCost({ inputTokens, outputTokens }),
  }
}
