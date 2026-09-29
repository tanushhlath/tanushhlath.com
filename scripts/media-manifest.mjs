// Media auto-discovery. Scans
//   public/media/events/<event-id>/     and
//   public/media/projects/<project-id>/  (and the profile photo in public/images/profile/)
// and writes src/content/generated/media-manifest.json: every image/video
// in each folder with its pixel size (so the site can reserve space and
// avoid layout shift), sorted 1, 2, 3 … 10, then alphabetically.
//
// To add media to a record, drop the file into its folder and rebuild —
// this runs automatically before `npm run dev` and `npm run build`
// (predev/prebuild). Run it by hand with: node scripts/media-manifest.mjs
//   --small   also list the photos too small to look sharp when shown large
//
// Privacy: every image is also stripped of hidden metadata (EXIF, GPS,
// XMP, editor/account ids) in place — losslessly, pixels untouched — so
// nothing but the picture itself gets published (lib/strip-metadata.mjs).
//
// Responsive copies: every photo also gets smaller copies (and PNG photos
// a full-size JPEG) in a `_w/` folder beside it, listed in the manifest as
// `variants` — cards and thumbnails load those instead of the original
// (lib/media-variants.mjs). Incremental: only new or replaced photos are
// processed. Needs Windows to write them; elsewhere the originals are used.
//
// Dimensions come straight from the file headers (see lib/media-size.mjs):
// PNG, JPEG, WebP, GIF, AVIF, and MP4/MOV video. No dependencies. Only
// rewrites the JSON when it changed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, imageSize, videoSize } from "./lib/media-size.mjs";
import { stripMetadata } from "./lib/strip-metadata.mjs";
import { syncVariants } from "./lib/media-variants.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const mediaDir = path.join(publicDir, "media");
const outFile = path.join(root, "src", "content", "generated", "media-manifest.json");
const COLLECTIONS = ["events", "projects"];
/** Site photos outside public/media that pages show through <ProtectedImage> (folders relative to public/). */
const SITE_FOLDERS = ["images/profile"];
/** Narrower than this, a photo looks soft once it's shown large (and on retina screens). */
const SHARP_WIDTH = 800;

const IGNORED = new Set(["thumbs.db", "desktop.ini", ".ds_store"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const warnings = [];
const stripped = [];
const warn = (msg) => warnings.push(msg);

/* ------------------------------------------------------------------ */
/* Scan                                                                */
/* ------------------------------------------------------------------ */

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const byName = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);

/** Every scanned folder, and every photo in them, for the responsive copies. */
const folders = [];
const photos = [];

function scanFolder(dir, label) {
  folders.push(dir);
  const entries = [];
  for (const file of fs.readdirSync(dir).sort(byName)) {
    const full = path.join(dir, file);
    // Sub-folders (e.g. the `_w/` responsive copies) are never media of their own.
    if (!fs.statSync(full).isFile() || IGNORED.has(file.toLowerCase()) || file.startsWith(".")) continue;
    const ext = path.extname(file).toLowerCase();
    const kind = IMAGE_EXTENSIONS.has(ext) ? "image" : VIDEO_EXTENSIONS.has(ext) ? "video" : null;
    if (!kind) {
      warn(`${label}/${file}: not an image or video, ignored`);
      continue;
    }
    if (kind === "image") {
      try {
        if (stripMetadata(full)) stripped.push(`${label}/${file}`);
      } catch (err) {
        warn(`${label}/${file}: could not strip metadata (${err.message})`);
      }
    }
    let size = null;
    try {
      size = kind === "image" ? imageSize(full, ext) : videoSize(full, ext);
    } catch (err) {
      warn(`${label}/${file}: could not read dimensions (${err.message})`);
    }
    if (!size && ext !== ".webm") warn(`${label}/${file}: dimensions unknown`);
    const entry = size ? { file, kind, width: size.width, height: size.height } : { file, kind };
    if (kind === "image") photos.push({ dir, file, width: size?.width, height: size?.height, label, entry });
    entries.push(entry);
  }
  return entries;
}

const manifest = {};
for (const collection of COLLECTIONS) {
  manifest[collection] = {};
  const dir = path.join(mediaDir, collection);
  if (!fs.existsSync(dir)) continue;
  for (const id of fs.readdirSync(dir).sort(byName)) {
    const folder = path.join(dir, id);
    if (!fs.statSync(folder).isDirectory()) continue;
    if (!ID_PATTERN.test(id)) warn(`${collection}/${id}: folder name should be the record id (lowercase-kebab-case)`);
    const files = scanFolder(folder, `${collection}/${id}`);
    if (files.length) manifest[collection][id] = files;
  }
}
manifest.site = {};
for (const rel of SITE_FOLDERS) {
  const folder = path.join(publicDir, ...rel.split("/"));
  if (!fs.existsSync(folder)) continue;
  const files = scanFolder(folder, rel);
  if (files.length) manifest.site[rel] = files;
}

/* ------------------------------------------------------------------ */
/* Responsive copies                                                   */
/* ------------------------------------------------------------------ */

const variants = syncVariants(photos, folders);
for (const photo of photos) {
  const list = variants.variants.get(path.join(photo.dir, photo.file));
  if (list) photo.entry.variants = list;
}

// The owner's event/project photos only (the profile folder also holds a deliberately small copy).
const small = photos.filter((p) => p.width && p.width < SHARP_WIDTH && !SITE_FOLDERS.includes(p.label));

/* ------------------------------------------------------------------ */
/* Write (one media entry per line, so diffs stay readable)            */
/* ------------------------------------------------------------------ */

const SECTIONS = [...COLLECTIONS, "site"];

function format(data) {
  const lines = ["{"];
  SECTIONS.forEach((section, si) => {
    const ids = Object.keys(data[section]);
    const closeComma = si < SECTIONS.length - 1 ? "," : "";
    if (!ids.length) {
      lines.push(`  ${JSON.stringify(section)}: {}${closeComma}`);
      return;
    }
    lines.push(`  ${JSON.stringify(section)}: {`);
    ids.forEach((id, ii) => {
      lines.push(`    ${JSON.stringify(id)}: [`);
      const files = data[section][id];
      files.forEach((entry, fi) => {
        const body = Object.entries(entry)
          .map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
          .join(", ");
        lines.push(`      { ${body} }${fi < files.length - 1 ? "," : ""}`);
      });
      lines.push(`    ]${ii < ids.length - 1 ? "," : ""}`);
    });
    lines.push(`  }${closeComma}`);
  });
  lines.push("}");
  return lines.join("\n") + "\n";
}

const json = format(manifest);
JSON.parse(json); // sanity: the hand-formatted output must be valid JSON

const previous = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : null;
if (previous !== json) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, json);
}

const count = (c) => Object.values(manifest[c]).reduce((n, files) => n + files.length, 0);
for (const w of warnings) console.warn(`  warning  ${w}`);
console.log(
  `  media    ${count("events")} event files in ${Object.keys(manifest.events).length} folders, ` +
    `${count("projects")} project files in ${Object.keys(manifest.projects).length} folders` +
    (previous === json ? " (manifest unchanged)" : ` -> ${path.relative(root, outFile)}`)
);
if (stripped.length) console.log(`  media    removed hidden metadata from ${stripped.length} image(s)`);
const withCopies = photos.filter((p) => p.entry.variants).length;
console.log(
  `  media    small copies for ${withCopies} of ${photos.length} photos` +
    (variants.written || variants.removed ? ` (${variants.written} written, ${variants.removed} stale removed)` : " (up to date)")
);
for (const note of variants.notes) console.warn(`  note     ${note}`);
if (small.length) {
  console.log(
    `  media    ${small.length} photo(s) are under ${SHARP_WIDTH} px wide and look soft when shown large — ` +
      `swap in larger originals when you can` +
      (process.argv.includes("--small") ? ":" : " (list: node scripts/media-manifest.mjs --small)")
  );
  if (process.argv.includes("--small")) {
    for (const p of [...small].sort((a, b) => a.width - b.width)) {
      console.log(`             ${String(p.width).padStart(4)} px  ${p.label}/${p.file}`);
    }
  }
}
