// Shared helpers for the build scripts that write or check the built site
// (prerender.mjs, audit-links.mjs, audit-seo.mjs, copy-dist-to-root.mjs).
// Plain Node, no dependencies. The HTML helpers only need to understand the
// markup this project produces (React SSR + dev.html), not arbitrary HTML.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DIST = path.join(ROOT, "dist");

/** Relative path for log messages: "dist/work/wizmo/index.html". */
export const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");

/**
 * The built site an audit script should check: dist/ by default, or the
 * folder given with `--dir <folder>` (e.g. `--dir .` for the root mirror).
 */
export function siteDirFromArgs(argv = process.argv.slice(2)) {
  const at = argv.indexOf("--dir");
  if (at === -1) return DIST;
  if (!argv[at + 1]) throw new Error("--dir needs a folder");
  return path.resolve(argv[at + 1]);
}

/** Reads `export const NAME = ["a", "b"] …` from a source file (keeps lists like WORK_LENSES in one place). */
export function readStringList(file, name) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(new RegExp(`export const ${name}\\s*=\\s*\\[([^\\]]*)\\]`));
  if (!match) throw new Error(`Could not find \`export const ${name} = [...]\` in ${rel(file)}`);
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
}

/**
 * The canonical origin, e.g. "https://tanushhlath.com" — read from
 * SITE_URL in src/routing/paths.ts so routing and the build share one value.
 */
export function readSiteUrl() {
  const source = fs.readFileSync(path.join(ROOT, "src", "routing", "paths.ts"), "utf8");
  const match = source.match(/export const SITE_URL\s*=\s*["']([^"']+)["']/);
  if (!match) throw new Error("Could not find `export const SITE_URL = \"…\"` in src/routing/paths.ts");
  return match[1].replace(/\/+$/, "");
}

/** Every file below `dir`, as sorted forward-slash paths relative to it. */
export function listFiles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(path.relative(dir, full).split(path.sep).join("/"));
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out.sort();
}

/** "work/wizmo/index.html" → "/work/wizmo/", "index.html" → "/", "404.html" → "/404.html". */
export function webPathOf(relFile) {
  if (relFile === "index.html") return "/";
  if (relFile.endsWith("/index.html")) return `/${relFile.slice(0, -"index.html".length)}`;
  return `/${relFile}`;
}

/** "/work/wizmo/" → "work/wizmo/index.html", "/media/a b.png" → "media/a b.png". */
export function fileOfWebPath(webPath) {
  const clean = decodeURIComponent(webPath.split(/[?#]/)[0]).replace(/^\/+/, "");
  return clean === "" || clean.endsWith("/") ? `${clean}index.html` : clean;
}

/** Number of folders between the site root and a page: "/" → 0, "/work/wizmo/" → 2. */
export const depthOf = (webPath) => webPath.split("/").filter(Boolean).length;

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, code) => {
    const lower = code.toLowerCase();
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[lower] ?? whole;
  });
}

const INLINE_SCRIPT = /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi;

/**
 * Applies `transform` to the markup outside inline <script> blocks (theme
 * script, JSON-LD, window.__ROUTE__), which are passed through untouched.
 */
export function mapOutsideInlineScripts(html, transform) {
  let out = "";
  let last = 0;
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    out += transform(html.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return out + transform(html.slice(last));
}

/** Markup with comments and inline <script>/<style> contents removed (for scanning tags). */
export function stripNonMarkup(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(INLINE_SCRIPT, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

const START_TAG = /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/** Every start tag in `html` as { name, attrs } (attribute names lowercased, values decoded). */
export function* startTags(html) {
  for (const match of html.matchAll(START_TAG)) {
    const attrs = new Map();
    for (const attr of (match[2] ?? "").matchAll(ATTRIBUTE)) {
      const value = attr[2] ?? attr[3] ?? attr[4] ?? "";
      attrs.set(attr[1].toLowerCase(), decodeEntities(value));
    }
    yield { name: match[1].toLowerCase(), attrs };
  }
}

/** Contents of every <script type="application/ld+json"> block. */
export function jsonLdBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

/** ids (and legacy name anchors) present in a page's markup. */
export function anchorIds(html) {
  const ids = new Set();
  for (const tag of startTags(stripNonMarkup(html))) {
    if (tag.attrs.has("id")) ids.add(tag.attrs.get("id"));
    if (tag.name === "a" && tag.attrs.has("name")) ids.add(tag.attrs.get("name"));
  }
  return ids;
}

/** Formats a problem list for the console and returns the process exit code. */
export function report(title, problems, warnings = []) {
  for (const warning of warnings) console.warn(`  warning  ${warning}`);
  if (!problems.length) return 0;
  console.error(`\n${title}: ${problems.length} problem${problems.length === 1 ? "" : "s"}`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error("");
  return 1;
}
