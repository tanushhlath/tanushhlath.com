// Static-site generation, replacing what Next's `generateStaticParams` +
// static export used to do. Run after both Vite builds:
//   1. `vite build`                                  -> dist/ (client bundle + template index.html)
//   2. `vite build --ssr src/entry-server.tsx`        -> dist-ssr/entry-server.js (Node-renderable bundle)
// This script renders every route to a string with #2, injects it into the
// template from #1, and writes one static index.html per route into dist/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const distDir = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

const SITE_URL = "https://tanushhlath.com";

const template = fs.readFileSync(path.join(distDir, "index.html"), "utf-8");

const { render, getAllWorkSlugs, getWorkItemBySlug, pageMeta } = await import(
  "file://" + ssrEntry.replace(/\\/g, "/")
);

const SITE_NAME = "Tanushh Lath";
const HOME_DESCRIPTION =
  "I'm a Grade 11 student interested in AI, computer science, entrepreneurship, and ideas that can create real-world impact. I spend my time building projects, taking on leadership opportunities, competing, and exploring what technology can do for people.";

/** @type {{ url: string, title: string, description: string }[]} */
const routes = [
  // Home uses "Name — tagline" (matches the browser-tab title everyone
  // else on the site sees); every other page uses "Page — Name" below.
  { url: "/", title: `${SITE_NAME} — I build, lead, compete, and keep asking better questions.`, description: HOME_DESCRIPTION, rawTitle: true },
  { url: "/story", title: pageMeta.story.title, description: pageMeta.story.description },
  { url: "/work", title: pageMeta.work.title, description: pageMeta.work.description },
  { url: "/me", title: pageMeta.me.title, description: pageMeta.me.description },
  { url: "/beyond", title: pageMeta.beyond.title, description: pageMeta.beyond.description },
  { url: "/archive", title: pageMeta.archive.title, description: pageMeta.archive.description },
  { url: "/explore", title: pageMeta.explore.title, description: pageMeta.explore.description },
];

for (const slug of getAllWorkSlugs()) {
  const work = getWorkItemBySlug(slug);
  routes.push({
    url: `/work/${slug}`,
    title: work.item.title,
    description: work.item.summary,
  });
}

function injectHtml(appHtml, { url, title, description, rawTitle }) {
  let html = template;
  const fullTitle = rawTitle ? title : `${title} — ${SITE_NAME}`;
  const canonical = `${SITE_URL}${url}`;
  // How many directories deep this route's own index.html lands in dist/
  // (e.g. /work/wizmo -> dist/work/wizmo/index.html, depth 2). Used below
  // to turn root-relative "/images/..." references into ones that also
  // resolve correctly when this exact file is opened directly (file://
  // has no server root to resolve a leading "/" against).
  const depth = url === "/" ? 0 : url.split("/").filter(Boolean).length;
  const upDirs = "../".repeat(depth);

  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(fullTitle)}</title>`);
  html = html.replace(
    /<meta name="description" content=".*?"\s*\/>/s,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<link rel="canonical" href=".*?"\s*\/>/,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/>/s, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/>/s, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);

  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  // Rewrite root-relative references to public/images (the headshot, any
  // future project/event photos) to be relative to *this* file's actual
  // location, so images still load whether the page is served from a real
  // domain root or opened directly as a local file.
  html = html.replace(/(src|href)="\/images\//g, `$1="${upDirs}images/`);

  // Vite writes favicon links as "./favicon.svg", correct only for the
  // template's own location — fix up for however deep this route actually is.
  if (depth > 0) {
    html = html.replace(/href="\.\/favicon/g, `href="${upDirs}favicon`);
  }

  return html;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

for (const route of routes) {
  const appHtml = render(route.url);
  const html = injectHtml(appHtml, route);

  const outPath =
    route.url === "/"
      ? path.join(distDir, "index.html")
      : path.join(distDir, route.url.replace(/^\//, ""), "index.html");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`  prerendered  ${route.url}`);
}

// 404.html — the convention most static hosts (Netlify, GitHub Pages, S3)
// serve automatically for an unmatched path.
const notFoundHtml = injectHtml(render("/this-route-does-not-exist"), {
  url: "/404",
  title: pageMeta.notFound.title,
  description: pageMeta.notFound.description,
});
fs.writeFileSync(path.join(distDir, "404.html"), notFoundHtml);
console.log("  prerendered  /404");

// sitemap.xml + robots.txt — previously Next's app/sitemap.ts / robots.ts.
const sitemapUrls = routes.map((r) => r.url);
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemapXml);

const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
fs.writeFileSync(path.join(distDir, "robots.txt"), robotsTxt);

console.log(`  wrote        sitemap.xml, robots.txt`);

// The SSR bundle is a build-time tool only — never ship it.
fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });

console.log(`\nPrerendered ${routes.length + 1} routes into dist/`);
