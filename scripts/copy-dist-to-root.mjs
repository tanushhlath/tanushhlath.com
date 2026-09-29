// Mirrors dist/ onto the project root — the last step of `npm run build`.
//
// GitHub Pages serves this repository's root, so the finished site has to
// live there too: index.html, 404.html, story/, work/…/, me/, beyond/,
// archive/, explore/, assets/, images/, media/, favicon.ico,
// site.webmanifest, sitemap.xml, robots.txt, CNAME, .nojekyll. Root
// index.html is overwritten with the built homepage (restore-dev-index.mjs
// puts the Vite entry back before the next dev/build run).
//
// Cleanup: .site-files.json (committed, next to this output) lists every
// file the previous run mirrored. A file listed there that the new build no
// longer produces — a deleted record's page, a removed image — is deleted
// from the root, so old pages don't linger on the live site. The first run
// also clears the leftovers of the old single-file build (see LEGACY_FILES).
//
// Safety: only website files (html, css, js, images, video…) can ever be
// removed, and never anything under src/, public/, scripts/, private-media/,
// node_modules/, .git/ … or the project's own config and docs — whatever
// .site-files.json says.
import fs from "node:fs";
import path from "node:path";
import { DIST, ROOT, listFiles } from "./lib/site.mjs";

const MANIFEST = path.join(ROOT, ".site-files.json");

/** Top-level folders that hold sources, tooling or private files: never written to or deleted from. */
const PROTECTED_DIRS = new Set(
  [
    ".git",
    ".github",
    ".claude",
    ".vite",
    "node_modules",
    "src",
    "public",
    "scripts",
    "private-media",
    "portfolio media",
    "dist",
    "dist-ssr",
    "coverage",
  ].map((name) => name.toLowerCase())
);

/** Top-level files that are sources, config or docs: never written to or deleted. */
const PROTECTED_ROOT_FILES =
  /^(?:dev\.html|package(?:-lock)?\.json|tsconfig(?:\.[\w-]+)?\.json|vite\.config\.[cm]?[jt]s|eslint\.config\.[cm]?js|\.gitignore|\.gitattributes|\.site-files\.json|[^/]+\.md)$/i;

/** The only kinds of files this script may ever delete. */
const REMOVABLE_EXTENSIONS = new Set([
  ".html",
  ".xml",
  ".txt",
  ".js",
  ".css",
  ".map",
  ".json",
  ".webmanifest",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".bin",
  ".woff",
  ".woff2",
]);
const REMOVABLE_NAMES = new Set(["CNAME", ".nojekyll"]);

/** Files the old single-file build left at the root, which nothing produces any more. */
const LEGACY_FILES = [
  "favicon.svg",
  "og-image.svg",
  "images/placeholder-portrait.svg",
  "images/placeholder-project-wide.svg",
  "images/Headshot_Plain.png",
];
/** Folders that only ever held built pages (the first run sweeps stale index.html files from them). */
const LEGACY_PAGE_DIRS = ["story", "work", "me", "beyond", "archive", "explore"];

/** A forward-slash path relative to the root that stays inside it and outside every protected area. */
function isMirrorable(relPath) {
  if (!relPath || path.isAbsolute(relPath) || relPath.split("/").some((part) => part === ".." || part === "")) {
    return false;
  }
  const [top, ...rest] = relPath.split("/");
  if (PROTECTED_DIRS.has(top.toLowerCase())) return false;
  return rest.length > 0 || !PROTECTED_ROOT_FILES.test(top);
}

function isRemovable(relPath) {
  if (!isMirrorable(relPath)) return false;
  const name = relPath.slice(relPath.lastIndexOf("/") + 1);
  return REMOVABLE_NAMES.has(name) || REMOVABLE_EXTENSIONS.has(path.extname(name).toLowerCase());
}

function fail(message) {
  console.error(`\ncopy-dist-to-root failed: ${message}\n`);
  process.exit(1);
}

/** What the previous run mirrored; on the very first run, the old build's leftovers. */
function previouslyMirrored() {
  if (fs.existsSync(MANIFEST)) {
    try {
      const files = JSON.parse(fs.readFileSync(MANIFEST, "utf8")).files;
      if (Array.isArray(files)) return files.filter((file) => typeof file === "string");
    } catch {
      // fall through: an unreadable manifest is treated like a first run
    }
    console.warn("  warning  .site-files.json is unreadable; treating this as a first run");
  }
  return LEGACY_PAGE_DIRS.flatMap((dir) =>
    listFiles(path.join(ROOT, dir))
      .filter((file) => file === "index.html" || file.endsWith("/index.html"))
      .map((file) => `${dir}/${file}`)
  );
}

function sameContents(a, b) {
  const statA = fs.statSync(a);
  if (!fs.existsSync(b) || fs.statSync(b).size !== statA.size) return false;
  return fs.readFileSync(a).equals(fs.readFileSync(b));
}

/** Removes `dir` and its parents while they are empty (stopping at the root). */
function removeEmptyDirs(dir) {
  while (dir.startsWith(ROOT + path.sep) && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

/* ------------------------------------------------------------------ */

if (!fs.existsSync(path.join(DIST, "index.html"))) fail("dist/index.html not found — run `npm run build`.");

const distFiles = listFiles(DIST);
const blocked = distFiles.filter((file) => !isMirrorable(file));
if (blocked.length) {
  fail(`dist/ contains files that would overwrite sources or config:\n  ${blocked.join("\n  ")}`);
}

let copied = 0;
for (const file of distFiles) {
  const from = path.join(DIST, file);
  const to = path.join(ROOT, file);
  if (sameContents(from, to)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied++;
}

const current = new Set(distFiles);
const stale = [...new Set([...previouslyMirrored(), ...LEGACY_FILES])].filter((file) => !current.has(file));
const removed = [];
for (const file of stale) {
  const full = path.join(ROOT, file);
  if (!isRemovable(file) || !fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
  fs.unlinkSync(full);
  removeEmptyDirs(path.dirname(full));
  removed.push(file);
}

fs.writeFileSync(
  MANIFEST,
  JSON.stringify(
    {
      note: "Written by scripts/copy-dist-to-root.mjs: the built files mirrored from dist/ onto the project root. Files listed here that a later build no longer produces are deleted from the root. Do not edit.",
      files: distFiles,
    },
    null,
    2
  ) + "\n"
);

console.log(
  `  mirrored     dist/ -> project root: ${distFiles.length} files (${copied} updated, ${removed.length} stale removed)`
);
for (const file of removed) console.log(`    removed    ${file}`);
