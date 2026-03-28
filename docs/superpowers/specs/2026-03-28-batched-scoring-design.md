# Batched Scoring — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Small Batch (< 1 week)

## Problem

The scoring page rescores all leads at once with a hardcoded `MAX_BATCH_SIZE = 50`. Users have no control over how many leads get scored per run, leading to unnecessary API costs and long wait times.

## Solution

Add a dropdown on the scoring page that lets the user choose the batch size: **10, 25, 50, or 100**. Leads are prioritized: unscored first, then oldest scores.

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Dropdown with options: 10, 25, 50, 100 (no "All") |
| 2 | Default value: 25 |
| 3 | Lead priority: unscored leads first, then oldest `scored_at` |
| 4 | Hard max: 100 leads per batch (API-enforced) |
| 5 | Location: Scoring page only (not leads bulk toolbar) |
| 6 | Progress bar reflects actual batch size |

## Approach

Client-side slicing. The server component fetches all lead IDs in priority order. The client component slices to the selected batch size before sending to the API.

### Why not server-side limiting?

At realistic MVP lead counts (< 1000), passing all sorted IDs to the client and slicing is simpler, requires no new API endpoints, and avoids duplicating sort logic. Server-side limiting would be premature optimization.

## Design

### Data Layer — `scoring/page.tsx`

Query changes from:

```ts
supabase.from('leads').select('id').eq('user_id', user.id)
```

To a left-join query that sorts by score status:

```ts
supabase
  .from('leads')
  .select('id, lead_scores(scored_at)')
  .eq('user_id', user.id)
  .order('scored_at', { referencedTable: 'lead_scores', ascending: true, nullsFirst: true })
```

This produces lead IDs ordered: unscored first, oldest scores next.

### UI — `scoring-rescore-section.tsx`

The section gains a `Select` (shadcn/ui) next to the existing `RescoreButton`:

```
[ 25 ▾ ]  [ ↻ Regeln aktualisieren ]
```

- State: `batchSize` (default 25)
- Passes `leadIds.slice(0, batchSize)` to `RescoreButton`
- When total leads < selected batch size, the UI still works correctly (sends all available leads)

### API — `batch-stream/route.ts`

Single change: `MAX_BATCH_SIZE` from 50 to 100.

### RescoreButton

No changes. Already receives and uses whatever `leadIds` array it gets.

## Affected Files

| File | Change |
|------|--------|
| `src/app/(app)/scoring/page.tsx` | Add sorted query with `lead_scores` join |
| `src/app/(app)/scoring/scoring-rescore-section.tsx` | Add Select component, batch size state, slice logic |
| `src/app/api/scoring/batch-stream/route.ts` | `MAX_BATCH_SIZE = 100` |

## Out of Scope

- Leads page bulk toolbar batch control (user selects leads manually there)
- Person scoring batch control
- Persisting batch size preference (localStorage or DB)
- Parallel scoring (stays sequential with SSE progress)

## Testing

- Unit test: sorted lead ID query returns unscored first
- Unit test: slice logic respects batch size selection
- Manual: dropdown renders, scoring runs with correct count, progress bar matches
