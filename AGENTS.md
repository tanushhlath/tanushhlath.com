# Project notes for AI assistants

Read **EDITING_GUIDE.md** first — it is the owner's maintenance manual
and describes where every piece of content lives. This file adds the
engineering constraints.

- **Stack:** Vite + React 19 + React Router 7 + Framer Motion + Tailwind v4,
  prerendered to static HTML. **There is no Next.js** — never reintroduce
  it or Next-specific APIs.
- **Content is data:** everything the site says lives in `src/content/`
  (typed by `src/types/content.ts`). UI reads it only through
  `src/lib/content.ts`. Never hard-code content or page copy in components;
  never duplicate a record (recognitions live on their event, the Archive /
  Explore / Skills views are derived).
- **Ids are slugs** and relations use ids (`relatedSkills`, `relatedEvents`,
  `relatedProjects`, `relatedStory`) — never array positions.
- **Routing:** every internal link uses `paths.*` from `src/routing/paths.ts`
  (canonical `https://tanushhlath.com`, trailing slash, UI state in the
  `#fragment`, never `?query`). Links go through `@/routing/Link` (view
  transitions, same-page reset, file-mode support). Per-page SEO lives in
  `src/routing/seo.ts`.
- **Build:** `npm run build` = vite client build (one classic IIFE bundle,
  relative asset paths) → SSR build of `src/entry-server.tsx` →
  `scripts/prerender.mjs` (validates content, writes every route's HTML,
  sitemap, robots, alias redirects) → link + SEO audits →
  `scripts/copy-dist-to-root.mjs` (GitHub Pages serves the repo root).
  `dev.html` is the real Vite entry; the root `index.html` and route
  folders are generated — never edit them.
- **Rendering must be SSR-safe:** no `window`/`document`/randomness/`Date.now()`
  during render; hydration must match the prerendered HTML.
- **Motion:** use `src/animations/` (reversible, direction-aware reveals —
  never `once: true`), tuned in `src/animations/tokens.ts`. Respect
  reduced motion.
- **Media:** `public/media/<events|projects>/<id>/`, auto-discovered by
  `scripts/media-manifest.mjs` (which also strips image metadata). Render
  media only through `src/components/media/`. `private-media/` is never
  published or committed.
- **Styling:** colour tokens in `src/styles/theme.css`; one CSS file per
  area in `src/styles/`, imported by `src/index.css`.
- **Content accuracy:** never invent facts about the owner (dates, results,
  roles, actions). Unknown details go in a record's `detailsToAdd` note.
