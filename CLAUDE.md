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
- **Server Actions** — `src/app/actions/*.actions.ts` (e.g. `leads.actions.ts`).
- **Auth** — Supabase Auth (magic link). Guard server actions with `requireAuth()` from `src/lib/auth.ts`. Never trust client-side auth alone.
- **RLS** — Every Supabase table has row-level security. Policies reference `auth.uid()`.
- **Styling** — Tailwind CSS 4 + shadcn/ui components in `src/components/ui/`.
- **Security** — `proxy.ts` handles CSP headers; `middleware.ts` handles rate limiting and auth redirects.

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
