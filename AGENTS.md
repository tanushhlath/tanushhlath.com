# Project notes for AI assistants

This is a **Vite + React + React Router** static site — there is no
Next.js anywhere in this project (it was fully removed; do not reintroduce
it or suggest `next`-specific APIs like `next/image`, `next/link`,
`next/navigation`, or the App Router).

- **Routing**: `src/routes.tsx` defines every route once, shared by both
  the browser entry (`src/main.tsx`) and the SSG entry (`src/entry-server.tsx`).
- **Pages** live in `src/pages/`, one file per route.
- **`next/link` / `next/image` / `next/navigation` replacements** live in
  `src/lib/Link.tsx`, `src/lib/Image.tsx`, `src/lib/navigation.ts` — thin
  shims over `react-router-dom` so the rest of the codebase reads the same
  as it did before the migration.
- **Per-page `<title>`/meta**: `src/pageMeta.ts` is the single source of
  truth, read by both `src/lib/Meta.tsx` (client-side) and
  `scripts/prerender.mjs` (baked into each route's static HTML at build
  time).
- **Build** (`npm run build`) does three things in sequence: a client
  build, an SSR build of `entry-server.tsx`, then `scripts/prerender.mjs`
  renders every route (including every `/work/:slug`) to a real static
  `index.html` inside `dist/`, deletes the temporary SSR bundle, and writes
  `sitemap.xml` / `robots.txt`. The output in `dist/` is plain static files
  — no Node server is required to host it.
- **Content, components, design system**: unchanged by the migration.
  `src/content/`, `src/lib/content.ts`, `src/types/`, and almost every
  component under `src/components/` work exactly as documented in
  `CONTENT_GUIDE.md` and `DESIGN.md`.
