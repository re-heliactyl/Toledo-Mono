# Web Performance — Core Web Vitals

Protect LCP, INP, and CLS scores. Based on real field data from overnode.fr (Aug 2026).

## When this applies

- Adding or modifying images in `frontend/src/`
- Changing layout structure in pages or `MainLayout.jsx`
- Adding new routes, pages, or heavy components
- Modifying event handlers, click targets, or interactive elements
- Changing the Vite build config or code-splitting strategy

## Current baseline (field data)

- **LCP P75: 2,724 ms** — needs improvement (target < 2,500 ms)
- **INP: 84% good** — acceptable but fragile on `/auth` and `/coins/afk`
- **CLS: 88% good** — `/dashboard` has severe layout shift (CLS 1.157 on body)

## LCP rules

- **NEVER** add an `<img>` tag without explicit `width` and `height` attributes (or aspect-ratio CSS)
- **ALWAYS** add `loading="lazy"` on images below the fold; add `fetchpriority="high"` on the LCP image (the largest visible image above the fold — currently the logo `img.h-12` in the nav/sidebar)
- **NEVER** load the full app bundle eagerly — new page components MUST use `React.lazy()` + `<Suspense>`
- **NEVER** host images on imgur or other third-party domains for production — use self-hosted assets under `public/` or a CDN with the same origin
- When adding a new route in `App.jsx`, the page component MUST be lazy-imported

## INP rules

- **NEVER** run synchronous heavy work (> 50 ms) inside click, keydown, or change handlers
- **ALWAYS** debounce or throttle search inputs and filters (min 150 ms)
- Avoid `framer-motion` `AnimatePresence` wrapping interactive elements that fire on every click — field data shows 256-480 ms INP on nav links (`a.bg-[#383c47]`) and hamburger menu buttons in `MainLayout.jsx`
- If a button triggers a network request, set it to disabled/loading state **synchronously** in the same event handler tick, not after `await`

## CLS rules

- **CRITICAL**: The `/dashboard` route has CLS 1.157 caused by late-rendering body content. Every page that fetches data on mount MUST render a skeleton or placeholder with the **same dimensions** as the final content
- **NEVER** insert DOM elements above existing visible content after initial paint (banners, toasts at top, late-loading headers)
- **ALWAYS** reserve space for dynamic lists: use `min-height` on the container or a skeleton grid matching the expected row count
- **NEVER** use CSS `display: none` then `display: block` for content that shifts layout; prefer `visibility: hidden` + `position: absolute` or skeleton states
- Sidebar (`MainLayout.jsx`) MUST NOT cause a reflow when the mobile menu opens — it already uses `Sheet` which is correct; do not replace it with conditional DOM insertion

## Code splitting

- `framer-motion`, `recharts`, `@monaco-editor/react`, `react-syntax-highlighter`, and `@stripe/*` MUST be in separate chunks — add `manualChunks` in `vite.config.js` if not already present
- Pages under `pages/admin/` and `pages/server/` are behind auth — they MUST be lazy-loaded

## Image checklist (every PR touching images)

1. Has `width`/`height` or `aspect-ratio`?
2. Has `loading="lazy"` (below fold) or `fetchpriority="high"` (LCP)?
3. Uses modern format (WebP/AVIF) with fallback?
4. Self-hosted or same-origin CDN?

## Testing

- After any layout change to `/dashboard`, `/auth`, or `/servers`, run a Lighthouse performance audit and confirm CLS < 0.1, LCP < 2.5 s
- Use Chrome DevTools Performance panel to verify INP < 200 ms on interactive pages
