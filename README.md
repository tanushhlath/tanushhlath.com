# [Your Name] — Personal Site

A living personal website — not a résumé, not a portfolio template. Built with
Next.js (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion.

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
  app/         ← Routes. One folder per URL.
```

Content, presentation, and components are deliberately kept apart (see
`CONTENT_GUIDE.md`) so that updating your information never means touching
layout code.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build (also type-checks)
npm run start    # run the production build locally
npm run lint     # ESLint
```
