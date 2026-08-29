# Deployment Guide

## Recommended host: Vercel

This is a standard Next.js App Router project with no special server
requirements, so Vercel (made by the Next.js team) is the path of least
resistance. Netlify or Cloudflare Pages also work fine if you prefer them.

### First deploy

1. Push this project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: Next.js (auto-detected). No environment variables are
   required for the site to work.
4. Deploy. You'll get a `*.vercel.app` URL immediately.

### Connect your custom domain

1. In the Vercel project → **Settings → Domains**, add your domain
   (e.g. `tanushhlath.com`).
2. Vercel gives you either an A record + CNAME, or nameservers, depending on
   your registrar. Add the records at your domain registrar.
3. HTTPS is provisioned automatically once DNS resolves — no manual
   certificate setup.
4. Update `siteUrl` in `src/app/layout.tsx` and `src/app/sitemap.ts` (and the
   `sitemap` value in `src/app/robots.ts`) to your real domain — these are
   currently `https://tanushhlath.com`.

### Every future update

Push to your main branch (or whichever branch you set as production) —
Vercel rebuilds and redeploys automatically. There's no manual build/upload
step.

## Building locally

```bash
npm run build   # production build — also runs the TypeScript check
npm run start   # serve the production build at localhost:3000
```

Run `npm run build` before pushing anything you're unsure about; it will
fail loudly on a type error or broken import rather than letting it reach
production.

## Analytics

No analytics are wired up yet, by design — add them when you're ready to
publish for real rather than carrying tracking through development.

Recommended when the time comes: **Vercel Analytics** (privacy-conscious,
zero-config on Vercel — `npm i @vercel/analytics` and add
`<Analytics />` in `src/app/layout.tsx`) or **Plausible** if you'd rather not
tie analytics to the host. Either tells you visitors, popular pages, and
traffic sources without invasive tracking. Avoid anything that needs a
cookie-consent banner unless you're prepared to build one — it works against
the site's tone.

## SEO checklist (already done, verify before going public)

- [x] Per-page `<title>` / meta description (`generateMetadata` on every
      dynamic route, static `metadata` export on every static page)
- [x] Open Graph + Twitter card metadata (`src/app/layout.tsx`)
- [x] `sitemap.xml` (`src/app/sitemap.ts`, auto-includes every project and
      experience)
- [x] `robots.txt` (`src/app/robots.ts`)
- [x] Semantic HTML (`<header>`, `<main>`, `<article>`, `<nav>`, heading
      hierarchy)
- [ ] Replace `public/og-image.svg` with a real 1200×630 JPG/PNG
- [ ] Replace placeholder content in `src/content/` with real information —
      search-engine value comes from real text, not structure
- [ ] Update `siteUrl` in the three files listed above once the domain is live
