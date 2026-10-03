// Static prerender — turns the two Vite builds into the finished static site.
// Runs inside `npm run build`, after:
//   1. vite build                                   → dist/index.html (page template),
//                                                     dist/assets/app.js + style.css, public/ files
//   2. vite build --ssr src/entry-server.tsx …      → dist-ssr/entry-server.js
//
// Using the SSR bundle's exports (render, getPrerenderRoutes, getRedirects,
// validateContent, site) it:
//   - stops the build if validateContent() reports content problems
//   - writes dist/<route>/index.html for every route: the rendered page plus
//     that page's own <head> — title, description, canonical, robots, Open
//     Graph, Twitter card, JSON-LD — and window.__ROUTE__ (file:// support)
//   - rewrites root-relative file URLs (/assets/…, /images/…, /media/…,
//     /favicon.ico …) to depth-relative ones (../../media/…), so every page
//     also works when opened straight from disk
//   - writes 404.html (absolute /assets/… URLs: it is served at any depth),
//     a redirect page for every old slug, sitemap.xml and robots.txt
//   - deletes dist-ssr/ (a build-time tool, never shipped)
//
// What a page says about itself (titles, descriptions, images, structured
// data) comes from src/content/pages.ts and the content records via
// getPrerenderRoutes(); this script only turns it into markup.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { imageSize } from "./lib/media-size.mjs";
import {
  DIST,
  ROOT,
  depthOf,
  escapeHtml,
  fileOfWebPath,
  mapOutsideInlineScripts,
  readSiteUrl,
  rel,
} from "./lib/site.mjs";

const SSR_DIR = path.join(ROOT, "dist-ssr");
const SSR_ENTRY = path.join(SSR_DIR, "entry-server.js");
const TEMPLATE = path.join(DIST, "index.html");

const SEO_START = "<!-- seo:start -->";
const SEO_END = "<!-- seo:end -->";
const ROOT_DIV = '<div id="root"></div>';

/** The site-wide link-preview card (1200×630, made by scripts/generate-icons.ps1). */
const DEFAULT_OG_IMAGE_PATH = "/images/branding/og-image.png";
/** A record's own cover is used for link previews only if it is big enough and not an extreme crop. */
const SOCIAL_IMAGE = { minWidth: 600, minHeight: 315, minRatio: 1, maxRatio: 2.2 };
const PAGE_TYPES = new Set(["website", "article", "profile"]);
/** Files public/ must provide at the site root (GitHub Pages + browsers look for them there). */
const REQUIRED_ROOT_FILES = ["CNAME", ".nojekyll", "site.webmanifest", "favicon.ico"];

function fail(message, details = []) {
  console.error(`\nprerender failed: ${message}`);
  for (const line of details) console.error(`  ✗ ${line}`);
  console.error("");
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

if (!fs.existsSync(TEMPLATE)) fail(`${rel(TEMPLATE)} not found — run \`vite build\` first (npm run build does).`);
if (!fs.existsSync(SSR_ENTRY)) {
  fail(`${rel(SSR_ENTRY)} not found — run \`vite build --ssr src/entry-server.tsx --outDir dist-ssr\` first.`);
}

const entry = await import(pathToFileURL(SSR_ENTRY).href);
const missingExports = ["render", "getPrerenderRoutes", "getRedirects", "validateContent"].filter(
  (name) => typeof entry[name] !== "function"
);
if (missingExports.length) fail(`src/entry-server.tsx must export ${missingExports.join(", ")}.`);

const contentProblems = entry.validateContent();
if (contentProblems.length) {
  fail("the content has problems. Fix these in src/content/ and build again:", contentProblems);
}

const site = entry.site ?? {};
const SITE_URL = String(entry.SITE_URL ?? site.url ?? readSiteUrl()).replace(/\/+$/, "");
const SITE_NAME = site.name ?? "Tanushh Lath";

const template = fs.readFileSync(TEMPLATE, "utf8");
checkTemplate(template);

const DEFAULT_OG_IMAGE = (() => {
  const file = path.join(DIST, fileOfWebPath(DEFAULT_OG_IMAGE_PATH));
  const size = fs.existsSync(file) ? imageSize(file) : null;
  if (!size) fail(`public${DEFAULT_OG_IMAGE_PATH} is missing — run \`npm run icons\` to generate it.`);
  return { path: DEFAULT_OG_IMAGE_PATH, width: size.width, height: size.height };
})();

/** Checks the invariants the rest of this script (and file:// support) relies on. */
function checkTemplate(html) {
  const problems = [];
  if (!html.includes(SEO_START) || !html.includes(SEO_END)) {
    problems.push(`dev.html must keep the "${SEO_START}" and "${SEO_END}" marker comments around its default meta tags`);
  }
  if (!html.includes(ROOT_DIV)) problems.push(`dev.html must contain an empty ${ROOT_DIV}`);
  if (!/<script defer src="\.\/assets\/app\.js"><\/script>/.test(html)) {
    problems.push('expected Vite to emit <script defer src="./assets/app.js"> (see classicEntryTags in vite.config.ts)');
  }
  if (/<script\b[^>]*type="module"/.test(html)) problems.push("the built template still contains a module script");
  if (/<(?:script|link)\b[^>]*assets\/[^>]*\bcrossorigin/.test(html)) {
    problems.push("the app script/stylesheet still carry `crossorigin`, which breaks file://");
  }
  if (problems.length) fail("unexpected dist/index.html template.", problems);
}

/* ------------------------------------------------------------------ */
/* Head markup                                                         */
/* ------------------------------------------------------------------ */

const absoluteUrl = (webPath) => `${SITE_URL}${encodeURI(webPath)}`;

/** JSON for an inline <script>: nothing in it can close the tag or break the page. */
function inlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const defaultImageAlt = () => `${SITE_NAME} — ${site.tagline ?? "portrait"}`;

/**
 * The route's own image if it makes a good link preview, else the default
 * card. Width/height always come from the real file in dist/, so the
 * og:image:width/height tags can't drift from the image itself.
 */
function socialImage(route) {
  if (route.image && route.image !== DEFAULT_OG_IMAGE.path) {
    const file = path.join(DIST, fileOfWebPath(route.image));
    const size = fs.existsSync(file) ? imageSize(file) : null;
    if (!size) {
      console.warn(`  warning  ${route.path}: image ${route.image} not found in dist/ — using the default social image`);
    } else {
      const ratio = size.width / size.height;
      if (
        size.width >= SOCIAL_IMAGE.minWidth &&
        size.height >= SOCIAL_IMAGE.minHeight &&
        ratio >= SOCIAL_IMAGE.minRatio &&
        ratio <= SOCIAL_IMAGE.maxRatio
      ) {
        return { path: route.image, width: size.width, height: size.height, alt: route.imageAlt || route.ogTitle };
      }
    }
  }
  const alt = route.image === DEFAULT_OG_IMAGE.path && route.imageAlt ? route.imageAlt : defaultImageAlt();
  return { ...DEFAULT_OG_IMAGE, alt };
}

function headMarkup(route, { indexable, canonical }) {
  const image = socialImage(route);
  const imageUrl = absoluteUrl(image.path);
  const tags = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    canonical ? `<link rel="canonical" href="${canonical}" />` : null,
    `<meta name="robots" content="${indexable ? "index,follow,max-image-preview:large" : "noindex,follow"}" />`,
    `<meta name="author" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:type" content="${route.type}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : null,
    `<meta property="og:title" content="${escapeHtml(route.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta property="og:image:width" content="${image.width}" />`,
    `<meta property="og:image:height" content="${image.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(image.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(route.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(image.alt)}" />`,
    ...(route.jsonLd ?? []).map((data) => `<script type="application/ld+json">${inlineJson(data)}</script>`),
    `<script>window.__ROUTE__=${inlineJson(route.path)};</script>`,
  ];
  return tags.filter(Boolean).join("\n    ");
}

/* ------------------------------------------------------------------ */
/* Depth-relative URLs                                                 */
/* ------------------------------------------------------------------ */

/**
 * "/media/x.png" or Vite's "./assets/app.js" → `${prefix}media/x.png`.
 * Only files (last segment has an extension) are rewritten — page links
 * like "/work/wizmo/" stay canonical and root-relative.
 */
function relocate(url, prefix) {
  const isRootRelative = url.startsWith("/") && !url.startsWith("//");
  const isViteRelative = url.startsWith("./");
  if (!isRootRelative && !isViteRelative) return url;
  const pathPart = url.split(/[?#]/)[0];
  const lastSegment = pathPart.slice(pathPart.lastIndexOf("/") + 1);
  if (!lastSegment.includes(".")) return url;
  return prefix + url.slice(isRootRelative ? 1 : 2);
}

// Case-insensitive: React writes srcSet= / imageSrcSet= (HTML attribute names ignore case).
const URL_ATTRIBUTE = /(\s(?:src|href|poster|data-src)=")([^"]*)(")/gi;
const SRCSET_ATTRIBUTE = /(\s(?:srcset|imagesrcset)=")([^"]*)(")/gi;
const STYLE_ATTRIBUTE = /(\sstyle=")([^"]*)(")/g;
const CSS_URL = /(url\(\s*(?:&quot;|&#x27;|&#39;|'|")?)([^)"'&]+)/g;

/** Rewrites file URLs in tag attributes; inline <script> contents are left alone. */
function relocateUrls(html, prefix) {
  return mapOutsideInlineScripts(html, (part) =>
    part
      .replace(URL_ATTRIBUTE, (_, open, value, close) => open + relocate(value, prefix) + close)
      .replace(SRCSET_ATTRIBUTE, (_, open, value, close) => {
        const candidates = value.split(",").map((candidate) => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/);
          return [relocate(url, prefix), ...descriptor].join(" ");
        });
        return open + candidates.join(", ") + close;
      })
      .replace(STYLE_ATTRIBUTE, (_, open, value, close) =>
        open + value.replace(CSS_URL, (__, start, url) => start + relocate(url, prefix)) + close
      )
  );
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

async function renderRoute(url) {
  let result;
  try {
    result = await entry.render(url);
  } catch (error) {
    fail(`rendering ${url} threw an error.`, [error?.stack ?? String(error)]);
  }
  const html = typeof result === "string" ? result : result?.html;
  if (typeof html !== "string" || !html.trim()) fail(`render("${url}") returned no HTML.`);
  return html;
}

/**
 * One complete HTML document. `prefix` is how this file reaches the site
 * root: "./", "../../", or "/" for 404.html.
 */
function buildPage(route, appHtml, { prefix, indexable, canonical }) {
  const start = template.indexOf(SEO_START);
  const end = template.indexOf(SEO_END) + SEO_END.length;
  const html =
    template.slice(0, start) +
    headMarkup(route, { indexable, canonical }) +
    template.slice(end).replace(ROOT_DIV, `<div id="root">${appHtml}</div>`);
  return relocateUrls(html, prefix);
}

function writeFile(webPath, contents) {
  const file = path.join(DIST, fileOfWebPath(webPath));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  return file;
}

function checkRoutes(routes) {
  const problems = [];
  const seen = new Set();
  for (const route of routes) {
    const label = route?.path ?? JSON.stringify(route);
    if (typeof route?.path !== "string" || !route.path.startsWith("/") || !route.path.endsWith("/")) {
      problems.push(`${label}: path must start and end with "/"`);
    }
    if (seen.has(route.path)) problems.push(`${label}: listed twice`);
    seen.add(route.path);
    for (const field of ["title", "ogTitle", "description"]) {
      if (typeof route[field] !== "string" || !route[field].trim()) problems.push(`${label}: missing ${field}`);
    }
    if (!PAGE_TYPES.has(route.type)) problems.push(`${label}: type must be one of ${[...PAGE_TYPES].join(", ")}`);
    if (route.jsonLd !== undefined && !Array.isArray(route.jsonLd)) problems.push(`${label}: jsonLd must be an array`);
  }
  if (!seen.has("/")) problems.push('no route for the homepage ("/")');
  if (problems.length) fail("getPrerenderRoutes() returned invalid routes.", problems);
}

const routes = entry.getPrerenderRoutes();
checkRoutes(routes);

const written = new Set();
const sitemapPaths = [];
for (const route of routes) {
  const indexable = !route.noindex;
  const canonical = `${SITE_URL}${route.path}`;
  const html = buildPage(route, await renderRoute(route.path), {
    prefix: route.path === "/" ? "./" : "../".repeat(depthOf(route.path)),
    indexable,
    canonical,
  });
  writeFile(route.path, html);
  written.add(route.path);
  if (indexable) sitemapPaths.push(route.path);
}
console.log(`  prerendered  ${routes.length} pages`);

/* 404.html — GitHub Pages serves it for every unknown URL, at any depth. */
{
  const notFound = {
    path: "/404/",
    title: `Page not found — ${SITE_NAME}`,
    ogTitle: "Page not found",
    description: "This page doesn't exist. Everything on the site is reachable from the homepage.",
    type: "website",
    ...(typeof entry.getNotFoundRoute === "function" ? entry.getNotFoundRoute() : {}),
  };
  const html = buildPage(notFound, await renderRoute(notFound.path), { prefix: "/", indexable: false, canonical: null });
  fs.writeFileSync(path.join(DIST, "404.html"), html);
  console.log("  prerendered  404.html");
}

/* Redirect pages for old slugs (content `aliases`). */
function normalizeRedirectTarget(value) {
  const target = value.startsWith("/") ? value : `/work/${value}/`;
  return target.endsWith("/") ? target : `${target}/`;
}

const redirects = entry.getRedirects().map(({ from, to }) => ({
  from: normalizeRedirectTarget(from),
  to: normalizeRedirectTarget(to),
}));
const redirectProblems = [];
for (const { from, to } of redirects) {
  if (written.has(from)) redirectProblems.push(`${from} is both a page and a redirect`);
  if (!written.has(to)) redirectProblems.push(`${from} redirects to ${to}, which is not a page`);
}
if (redirectProblems.length) fail("invalid redirects (check the `aliases` fields in src/content/).", redirectProblems);

function redirectPage(from, to) {
  const relative = `${path.posix.relative(from, to)}/`;
  const canonical = `${SITE_URL}${to}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Moved — ${escapeHtml(SITE_NAME)}</title>
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="${canonical}" />
    <meta name="theme-color" content="#090B10" />
    <script>
      location.replace((location.protocol === "file:" ? ${inlineJson(`${relative}index.html`)} : ${inlineJson(to)}) + location.hash);
    </script>
    <meta http-equiv="refresh" content="0; url=${relative}" />
    <style>html{background:#090b10;color:#f3f0e8;font:16px/1.5 system-ui,sans-serif}body{margin:0;padding:2rem}a{color:#8d98ff}</style>
  </head>
  <body>
    <p>This page has moved to <a href="${relative}">${escapeHtml(canonical)}</a>.</p>
  </body>
</html>
`;
}

for (const { from, to } of redirects) {
  writeFile(from, redirectPage(from, to));
  written.add(from);
}
console.log(`  redirects    ${redirects.map((r) => `${r.from} → ${r.to}`).join(", ") || "none"}`);

/* ------------------------------------------------------------------ */
/* sitemap.xml, robots.txt, root files                                 */
/* ------------------------------------------------------------------ */

const xml = (value) => escapeHtml(value).replace(/&#39;/g, "&apos;");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths
  // No <lastmod>: the build date would claim every page changed on every build.
  .map((p) => `  <url>\n    <loc>${xml(`${SITE_URL}${p}`)}</loc>\n  </url>`)
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`  wrote        sitemap.xml (${sitemapPaths.length} URLs), robots.txt`);

for (const name of REQUIRED_ROOT_FILES) {
  if (fs.existsSync(path.join(DIST, name))) continue;
  const source = path.join(ROOT, "public", name);
  if (!fs.existsSync(source)) fail(`public/${name} is missing.`);
  fs.copyFileSync(source, path.join(DIST, name));
}

// The SSR bundle is a build-time tool only — never ship it.
fs.rmSync(SSR_DIR, { recursive: true, force: true });
console.log(`  done         ${written.size} HTML files + 404.html in dist/`);
