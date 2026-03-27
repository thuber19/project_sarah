# Project Sarah — Launch Gate Checklist

Hard Deadline: 2026-03-28 18:00 CET

---

## Gate 1: Functionality

- [ ] User can sign up via magic link and land on dashboard
- [ ] Onboarding wizard completes and persists ICP profile
- [ ] Lead discovery pipeline returns and stores leads from Apollo.io
- [ ] Enrichment (Google Places + Cheerio scraping) populates lead details
- [ ] Scoring pipeline produces 0-100 score with breakdown
- [ ] Dashboard displays agent feed, lead list, and lead detail
- [ ] Settings page allows ICP update and re-score trigger
- [ ] Landing page renders with sign-up CTA

## Gate 2: Security

- [ ] Supabase RLS active on all tables — verified with anon key test
- [ ] `requireAuth()` guards every server action
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never imported in client bundles
- [ ] API keys (Apollo, Google Places, Anthropic) only used server-side
- [ ] CSP headers configured via `proxy.ts`
- [ ] Rate limiting active in `middleware.ts`
- [ ] Input validation on all user-submitted data (onboarding, settings)
- [ ] No secrets committed to repo (`.env.local` in `.gitignore`)

## Gate 3: Quality

- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm lint` — 0 errors / 0 warnings
- [ ] `pnpm build` — succeeds without warnings
- [ ] Critical path unit tests pass (auth, scoring, lead pipeline)
- [ ] Manual smoke test: full flow from sign-up to scored leads

## Gate 4: Ops

- [ ] Vercel project linked and deploying from `main`
- [ ] All environment variables set in Vercel dashboard
- [ ] Production Supabase project provisioned (not local-only)
- [ ] Error monitoring active (Vercel logs at minimum)
- [ ] Domain configured (if applicable)

## Gate 5: Legal (DSGVO)

> Note: For hackathon demo, items below can be deferred with a visible "Beta" disclaimer. Must be resolved before any real user data is processed.

- [ ] Impressum page present or linked
- [ ] Datenschutzerklarung (privacy policy) page present or linked
- [ ] Cookie consent banner (if applicable)
- [ ] Data processing documentation for Supabase / Vercel / Anthropic
- [ ] User data deletion flow documented (right to erasure)

---

## Sign-Off

| Gate | Status | Signed By | Date |
|------|--------|-----------|------|
| Functionality | | | |
| Security | | | |
| Quality | | | |
| Ops | | | |
| Legal | | | |
