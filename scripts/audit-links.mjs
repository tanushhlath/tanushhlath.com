// Link audit for the built site — part of `npm run build` and `npm run check`.
//
//   node scripts/audit-links.mjs              checks dist/
//   node scripts/audit-links.mjs --dir .      checks another built copy (e.g. the root mirror)
//
// Reads every HTML file and checks every href/src/srcset/poster in it:
//   - internal links and files resolve to a real file (a folder → its index.html)
//   - page links are canonical: trailing slash, no ?query, no index.html,
//     not pointing at an old-slug redirect page
//   - #fragments exist as an id on the target page — unless they are UI
//     state (Work lenses/filters, Beyond modes, Explore lenses, from
//     src/routing/paths.ts)
//   - no local paths (C:\…, file:///, localhost), no http:// or www. links
//     to this site, no root-relative file URLs outside 404.html (they break
//     pages opened from disk)
//   - external links open in a new tab with rel="noopener noreferrer"
//   - every page sets window.__ROUTE__ to its own path (file:// support)
// Exits with code 1 and a list of problems if anything fails.
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  anchorIds,
  listFiles,
  readSiteUrl,
  readStringList,
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
const OWN_HOSTS = new Set([SITE_HOST, `www.${SITE_HOST}`]);

/** Fragments that are UI state rather than element ids, per page. */
const PATHS_TS = path.join(ROOT, "src", "routing", "paths.ts");
const oneOf = (name) => readStringList(PATHS_TS, name).join("|");
const STATE_FRAGMENTS = {
  "/work/": new RegExp(`^(?:${oneOf("WORK_LENSES")})(?:/[a-z0-9-]+)?$`),
  "/beyond/": new RegExp(`^(?:${oneOf("BEYOND_MODES")})$`),
  "/explore/": new RegExp(`^(?:${oneOf("EXPLORE_LENSES")})$`),
};

/** Attributes that hold a single URL, and the tags they are checked on. */
const URL_ATTRIBUTES = ["href", "src", "poster"];
const SRCSET_ATTRIBUTES = ["srcset", "imagesrcset"];
const LOCAL_PATH = /\b[A-Za-z]:\\[A-Za-z]|file:\/\/\/|\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\b/;

if (!fs.existsSync(path.join(SITE_DIR, "index.html"))) {
  console.error(`\naudit-links: ${rel(SITE_DIR)}/index.html not found — run \`npm run build\` first.\n`);
  process.exit(1);
}

const files = listFiles(SITE_DIR);
const fileSet = new Set(files);
const htmlFiles = files.filter((file) => file.endsWith(".html"));

const read = (file) => fs.readFileSync(path.join(SITE_DIR, file), "utf8");
const isRedirectPage = (html) => /<meta\s+http-equiv="refresh"/i.test(html);

/** Lazily parsed pages, keyed by file ("work/wizmo/index.html"). */
const pageCache = new Map();
function page(file) {
  if (!pageCache.has(file)) {
    const html = read(file);
    pageCache.set(file, { html, redirect: isRedirectPage(html), ids: null });
  }
  return pageCache.get(file);
}
function idsOf(file) {
  const entry = page(file);
  entry.ids ??= anchorIds(entry.html);
  return entry.ids;
}

const problems = new Set();
const warnings = new Set();
let checked = 0;

/** The file a site path is served from, or null. Also reports a missing trailing slash. */
function resolveFile(pathname, where, raw) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (clean === "" || clean.endsWith("/")) {
    const index = `${clean}index.html`;
    return fileSet.has(index) ? index : null;
  }
  if (fileSet.has(clean)) return clean;
  if (fileSet.has(`${clean}/index.html`)) {
    problems.add(`${where}: "${raw}" needs a trailing slash (→ /${clean}/)`);
    return `${clean}/index.html`;
  }
  return null;
}

function checkUrl(raw, { file, webPath, tag, attr }) {
  const where = `${webPath} <${tag.name} ${attr}>`;
  const url = raw.trim();
  checked++;
  if (!url) return problems.add(`${where}: empty URL`);
  if (LOCAL_PATH.test(url) || /^[A-Za-z]:[\\/]/.test(url) || url.startsWith("file:")) {
    return problems.add(`${where}: local path "${url}"`);
  }
  if (/^javascript:/i.test(url)) return problems.add(`${where}: javascript: URL`);
  if (/^(?:mailto|tel|data|blob):/i.test(url)) return;

  let resolved;
  try {
    resolved = new URL(url, `${SITE_URL}${webPath}`);
  } catch {
    return problems.add(`${where}: unparseable URL "${url}"`);
  }

  const isAbsolute = /^[a-z][a-z0-9+.-]*:|^\/\//i.test(url);
  if (!OWN_HOSTS.has(resolved.host) || !/^https?:$/.test(resolved.protocol)) {
    if (!/^https?:$/.test(resolved.protocol)) return problems.add(`${where}: unsupported URL "${url}"`);
    if (resolved.protocol === "http:") warnings.add(`${where}: insecure external link ${url}`);
    if (tag.name === "a") {
      const relTokens = (tag.attrs.get("rel") ?? "").toLowerCase().split(/\s+/);
      if (tag.attrs.get("target") !== "_blank") problems.add(`${where}: external link ${url} should open in a new tab (target="_blank")`);
      else if (!relTokens.includes("noopener") || !relTokens.includes("noreferrer")) {
        problems.add(`${where}: external link ${url} needs rel="noopener noreferrer"`);
      }
    }
    return;
  }

  // Our own site from here on.
  if (isAbsolute && (resolved.protocol !== "https:" || resolved.host !== SITE_HOST)) {
    problems.add(`${where}: "${url}" — use ${SITE_URL}${resolved.pathname}`);
  }
  if (resolved.search) problems.add(`${where}: query string in internal URL "${url}" (use a #fragment for UI state)`);
  if (!isAbsolute && url.startsWith("/") && !url.startsWith("//") && file !== "404.html") {
    const last = resolved.pathname.slice(resolved.pathname.lastIndexOf("/") + 1);
    if (last.includes(".")) problems.add(`${where}: root-relative file URL "${url}" breaks pages opened from disk`);
  }

  const target = resolveFile(resolved.pathname, where, url);
  if (!target) return problems.add(`${where}: broken link "${url}" (no ${resolved.pathname} in ${rel(SITE_DIR)}/)`);
  if (!target.endsWith(".html")) return;

  if (tag.name === "a" || tag.name === "area") {
    if (/(?:^|\/)index\.html$/.test(resolved.pathname)) {
      problems.add(`${where}: "${url}" — link to the folder, not index.html`);
    }
    const targetPage = page(target);
    if (targetPage.redirect) {
      const to = targetPage.html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "its new address";
      problems.add(`${where}: "${url}" is an old-slug redirect — link to ${to} directly`);
    }
  }

  const fragment = decodeURIComponent(resolved.hash.slice(1));
  if (!fragment) {
    if (resolved.hash === "#" || url.endsWith("#")) problems.add(`${where}: empty fragment in "${url}"`);
    return;
  }
  const targetPath = webPathOf(target);
  if (STATE_FRAGMENTS[targetPath]?.test(fragment)) return;
  if (!idsOf(target).has(fragment)) {
    problems.add(`${where}: "${url}" — no element with id="${fragment}" on ${targetPath}`);
  }
}

for (const file of htmlFiles) {
  const { html, redirect } = page(file);
  const webPath = webPathOf(file);

  const leak = html.match(LOCAL_PATH);
  if (leak) problems.add(`${webPath}: local path in the page ("${leak[0]}…")`);

  if (!redirect) {
    const route = file === "404.html" ? "/404/" : webPath;
    if (!html.includes(`window.__ROUTE__=${JSON.stringify(route)}`)) {
      problems.add(`${webPath}: missing window.__ROUTE__=${JSON.stringify(route)} (needed when opened from disk)`);
    }
  }

  for (const tag of startTags(stripNonMarkup(html))) {
    const ctx = { file, webPath, tag };
    for (const attr of URL_ATTRIBUTES) {
      if (!tag.attrs.has(attr)) continue;
      // <a> without href, <link rel=preconnect/dns-prefetch> to other origins: nothing to resolve.
      if (tag.name === "link" && /\b(?:preconnect|dns-prefetch)\b/.test(tag.attrs.get("rel") ?? "")) continue;
      checkUrl(tag.attrs.get(attr), { ...ctx, attr });
    }
    for (const attr of SRCSET_ATTRIBUTES) {
      if (!tag.attrs.has(attr)) continue;
      for (const candidate of tag.attrs.get(attr).split(",")) {
        const [url] = candidate.trim().split(/\s+/);
        if (url) checkUrl(url, { ...ctx, attr });
      }
    }
  }
}

// Local paths can also leak into the bundle and stylesheets (e.g. a build tool's absolute paths).
for (const file of files.filter((f) => /\.(?:js|css|webmanifest|xml|txt)$/.test(f))) {
  const text = read(file);
  const leak = text.match(/\b[A-Za-z]:[\\/]{1,2}Users[\\/]|file:\/\/\//);
  if (leak) problems.add(`/${file}: local path "${leak[0]}…"`);
}

const code = report("audit-links", [...problems].sort(), [...warnings].sort());
if (!code) console.log(`  links        ${checked} URLs in ${htmlFiles.length} HTML files — all resolve`);
process.exit(code);
