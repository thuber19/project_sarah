---
paths:
  - src/lib/scoring/**
  - src/app/actions/*scoring*
  - src/app/api/scoring/**
  - src/app/(app)/scoring/**
  - src/components/scoring/**
---

# Scoring Rules

## Database Schema
The `lead_scores` table has these timestamp columns:
- `created_at` — when the score was first created
- `updated_at` — when the score was last recalculated
- There is NO `scored_at` column. Always use `updated_at` for "last scored" semantics.

## Scoring Grades
Three-grade system based on **Company Score only** (Person Score is separate):
- `TOP_MATCH` — Company Score >= 60
- `GOOD_FIT` — Company Score 30-59
- `POOR_FIT` — Company Score < 30

Note: Base-point scoring means empty leads get ~13 points (industry 5 + size 5 + geography 3).

Use `getGradeForScore()` from `src/lib/scoring/grade.ts`. Never hardcode grade thresholds.

## Scoring Pipeline
1. **Rule-based scoring** — `calculateRuleScore()` from `src/lib/scoring/rule-engine.ts`. Always runs.
2. **AI scoring** — `getAIScoring()` from `src/lib/scoring/ai-scoring.ts`. Optional, best-effort.
3. **Combined** — `combinedScore()` merges rule + AI results.

## Batch Scoring
- API endpoint: `/api/scoring/batch-stream` (SSE streaming)
- Max batch size: 100 leads per request (Zod-validated)
- Processing: sequential (one lead at a time), streams progress events
- Priority ordering: unscored leads first (`updated_at IS NULL`), then oldest `updated_at`

## Anti-Patterns
- Never reference `scored_at` — use `updated_at` on `lead_scores`
- Never hardcode grade thresholds — use `getGradeForScore()`
- Never use `service_role` key in scoring API routes — use user's session
- Never skip rule-based scoring and go straight to AI
