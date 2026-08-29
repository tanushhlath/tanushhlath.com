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
- **Build** (`npm run build`) does four things in sequence: a client
  build, an SSR build of `entry-server.tsx`, then `scripts/prerender.mjs`
  renders every route (including every `/work/:slug`) to a real static
  `index.html` inside `dist/`, deletes the temporary SSR bundle, writes
  `sitemap.xml` / `robots.txt`, and finally `scripts/copy-dist-to-root.mjs`
  mirrors all of `dist/` onto the project root. The output in `dist/` (and
  its root mirror) is plain static files, fully self-contained via
  `vite-plugin-singlefile` — no Node server is required to host it, and it
  works when opened directly as a local file too.
- **`dev.html` vs. root `index.html`**: `dev.html` is the real, tracked
  Vite source entry (references `/src/main.tsx`) — edit it for `<head>`
  tag/meta changes. Root `index.html` is *generated output*: `npm run dev`
  and `npm run build` both start by copying `dev.html` over `index.html`
  (`scripts/restore-dev-index.mjs`) so Vite has its entry, then `build`
  ends by overwriting `index.html` (plus creating `story/`, `work/`, `me/`,
  `beyond/`, `archive/`, `explore/`, `images/`, favicons, `sitemap.xml`,
  `robots.txt` at the project root) with the compiled site
  (`scripts/copy-dist-to-root.mjs`). Never hand-edit root `index.html` or
  those generated folders — they're overwritten on the next build.
- **Content, components, design system**: unchanged by the migration.
  `src/content/`, `src/lib/content.ts`, `src/types/`, and almost every
  component under `src/components/` work exactly as documented in
  `CONTENT_GUIDE.md` and `DESIGN.md`.
