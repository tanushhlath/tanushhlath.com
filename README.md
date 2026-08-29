# Tanushh Lath — Personal Site

A living personal website — not a résumé, not a portfolio template. Built with
Vite + React + React Router + TypeScript + Tailwind CSS v4 + Framer Motion.
No Next.js, no Node.js server required in production — `npm run build`
produces a fully static site (real HTML per page, pre-rendered at build
time) that any static host can serve.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## The docs that matter

| Doc | Read this when... |
|---|---|
| **[CONTENT_CHECKLIST.md](./CONTENT_CHECKLIST.md)** | You're replacing placeholder text with real content — a complete field-by-field list of everything still needed, organized by file. |
| **[CONTENT_GUIDE.md](./CONTENT_GUIDE.md)** | You want to add/edit a project, achievement, experience, timeline event, skill, etc. **You'll spend 95% of your time here.** |
| **[DESIGN.md](./DESIGN.md)** | You want to understand or tweak the visual system — colors, type, motion. |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | You're ready to put this on a real domain. |

## How the project is organized

```
src/
  content/     ← YOUR DATA. Plain TypeScript files, one per content type.
  types/       ← The schema every content file must match.
  lib/         ← Reads content, resolves relationships (project → skill → etc).
  components/  ← Presentation. Never edit these to change what's ON the page —
                 edit src/content/ instead.
  pages/       ← One file per route (Home, Story, Work, Me, Beyond, ...).
  routes.tsx   ← The route table — shared by the browser and the static build.
  main.tsx     ← Browser entry point (hydrates the pre-rendered HTML).
  entry-server.tsx ← Used only at build time to pre-render every route.
scripts/
  prerender.mjs ← Renders every route to a real static index.html in dist/.
```

Content, presentation, and components are deliberately kept apart (see
`CONTENT_GUIDE.md`) so that updating your information never means touching
layout code.

## Commands

```bash
npm run dev      # local dev server (Vite)
npm run build    # type-checks, builds, and pre-renders every route into dist/
npm run start    # serve the built dist/ folder locally, exactly as a host would
npm run lint     # ESLint
```

## Deploying

`npm run build` is the only step a host needs to run. The result is a plain
`dist/` folder of static files — upload it as-is to any static host
(Netlify, Cloudflare Pages, GitHub Pages, S3, a shared-hosting `public_html`
folder, etc.). There is no server process to keep running.
