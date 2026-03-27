# Project Sarah — MVP Scope

## Appetite: Big Batch (48h Hackathon)
Hard Deadline: 2026-03-28 18:00 CET

---

## IN (MVP Scope)

1. **MVP-001: Supabase Setup** (DB Schema, RLS, Types) — #2
2. **MVP-002: Environment & Config** — #3
3. **MVP-003: Magic Link Auth** — #5
4. **MVP-004: Onboarding Flow** (4-Step Wizard) — #6, #7, #8, #9, #10, #11, #12
5. **MVP-005: Lead Discovery Pipeline** — #13, #14, #15, #16
6. **MVP-006: Agent Log System** — #17
7. **MVP-007: Scoring Pipeline** (Rule Engine + AI) — #18, #19, #20
8. **MVP-008: Dashboard** (Layout, Agent Feed, Lead List, Lead Detail, Settings) — #21, #22, #23, #24, #25
9. **MVP-009: Landing Page** (basic) — #26

## OUT (Post-MVP)

- Responsive Polish & Animations — #27
- HubSpot Integration — #28
- Outreach Message Generation — #29
- ICP Auto-Refinement — #30
- Competitor Analysis — #31

---

## Acceptance Criteria

### MVP-001: Supabase Setup
- All tables created (users, companies, leads, scores, agent_logs, onboarding_profiles).
- RLS policies active on every table; `auth.uid()` scoped.
- `pnpm db:types` generates `database.types.ts` without errors.

### MVP-002: Environment & Config
- `.env.example` lists all required vars with placeholder values.
- `pnpm dev` starts cleanly with valid env.
- Supabase client initializes in both server and client contexts.

### MVP-003: Magic Link Auth
- User can sign up / sign in via magic link email.
- Auth state persists across page reloads.
- Unauthenticated users are redirected to `/login`.

### MVP-004: Onboarding Flow
- 4-step wizard: Company Info, ICP Definition, Verticals & Regions, Review & Confirm.
- Data persists to `onboarding_profiles` on completion.
- User can go back/forward between steps without data loss.
- Skip to dashboard if onboarding already completed.

### MVP-005: Lead Discovery Pipeline
- Apollo.io API fetches leads matching ICP criteria.
- Google Places API enriches with location/review data.
- Cheerio scrapes company websites for additional signals.
- Leads stored in `leads` table with source metadata.

### MVP-006: Agent Log System
- Every pipeline action (discovery, enrichment, scoring) is logged to `agent_logs`.
- Logs include timestamp, action type, status, and detail payload.
- Logs queryable per user.

### MVP-007: Scoring Pipeline
- Rule engine scores leads on hard criteria (region, size, vertical).
- AI scoring layer (Claude) evaluates soft signals (website copy, reviews, job postings).
- Combined score (0-100) stored in `scores` table with breakdown.

### MVP-008: Dashboard
- Layout: sidebar nav, main content area.
- Agent Feed: real-time-ish log of agent actions.
- Lead List: sortable/filterable table of scored leads.
- Lead Detail: full lead profile with score breakdown.
- Settings: update ICP and trigger re-scoring.

### MVP-009: Landing Page
- Static hero section explaining the product.
- CTA to sign up / sign in.
- Renders correctly on desktop (mobile polish is post-MVP).

---

## Scope Change Log

| Date | Change | Decided By |
|------|--------|------------|
| — | — | — |
