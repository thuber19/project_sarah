# Project Sarah — Launch Gate Checklist

Hard Deadline: 2026-03-28 18:00 CET

---

## Gate 1: Functionality

- [x] User can sign up via magic link and land on dashboard
- [x] Onboarding wizard completes and persists ICP profile
- [x] Lead discovery pipeline returns and stores leads from Apollo.io
- [x] Enrichment (Google Places + Cheerio scraping) populates lead details
- [x] Scoring pipeline produces 0-100 score with breakdown
- [x] Dashboard displays agent feed, lead list, and lead detail
- [x] Settings page allows ICP update and re-score trigger
- [ ] Landing page renders with sign-up CTA

## Gate 2: Security

- [x] Supabase RLS active on all tables — verified with anon key test
- [x] `requireAuth()` guards every server action
- [x] `SUPABASE_SERVICE_ROLE_KEY` never imported in client bundles
- [x] API keys (Apollo, Google Places, Anthropic) only used server-side
- [x] CSP headers configured via `proxy.ts` (#69)
- [x] Rate limiting active in `proxy.ts` (#67)
- [x] Input validation on all user-submitted data (onboarding, settings)
- [x] No secrets committed to repo (`.env.local` in `.gitignore`)
- [x] Open redirect in `/auth/callback` fixed (#83)
- [x] `/api/scrape` requires auth + SSRF hardened (#84)

## Gate 3: Quality

- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm lint` — 0 errors / 0 warnings
- [ ] `pnpm build` — succeeds without warnings
- [ ] Critical path unit tests pass (auth, scoring, lead pipeline)
- [ ] Manual smoke test: full flow from sign-up to scored leads

## Gate 4: Ops

- [x] `vercel.json` created — region `fra1`, frozen lockfile, function timeouts (#92)
- [ ] Vercel project linked and deploying from `main`
- [ ] All environment variables set in Vercel dashboard (see `.env.example`)
- [ ] Production Supabase project provisioned (not local-only)
- [ ] Error monitoring active (Vercel logs at minimum)
- [ ] Domain configured (if applicable)

## Gate 5: Legal (DSGVO)

> Note: For hackathon demo, items below can be deferred with a visible "Beta" disclaimer. Must be resolved before any real user data is processed.

- [ ] Impressum page present or linked (#76)
- [ ] Datenschutzerklärung (privacy policy) page present or linked (#76)
- [ ] Cookie consent banner (if applicable)
- [ ] Data processing documentation for Supabase / Vercel / Anthropic
- [ ] User data deletion flow documented (right to erasure)

---

## Environment Variables

All required vars are documented in `.env.example`. Set these in Vercel Dashboard → Settings → Environment Variables for both **Production** and **Preview** environments:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side only — never expose to client |
| `SUPABASE_JWT_SECRET` | ✅ | For token verification |
| `ANTHROPIC_API_KEY` | ✅ | Claude AI for analysis + scoring |
| `APOLLO_API_KEY` | ✅ | Lead discovery via Apollo.io |
| `GOOGLE_PLACES_API_KEY` | ✅ | Local business search |
| `RATE_LIMIT_AUTH` | optional | Default: 10 req / 15 min |
| `RATE_LIMIT_DISCOVERY` | optional | Default: 10 req / hour |
| `RATE_LIMIT_API_AUTHED` | optional | Default: 120 req / min |

---

## Sign-Off

| Gate | Status | Signed By | Date |
|------|--------|-----------|------|
| Functionality | 🟡 Partial (landing page pending) | | |
| Security | ✅ Done | | 2026-03-28 |
| Quality | 🔴 Pending typecheck + tests | | |
| Ops | 🟡 vercel.json done, Vercel setup pending | | |
| Legal | 🔴 Deferred — Beta disclaimer applies | | |
