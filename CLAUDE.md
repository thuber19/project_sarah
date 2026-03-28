# Project Sarah — CLAUDE.md

## Quick Facts
| Key | Value |
|-----|-------|
| Stack | Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui |
| DB | Supabase (PostgreSQL + Auth + RLS) |
| AI | Vercel AI SDK v6 + Anthropic Claude |
| APIs | Apollo.io, Google Places, Cheerio (scraping) |
| Hosting | Vercel |
| PM | pnpm |
| Source Control | GitHub primary — thuber19/project_sarah |
| Design | Pencil MCP (sarahdesign.pen) |

## Commands
```bash
pnpm dev          # local dev server (turbopack)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm format       # prettier --write
pnpm test         # vitest unit tests
pnpm test:e2e     # playwright e2e tests
pnpm db:types     # supabase gen types typescript --local > src/lib/database.types.ts
```

## Architecture
- **App Router** — RSC by default; add `"use client"` only when needed.
- **Route Groups** — `(marketing)` public pages, `(auth)` login/callback, `(app)` protected app shell.
- **Server Actions** — `src/app/actions/*.actions.ts` (e.g. `leads.actions.ts`).
- **Auth** — Supabase Auth (magic link). Guard server actions with `requireAuth()` from `src/lib/auth.ts`. Never trust client-side auth alone.
- **RLS** — Every Supabase table has row-level security. Policies reference `auth.uid()`.
- **Styling** — Tailwind CSS 4 + shadcn/ui. Design tokens in `globals.css` (Slate palette + score colors). Font: Inter.
- **Layouts** — App sidebar (dark, 240px) in `(app)/layout.tsx`. Marketing navbar/footer in `(marketing)/layout.tsx`. Onboarding wizard in `(app)/onboarding/layout.tsx`.
- **Security** — `proxy.ts` handles CSP headers; `middleware.ts` handles rate limiting and auth redirects.

## Frontend Structure
```
src/app/
├── (marketing)/
│   ├── page.tsx                # Landing page (hero, features, social proof)
│   └── pricing/page.tsx        # 3-tier pricing (Starter/Professional/Enterprise)
├── (auth)/
│   ├── login/page.tsx          # Split-screen magic link login
│   └── magic-link-sent/page.tsx # "Check your inbox" confirmation
├── (app)/
│   ├── dashboard/page.tsx      # Stats + live feed + score chart (+ empty state)
│   ├── leads/page.tsx          # Filterable lead table (+ empty state)
│   ├── leads/[id]/page.tsx     # Lead detail (score breakdown)
│   ├── leads/import/page.tsx   # CSV import with drag & drop
│   ├── discovery/page.tsx      # Lead search + results (+ empty state)
│   ├── scoring/page.tsx        # Score distribution + rule config (+ empty state)
│   ├── export/page.tsx         # HubSpot Export & CRM (+ empty state)
│   ├── settings/page.tsx       # Tabbed settings (profile, ICP, integrations)
│   ├── agent-logs/page.tsx     # Activity timeline (+ empty state)
│   └── onboarding/
│       ├── step-{1-4}/         # 4-step onboarding wizard
│       └── analysis/page.tsx   # AI website analysis loading screen
src/components/
├── ui/                         # shadcn/ui primitives (20+ components)
├── shared/                     # EmptyState (reusable across all pages)
├── layout/                     # AppSidebar, AppTopbar, NotificationBell, MarketingNavbar
├── auth/                       # AuthLeftPanel (shared left panel for auth pages)
├── marketing/                  # PricingCard
├── dashboard/                  # StatCard, LiveFeed, ScoreDistribution, DashboardEmpty
└── leads/                      # ScoreBadge, LeadTable, LeadFilters, ScoreBreakdown
```

All data pages have empty state conditionals (toggle `hasLeads`/`hasDiscovery`/etc. flags).
Sidebar navigation: Dashboard, Leads, Discovery, Scoring, Agent Logs, Export & CRM, Settings.

## Environment
Copy `.env.example` to `.env.local`. Required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `APOLLO_API_KEY`, `GOOGLE_PLACES_API_KEY`.

## Conventions
- **Commits** — Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- **Branches** — `feat/`, `fix/`, `chore/` prefixes off `main`.
- **Files** — kebab-case for files, PascalCase for components. Actions: `*.actions.ts`. Types: `*.types.ts`.
- **Testing** — Co-locate unit tests as `*.test.ts`. E2E in `tests/`.
- **Errors** — Typed error returns from server actions, never throw across the network boundary.
- **Auth** — Always `requireAuth()` at the top of every server action.
- **Secrets** — Never import `SUPABASE_SERVICE_ROLE_KEY` in client code. Keep in server actions / route handlers only.

## Rules
See `.claude/rules/` for domain-specific rules (scoring model, lead pipeline, onboarding flow).

## Team
Sarah K. (Product) · Sarah T. (AI/Backend) · Tobias H. (Full Stack) · Bernhard G. (Full Stack)
Built at Vienna Overnight AI Agent Hackathon, 27-28 March 2026.

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
