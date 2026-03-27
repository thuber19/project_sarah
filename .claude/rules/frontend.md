---
paths:
  - src/components/**
  - src/app/**/page.*
  - src/app/**/layout.*
  - src/app/**/error.*
  - src/app/**/loading.*
  - src/app/**/not-found.*
  - src/app/**/template.*
  - src/app/**/default.*
  - src/app/**/global-error.*
  - tailwind.config.*
  - app/**
  - components/**
---
# Frontend Rules (Path-scoped)

## React Patterns
- Function components only. No class components.
- React 19 features: use `use()` hook, Server Components by default, `"use client"` only when needed.
- Prefer Server Components. Only add `"use client"` for interactivity (event handlers, state, effects).
- React Hook Form + Zod for all forms. No uncontrolled forms with manual validation.

## Client vs Server Components
- Default to Server Components. Only add `"use client"` when you need browser APIs, event handlers, or React hooks (`useState`, `useEffect`, etc.).
- Server Components: data fetching, auth checks, heavy computation, accessing secrets/env vars.
- Client Components: forms, interactive UI, browser APIs (localStorage, navigator), real-time updates.
- Never import server-only code (env vars, `service_role` key, server actions) in Client Components.
- Use `next/dynamic` with `ssr: false` for components that depend on browser APIs at render time.
- Pass data from Server to Client Components via props — avoid unnecessary client-side fetching.
- Suspense boundaries: wrap async Server Components in `<Suspense>` with meaningful fallbacks.
- Forms: prefer Server Actions (`"use server"`) over API routes for mutations. Use `useActionState` for form state.

## Styling
- Tailwind CSS 4 for all styling. No CSS modules, no styled-components.
- shadcn/ui as component library. Install via `pnpm dlx shadcn@latest add <component>`.
- Never hardcode colors. Use semantic tokens (CSS variables from design system).
- Dark mode: support via CSS `prefers-color-scheme` or manual toggle.
- 8pt spacing grid. Use Tailwind spacing scale (`p-2` = 8px, `p-4` = 16px, etc.).

## Accessibility (WCAG 2.1 AA)
- Touch targets: minimum 48x48px (WCAG 2.5.8).
- Color contrast: minimum 4.5:1 for text, 3:1 for large text.
- All interactive elements keyboard-accessible.
- Meaningful alt text on images. Decorative images: `alt=""`.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, not `<div onClick>`).
- ARIA landmarks: use `role="navigation"`, `role="main"`, `role="complementary"` when semantic elements aren't sufficient.
- Live regions: use `aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for errors only.
- Dialog accessibility: use `aria-modal="true"`, trap focus inside, return focus on close. shadcn/ui Dialog handles this.
- Skip navigation: include a "Skip to main content" link as the first focusable element.
- Form accessibility: every `<input>` must have a visible `<label>` or `aria-label`. Use `aria-describedby` for help text.
- Error announcements: use `aria-invalid="true"` + `aria-describedby` pointing to error message element.

## Performance

### Image Optimization
- Use Next.js `<Image>` component — automatic WebP/AVIF conversion and lazy loading.
- Provide `width` and `height` props to prevent Cumulative Layout Shift (CLS).
- Use `srcset` for responsive breakpoints: 640, 768, 1024, 1280, 1920.
- Priority images (above fold): add `priority` prop to disable lazy loading.
- External images: configure `remotePatterns` in `next.config.ts`.

### Bundle Size Targets
- JavaScript: < 200KB gzipped for initial load bundle.
- CSS: < 50KB gzipped (Tailwind purge handles this automatically).
- Monitor with `@next/bundle-analyzer`: `ANALYZE=true pnpm build`.
- Set CI alerts for bundle size regression > 10%.

### Core Web Vitals
- LCP < 2.5s, FID < 100ms, CLS < 0.1 (targets for all pages).
- Use `next/font` for font loading (prevents FOUT/FOIT).
- Prefetch critical routes: `<Link prefetch>` for high-traffic navigation paths.
- Dynamic imports for below-fold components: `dynamic(() => import('./HeavyComponent'))`.

## i18n
- de-AT as primary locale (Austrian German). Du-Ansprache for consumer apps (BuchhaltGenie, EventDrop). Sie-Ansprache for B2B/formal contexts (pitchdeck, GotzendorferAT agency).
- next-intl for internationalization. All user-facing strings in message files.
- Currency: EUR, formatted with `Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" })`.

## Design with Pencil MCP
- Use `get_editor_state()` to check current .pen file context.
- Follow `get_guidelines(topic)` for design rules.
- Always `get_screenshot()` to validate design changes visually.
- Batch operations: max 25 per call to avoid overwhelming the system.

## Error Boundaries
- Every Next.js route segment should have an `error.tsx` for graceful error handling.
- Error boundaries must never show raw error messages to users (SEC-009). Display a user-friendly fallback UI.
- Integrate Sentry: call `Sentry.captureException(error)` inside `useEffect` in the error boundary.
- Global error boundary: `app/error.tsx`. Per-route boundaries for route-specific recovery.
- Always provide a "Try again" action via the `reset()` function from the error boundary props.
- `app/global-error.tsx` catches errors in the root layout itself (wraps its own `<html>` and `<body>`).

## Content Security Policy
- Generate a nonce per request in `middleware.ts` using `crypto.randomUUID()`.
- Pass the nonce to pages via `x-nonce` response header or `requestHeaders`.
- Apply nonce to `<Script>` tags: `<Script nonce={nonce} ...>`.
- Production CSP: `script-src 'nonce-${nonce}' 'strict-dynamic'`. Never use `'unsafe-inline'` in production.
- Development: `'unsafe-eval'` allowed for React Fast Refresh / Next.js HMR.
- See SEC-011 in security rules for the full CSP directive reference.

## Edge Runtime Constraints
- Edge Runtime (`export const runtime = 'edge'`) has limited Node.js API support: no `fs`, no `child_process`, no native modules.
- Only use Edge Runtime for middleware, simple API routes, and redirects. Never for database-heavy operations.
- Allowed in Edge: `crypto`, `TextEncoder`, `fetch`, `URL`, `Headers`, `Request`, `Response`.
- Supabase client works in Edge but use `createClient` with anon key only (no service_role in Edge).
- Bundle size matters more in Edge — avoid large dependencies. Check with `@next/bundle-analyzer`.
- Middleware runs on Edge by default in Next.js. Keep middleware lightweight (<50ms execution).

## Data Fetching Patterns
- Server Components fetch data directly — no `useEffect` or client-side fetching for initial data.
- Use `React.cache()` to deduplicate identical fetches within a single request (e.g., user/business lookups).
- `unstable_cache` (Next.js) or `revalidateTag` for cross-request caching with on-demand revalidation.
- Revalidation: `revalidatePath('/path')` after mutations, `revalidateTag('tag')` for granular cache busting.
- Loading states: use `loading.tsx` per route segment for automatic Suspense boundaries.
- Error states: use `error.tsx` per route segment (see Error Boundaries section).
- Parallel data fetching: use `Promise.all()` for independent queries, not sequential `await`.
- Never fetch in layout components if the data is only needed in a specific page — fetch at the page level.

## Streaming & Real-Time

### Server-Sent Events (SSE)
- Use `EventSource` API for SSE consumption. Always handle `onerror` for reconnection.
- Reconnection: browser auto-reconnects by default. Set `retry:` field server-side for custom interval.
- Close connections on component unmount: `eventSource.close()` in cleanup function.

### Vercel AI SDK Patterns
- Use `useChat()` for conversational AI interfaces. Configure `api` endpoint and `onError` handler.
- Use `useCompletion()` for single-prompt completions.
- Stream error handling: catch network errors, timeouts, and partial responses.
- Display streaming state: show typing indicator while `isLoading`, render partial `messages` progressively.

### Error Handling for Streams
- Network disconnect: detect via `EventSource.onerror`, show reconnection banner.
- Timeout: implement client-side timeout (30s default), abort and retry.
- Partial response: validate completeness before committing AI output to state.
- Rate limiting: handle 429 responses gracefully with retry-after countdown.

### Progressive Rendering
- Skeleton → Partial → Complete: use Suspense boundaries for each data phase.
- Streaming text: render tokens as they arrive, avoid layout shifts with fixed-height containers.
- Optimistic updates: show pending state immediately, reconcile on stream completion.
- Loading states: distinguish between "waiting for first token" and "streaming in progress".

## Animations & Micro-interactions
- Framer Motion for complex animations. CSS transitions for simple ones.
- magic-ui MCP for component inspiration and generation.
- Respect `prefers-reduced-motion`. Disable animations when set.
- Keep animations under 300ms for UI feedback, 500ms for transitions.

## See Also
development.md · security.md · security-web.md · security-compliance.md · testing.md · test-quality.md · backend.md · backend-data.md · infrastructure.md · swift.md · mvp-scope.md · cli-design.md
