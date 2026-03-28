/**
 * Example: How to integrate useStreamingScore into Lead Detail Page
 *
 * To use streaming scores on the lead detail page:
 *
 * 1. Import the hook and component:
 *    import { useStreamingScore } from '@/hooks/use-streaming-score'
 *    import { StreamingScoreBreakdown } from '@/components/leads/streaming-score-breakdown'
 *
 * 2. Use the hook in your component:
 *    const { scoreWithStream, isLoading, partialResult } = useStreamingScore({
 *      onUpdate: (update) => console.log('Score updated:', update),
 *      onComplete: (final) => console.log('Scoring complete:', final),
 *    })
 *
 * 3. Trigger scoring when needed (e.g., on button click):
 *    const handleRescore = async () => {
 *      await scoreWithStream(lead, breakdown, totalScore)
 *    }
 *
 * 4. Display streaming results:
 *    <StreamingScoreBreakdown
 *      companyFit={partialResult.company_fit}
 *      contactFit={partialResult.contact_fit}
 *      buyingSignals={partialResult.buying_signals}
 *      timing={partialResult.timing}
 *      isLoading={isLoading}
 *      showAnimation={true}
 *    />
 *
 * The component will:
 * - Show loading spinner for fields that haven't received data yet
 * - Animate in each field as it arrives from the streaming endpoint
 * - Display ... for incomplete values
 * - Update in real-time as scores stream in
 */

export {}
