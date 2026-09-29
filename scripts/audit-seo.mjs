// SEO audit for the built site — part of `npm run build` and `npm run check`.
//
//   node scripts/audit-seo.mjs              checks dist/
//   node scripts/audit-seo.mjs --dir .      checks another built copy (e.g. the root mirror)
//
// Checks that search engines get one consistent answer for every page:
//   - sitemap.xml lists only canonical URLs: https, no www, trailing slash,
//     no ?query or #fragment, no duplicates, each one an existing page
//   - every sitemap page: <link rel=canonical> === its own URL === og:url,
//     indexable robots meta, non-empty title + description (titles unique),
//     lang, viewport, theme-color, favicon, og:image (absolute https URL of
//     a real file, with correct og:image:width/height), Twitter card, valid
//     JSON-LD
//   - every other page (404, old-slug redirects) is noindex, and every
//     indexable page is in the sitemap
//   - robots.txt allows everything and points at the canonical sitemap
//   - CNAME, .nojekyll and site.webmanifest (with existing icons) are present
// Exits with code 1 and a list of problems if anything fails.
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "./lib/media-size.mjs";
import {
  decodeEntities,
  fileOfWebPath,
  jsonLdBlocks,
  listFiles,
  readSiteUrl,
  rel,
  report,
  siteDirFromArgs,
  startTags,
  stripNonMarkup,
  webPathOf,
} from "./lib/site.mjs";

const SITE_DIR = siteDirFromArgs();
const SITE_URL = readSiteUrl();
const SITE_HOST = new URL(SITE_URL).host;

const TITLE_MAX = 70;
const DESCRIPTION_RANGE = [50, 160];

const problems = [];
const warnings = [];

function fail(message) {
  console.error(`\naudit-seo: ${message}\n`);
  process.exit(1);
}

const exists = (file) => fs.existsSync(path.join(SITE_DIR, file));
const read = (file) => fs.readFileSync(path.join(SITE_DIR, file), "utf8");

if (!exists("index.html")) fail(`${rel(SITE_DIR)}/index.html not found — run \`npm run build\` first.`);
if (!exists("sitemap.xml")) fail(`${rel(SITE_DIR)}/sitemap.xml not found — run \`npm run build\` first.`);

/* ------------------------------------------------------------------ */
/* Head parsing                                                        */
/* ------------------------------------------------------------------ */

/** The SEO-relevant parts of a page's <head>. Repeated tags are kept as arrays. */
function readHead(html) {
  const headEnd = html.search(/<\/head>/i);
  const headHtml = headEnd === -1 ? html : html.slice(0, headEnd);
  const head = {
    lang: html.match(/<html\b[^>]*\blang="([^"]*)"/i)?.[1] ?? "",
    titles: [...headHtml.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => decodeEntities(m[1]).trim()),
    meta: new Map(),
    links: new Map(),
    jsonLd: jsonLdBlocks(headHtml),
  };
  for (const tag of startTags(stripNonMarkup(headHtml))) {
    if (tag.name === "meta") {
      const key = tag.attrs.get("name") ?? tag.attrs.get("property") ?? tag.attrs.get("http-equiv");
      if (!key) continue;
      const list = head.meta.get(key.toLowerCase()) ?? [];
      list.push(tag.attrs.get("content") ?? "");
      head.meta.set(key.toLowerCase(), list);
    } else if (tag.name === "link") {
      for (const relToken of (tag.attrs.get("rel") ?? "").toLowerCase().split(/\s+/).filter(Boolean)) {
        const list = head.links.get(relToken) ?? [];
        list.push(tag.attrs.get("href") ?? "");
        head.links.set(relToken, list);
      }
    }
  }
  return head;
}

const one = (list) => (list && list.length === 1 ? list[0] : undefined);

/** Checks an absolute URL on this site points at a real file; returns that file (or null). */
function ownFile(url, where, label) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    problems.push(`${where}: ${label} is not an absolute URL ("${url}")`);
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.host !== SITE_HOST) {
    problems.push(`${where}: ${label} must start with ${SITE_URL}/ ("${url}")`);
    return null;
  }
  const file = fileOfWebPath(parsed.pathname);
  if (!exists(file)) {
    problems.push(`${where}: ${label} ${url} does not exist in ${rel(SITE_DIR)}/`);
    return null;
  }
  return file;
}

/* ------------------------------------------------------------------ */
/* Sitemap                                                             */
/* ------------------------------------------------------------------ */

const sitemapUrls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decodeEntities(m[1]).trim());
if (!sitemapUrls.length) problems.push("sitemap.xml lists no URLs");

const sitemapPaths = new Map(); // web path → URL
for (const url of sitemapUrls) {
  const where = `sitemap.xml <loc>${url}</loc>`;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    problems.push(`${where}: not a URL`);
    continue;
  }
  if (parsed.protocol !== "https:") problems.push(`${where}: must be https`);
  if (parsed.host !== SITE_HOST) problems.push(`${where}: host must be ${SITE_HOST} (no www)`);
  if (parsed.search || parsed.hash || url.includes("#")) problems.push(`${where}: no query strings or fragments`);
  if (!parsed.pathname.endsWith("/")) problems.push(`${where}: must end with a trailing slash`);
  if (sitemapPaths.has(parsed.pathname)) problems.push(`${where}: listed twice`);
  sitemapPaths.set(parsed.pathname, url);
  if (!exists(fileOfWebPath(parsed.pathname))) problems.push(`${where}: no page at ${parsed.pathname}`);
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

const htmlFiles = listFiles(SITE_DIR).filter((file) => file.endsWith(".html"));
const titles = new Map(); // title → first page
const descriptions = new Map();
let indexableCount = 0;

for (const file of htmlFiles) {
  const webPath = webPathOf(file);
  const html = read(file);
  const head = readHead(html);
  const robots = (one(head.meta.get("robots")) ?? "").toLowerCase();
  const noindex = robots.includes("noindex");
  const canonicals = head.links.get("canonical") ?? [];
  const canonical = one(canonicals);
  const inSitemap = sitemapPaths.has(webPath);
  const where = webPath;

  if (canonicals.length > 1) problems.push(`${where}: ${canonicals.length} canonical links`);
  if ((head.meta.get("robots") ?? []).length > 1) problems.push(`${where}: more than one robots meta tag`);

  if (!inSitemap) {
    // 404.html and old-slug redirect pages: must stay out of search results.
    if (!noindex) problems.push(`${where}: indexable page missing from sitemap.xml (add it, or mark it noindex)`);
    if (canonical) ownFile(canonical, where, "canonical");
    continue;
  }

  indexableCount++;
  const url = sitemapPaths.get(webPath);
  if (noindex) problems.push(`${where}: in sitemap.xml but robots says "${robots}"`);
  if (!canonical) problems.push(`${where}: missing <link rel="canonical">`);
  else if (canonical !== url) problems.push(`${where}: canonical is ${canonical}, expected ${url}`);
  const ogUrl = one(head.meta.get("og:url"));
  if (ogUrl !== url) problems.push(`${where}: og:url is ${ogUrl ?? "missing"}, expected ${url}`);

  if (head.lang !== "en") problems.push(`${where}: <html lang="en"> missing`);
  if (!/width=device-width/.test(one(head.meta.get("viewport")) ?? "")) problems.push(`${where}: viewport meta missing`);
  if (!one(head.meta.get("theme-color"))) problems.push(`${where}: theme-color meta missing`);
  if (!(head.links.get("icon") ?? []).length) problems.push(`${where}: favicon link missing`);
  if (!(head.links.get("apple-touch-icon") ?? []).length) warnings.push(`${where}: apple-touch-icon link missing`);

  const title = head.titles.length === 1 ? head.titles[0] : "";
  if (head.titles.length !== 1) problems.push(`${where}: ${head.titles.length} <title> elements`);
  if (!title) problems.push(`${where}: empty <title>`);
  else {
    if (titles.has(title)) problems.push(`${where}: same <title> as ${titles.get(title)} ("${title}")`);
    else titles.set(title, where);
    if (title.length > TITLE_MAX) warnings.push(`${where}: title is ${title.length} characters (search results show ~${TITLE_MAX})`);
  }

  const description = one(head.meta.get("description")) ?? "";
  if (!description.trim()) problems.push(`${where}: empty or missing meta description`);
  else {
    if (descriptions.has(description)) warnings.push(`${where}: same description as ${descriptions.get(description)}`);
    else descriptions.set(description, where);
    const [min, max] = DESCRIPTION_RANGE;
    if (description.length < min || description.length > max) {
      warnings.push(`${where}: description is ${description.length} characters (aim for ${min}–${max})`);
    }
  }

  for (const key of ["og:title", "og:description", "og:type", "og:site_name", "twitter:card"]) {
    if (!one(head.meta.get(key))?.trim()) problems.push(`${where}: ${key} missing`);
  }

  const ogImage = one(head.meta.get("og:image"));
  if (!ogImage) problems.push(`${where}: og:image missing`);
  else {
    const imageFile = ownFile(ogImage, where, "og:image");
    const size = imageFile ? imageSize(path.join(SITE_DIR, imageFile)) : null;
    if (imageFile && !size) problems.push(`${where}: og:image ${ogImage} is not a readable image`);
    if (size) {
      const width = Number(one(head.meta.get("og:image:width")));
      const height = Number(one(head.meta.get("og:image:height")));
      if (width !== size.width || height !== size.height) {
        problems.push(`${where}: og:image:width/height say ${width}×${height}, the image is ${size.width}×${size.height}`);
      }
    }
    const twitterImage = one(head.meta.get("twitter:image"));
    if (twitterImage && twitterImage !== ogImage) warnings.push(`${where}: twitter:image differs from og:image`);
  }

  for (const block of head.jsonLd) {
    try {
      const data = JSON.parse(block);
      if (data["@context"] !== "https://schema.org") problems.push(`${where}: JSON-LD without "@context": "https://schema.org"`);
      const urls = JSON.stringify(data).match(/https?:\/\/[^"\s]+/g) ?? [];
      for (const found of urls) {
        const parsed = new URL(found);
        if ((parsed.host === SITE_HOST || parsed.host === `www.${SITE_HOST}`) && !found.startsWith(`${SITE_URL}/`)) {
          problems.push(`${where}: JSON-LD URL ${found} is not canonical`);
        }
      }
    } catch (error) {
      problems.push(`${where}: invalid JSON-LD (${error.message})`);
    }
  }
  if (webPath === "/") {
    const types = head.jsonLd.flatMap((block) => {
      try {
        return [JSON.parse(block)["@type"]].flat();
      } catch {
        return [];
      }
    });
    for (const type of ["Person", "WebSite"]) {
      if (!types.includes(type)) warnings.push(`/: no ${type} structured data`);
    }
  }
}

if (exists("404.html")) {
  const robots = one(readHead(read("404.html")).meta.get("robots")) ?? "";
  if (!robots.includes("noindex")) problems.push("404.html must be noindex");
} else {
  problems.push("404.html is missing (GitHub Pages serves it for unknown URLs)");
}

/* ------------------------------------------------------------------ */
/* robots.txt, CNAME, .nojekyll, site.webmanifest                      */
/* ------------------------------------------------------------------ */

if (!exists("robots.txt")) problems.push("robots.txt is missing");
else {
  const robots = read("robots.txt");
  if (!/^User-agent:\s*\*\s*$/im.test(robots)) problems.push("robots.txt: no `User-agent: *` group");
  const blocking = robots.match(/^Disallow:\s*\S+.*$/gim);
  if (blocking) problems.push(`robots.txt blocks crawling: ${blocking.join("; ")}`);
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
    problems.push(`robots.txt must reference Sitemap: ${SITE_URL}/sitemap.xml`);
  }
}

if (!exists("CNAME")) problems.push("CNAME is missing (GitHub Pages custom domain)");
else if (read("CNAME").trim() !== SITE_HOST) problems.push(`CNAME says "${read("CNAME").trim()}", expected ${SITE_HOST}`);
if (!exists(".nojekyll")) problems.push(".nojekyll is missing (GitHub Pages would run Jekyll)");

if (!exists("site.webmanifest")) problems.push("site.webmanifest is missing");
else {
  try {
    const manifest = JSON.parse(read("site.webmanifest"));
    for (const icon of manifest.icons ?? []) {
      if (!exists(fileOfWebPath(icon.src))) problems.push(`site.webmanifest: icon ${icon.src} does not exist`);
    }
    if (!manifest.icons?.some((icon) => String(icon.purpose ?? "").includes("maskable"))) {
      warnings.push("site.webmanifest: no maskable icon");
    }
  } catch (error) {
    problems.push(`site.webmanifest is not valid JSON (${error.message})`);
  }
}

const code = report("audit-seo", problems, warnings);
if (!code) {
  console.log(
    `  seo          ${indexableCount} canonical pages = ${sitemapUrls.length} sitemap URLs; ` +
      `${htmlFiles.length - indexableCount} noindex pages (404, redirects)`
  );
}
process.exit(code);
