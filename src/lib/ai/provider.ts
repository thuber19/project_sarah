import { createGateway } from '@ai-sdk/gateway'

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
})

// Central model — swap here to change model across the entire app
export const model = gateway('anthropic/claude-haiku-4-5-20251001')
