# Design Token Rules (Path-scoped: src/app/, src/components/)

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

## Score Grade Colors
Always use semantic tokens, never hardcode hex:
- HOT → `bg-score-hot` / `text-score-hot` (#EF4444)
- QUALIFIED → `bg-score-qualified` / `text-score-qualified` (#F97316)
- ENGAGED → `bg-score-engaged` / `text-score-engaged` (#EAB308)
- POTENTIAL → `bg-score-potential` / `text-score-potential` (#3B82F6)
- POOR_FIT → `bg-score-poor-fit` / `text-score-poor-fit` (#94A3B8)

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

## Empty State Pattern
All data pages use `EmptyState` from `src/components/shared/empty-state.tsx`:
- 96px circle (`bg-accent-light`) + 48px icon (`text-accent`)
- Title (`text-xl font-bold`) + description (`text-sm text-muted-foreground text-center`)
- Primary CTA (filled accent) + optional secondary CTA (outline)
- Conditional rendering: `hasLeads`/`hasDiscovery`/etc. boolean flags

## Anti-Patterns
- Never use `bg-gray-*` or `text-gray-*` — always use semantic tokens
- Never hardcode hex colors in components — use CSS variables via Tailwind
- Never use `font-family: Inter` directly — use `font-sans` class
- Score colors MUST use `--score-*` tokens, not semantic red/orange/yellow
- shadcn/ui `Button` uses `@base-ui/react` — no `asChild` prop available. Use `Link` with Tailwind classes for link-as-button patterns.

## Pencil Design File Sync
- Design tokens are synced from `globals.css` to `sarahdesign.pen` via Pencil MCP `set_variables()`.
- 53 CSS custom properties are mapped (core palette, surfaces, score colors, sidebar theme, charts).
- Pencil frames reference tokens via `$--variable-name` syntax (e.g., `$--primary`, `$--accent`).
- After changing tokens in `globals.css`, re-sync to Pencil using `set_variables()` with `replace: true`.
- Source of truth: `globals.css` → Pencil (one-way sync, CSS is authoritative).
