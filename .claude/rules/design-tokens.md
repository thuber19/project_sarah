---
paths:
  - src/components/**
  - src/app/**/page.*
  - src/app/**/layout.*
  - src/app/globals.css
---

# Design Token Rules

## Color System — "Professional Trust" Variant
Design source: `sarahdesign.pen` Frame "Variant 1 - Professional Trust"

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#1E293B` (Slate 800) | Buttons, sidebar, dark surfaces |
| `--accent` | `#3B82F6` (Blue 500) | Links, CTAs, active states, focus rings |
| `--accent-light` | `#DBEAFE` (Blue 100) | Badge backgrounds, light highlights |
| `--muted` | `#F8FAFC` (Slate 50) | App content background |
| `--border` | `#E2E8F0` (Slate 200) | Card borders, dividers |
| `--muted-foreground` | `#64748B` (Slate 500) | Secondary text, labels |

## Status Colors (Badges, Indicators, Categories)
Always use semantic status tokens for status indicators, badges, and category colors:

| Level | Background | Text |
|-------|-----------|------|
| Success | `bg-status-success-bg` (#DCFCE7) | `text-status-success-text` (#15803D) |
| Warning | `bg-status-warning-bg` (#FEF9C3) | `text-status-warning-text` (#A16207) |
| Error | `bg-status-error-bg` (#FEE2E2) | `text-status-error-text` (#B91C1C) |
| Info | `bg-status-info-bg` (#DBEAFE) | `text-status-info-text` (#1D4ED8) |
| Neutral | `bg-status-neutral-bg` (#F1F5F9) | `text-status-neutral-text` (#475569) |

Use for: agent log categories, data quality badges, threat levels, success/error states.

## Stat Change Indicators
| Change | Background | Text |
|--------|-----------|------|
| Positive | `bg-stat-positive-bg` | `text-stat-positive-text` |
| Negative | `bg-stat-negative-bg` | `text-stat-negative-text` |
| Neutral | `bg-stat-neutral-bg` | `text-stat-neutral-text` |

## Brand Colors (Third-Party)
| Brand | Token | Value |
|-------|-------|-------|
| HubSpot | `bg-brand-hubspot` | #FF7A59 |
| HubSpot Hover | `hover:bg-brand-hubspot-hover` | #FF6A45 |
| HubSpot Light | `bg-brand-hubspot/15 text-brand-hubspot` | 15% opacity bg |

## Score Grade Colors (3-Grade System)
Scoring uses 3 grades based on Company Score only (Person Score is a separate dimension):
- TOP_MATCH (≥60) → `bg-score-hot-bg` / `text-score-hot-text` (#EF4444)
- GOOD_FIT (30-59) → `bg-score-qualified-bg` / `text-score-qualified-text` (#F97316)
- POOR_FIT (<30) → `bg-score-poor-fit-bg` / `text-score-poor-fit-text` (#94A3B8)

Legacy 5-grade values (HOT, QUALIFIED, ENGAGED, POTENTIAL) are mapped via `mapLegacyGrade()`.
Use `ScoreBadge` component from `src/components/leads/score-badge.tsx` for display.

## Typography
- Font: Inter (loaded via `next/font/google`, variable `--font-sans`)
- Headings: `font-bold` or `font-semibold`, never `font-light`
- Body: 14px (`text-sm`), Headings: 20-48px depending on context

## Border Radius
- Components (buttons, inputs): `rounded-lg` (8px = `--radius`)
- Cards: `rounded-xl` (12px = `--radius-card`)
- Badges/Pills: `rounded-full`

## Sidebar
- Dark theme: `bg-sidebar` (#1E293B), `text-sidebar-foreground` (#F8FAFC)
- Active nav: `bg-sidebar-accent` (#334155)
- Inactive nav: `text-sidebar-muted` (#94A3B8)
- Width: 240px (`w-60`)
- Nav items: Dashboard, Leads, Discovery, Scoring, Analyse, Export & CRM, Settings
- Agent Logs hidden from user nav (admin-only, accessible via `/agent-logs` direct URL)

## Empty State Pattern
All data pages use `EmptyState` from `src/components/shared/empty-state.tsx`:
- 96px circle (`bg-accent-light`) + 48px icon (`text-accent`)
- Title (`text-xl font-bold`) + description (`text-sm text-muted-foreground text-center`)
- Primary CTA (filled accent) + optional secondary CTA (outline)
- Conditional rendering: `hasLeads`/`hasDiscovery`/etc. boolean flags

## Anti-Patterns
- Never use `bg-gray-*` or `text-gray-*` — always use semantic tokens
- Never use `bg-red-*`, `bg-green-*`, `bg-yellow-*`, `bg-blue-*`, `bg-orange-*`, `bg-amber-*`, `bg-emerald-*` — use `--status-*` or `--score-*` tokens
- Never hardcode hex colors in components — use CSS variables via Tailwind
- Third-party brand colors use `--brand-{name}` tokens (e.g., `--brand-hubspot`)
- Never use `font-family: Inter` directly — use `font-sans` class
- Score colors MUST use `--score-*` tokens, not semantic red/orange/yellow
- shadcn/ui `Button` uses `@base-ui/react` — no `asChild` prop available. Use `Link` with Tailwind classes for link-as-button patterns.

## Pencil Design File Sync
- Design tokens are synced from `globals.css` to `sarahdesign.pen` via Pencil MCP `set_variables()`.
- 68 CSS custom properties are mapped (core palette, surfaces, score colors, status colors, stat indicators, brand colors, sidebar theme, charts).
- Pencil frames reference tokens via `$--variable-name` syntax (e.g., `$--primary`, `$--accent`).
- After changing tokens in `globals.css`, re-sync to Pencil using `set_variables()` with `replace: true`.
- Source of truth: `globals.css` → Pencil (one-way sync, CSS is authoritative).
