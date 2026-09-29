// RESPONSIVE COPIES ("variants") of the site's photos.
//
// Cards and thumbnails show photos far smaller than the files themselves,
// and most photos are PNG screenshots that weigh 5–10× what the same
// picture does as a JPEG. So the build writes smaller copies next to each
// photo, in a `_w/` folder that the media scanner never lists as a photo:
//
//   public/media/events/innoventure/3.png                  the original — never touched
//   public/media/events/innoventure/_w/3-160.1a2b3c4d.jpg   160 px wide
//   public/media/events/innoventure/_w/3-320.1a2b3c4d.jpg   320 px wide
//   public/media/events/innoventure/_w/3-467.1a2b3c4d.jpg   full size, as a JPEG
//
// The media manifest lists them, and <ProtectedImage> offers them to the
// browser through srcset/sizes: every screen downloads the smallest copy
// that is still sharp, and only the photo viewer loads originals.
//
// - Widths: 160, 320, 480, 640, 960, 1280, 1920, 2560 — each only when it is
//   at most 85% of the photo's own width — plus a full-size JPEG of PNG photos
//   up to 2560 px wide. (A JPEG original is already compact: it serves as
//   its own full size.) GIF, WebP and AVIF files are used as they are.
// - Photos with real transparency (cut-outs, logos) get PNG copies; the
//   few transparent pixels of rounded screenshot corners are filled in.
// - Names carry a fingerprint of the original's bytes and of the settings
//   below, so a replaced photo gets new copy URLs (browsers never show a
//   stale thumbnail) and copies are only written when something changed.
// - Copies of photos that were removed or replaced are deleted.
// - Writing needs Windows (System.Drawing, via scripts/media-thumbs.ps1).
//   Anywhere else — or if writing fails — the step is skipped with a note
//   and the site serves the originals; copies that still match stay in use.
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transparentShare } from "./png-alpha.mjs";
import { stripMetadata } from "./strip-metadata.mjs";

/** Folder (inside each media folder) that holds the copies. */
export const VARIANT_DIR = "_w";

const WIDTHS = [160, 320, 480, 640, 960, 1280, 1920, 2560];
/** A smaller copy must be at most this share of the original's width to be worth a file. */
const STEP = 0.85;
/** PNG photos up to this width also get a full-size JPEG copy. */
const FULL_MAX = 2560;
const QUALITY = 84;
/** More non-opaque pixels than this share = a real cut-out: keep PNG copies. */
const TRANSPARENT_SHARE = 0.05;
/** Part of every fingerprint: whatever changes the bytes of a copy. Change it and every copy is rewritten. */
const RECIPE = `variants-1 q${QUALITY} alpha${TRANSPARENT_SHARE}`;

const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
/** "<slug>-<width>.<fingerprint>.<jpg|png>" — anything else in _w/ is left alone. */
const VARIANT_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d+\.[0-9a-f]{8}\.(?:jpg|png)(?:\.tmp)?$/;

const THUMBS_SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "media-thumbs.ps1");

/** "Stage photo (2).PNG" → "stage-photo-2" (safe inside srcset: no spaces or commas). */
function slugOf(file) {
  const slug = path
    .basename(file, path.extname(file))
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "photo";
}

/**
 * What one photo's copies should be. `image` = { dir, file, width, height }
 * (displayed size, EXIF rotation applied). Null when it gets no copies.
 */
function planFor(image) {
  const ext = path.extname(image.file).toLowerCase();
  if (!SOURCE_EXTENSIONS.has(ext) || !image.width || !image.height) return null;
  const source = path.join(image.dir, image.file);
  const bytes = fs.readFileSync(source);
  const hash = crypto.createHash("sha1").update(RECIPE).update(bytes).digest("hex").slice(0, 8);
  const slug = slugOf(image.file);
  const isPng = ext === ".png";

  const widths = WIDTHS.filter((w) => w <= image.width * STEP);
  if (isPng && image.width <= FULL_MAX) widths.push(image.width);
  if (!widths.length) return null;

  const nameFor = (width, format) => `${VARIANT_DIR}/${slug}-${width}.${hash}.${format}`;
  const exists = (rel) => fs.existsSync(path.join(image.dir, rel));

  // JPEG or PNG copies: whatever was already written for this fingerprint,
  // otherwise decided from the pixels (only PNGs can be transparent).
  let format = ["jpg", "png"].find((f) => widths.some((w) => exists(nameFor(w, f))));
  if (!format) {
    const share = isPng ? transparentShare(bytes) : 0;
    format = share !== null && share <= TRANSPARENT_SHARE ? "jpg" : "png";
  }
  // A transparent PNG is its own full size.
  const targets = (format === "png" ? widths.filter((w) => w < image.width) : widths).map((width) => ({
    width,
    height: Math.max(1, Math.round((width * image.height) / image.width)),
    file: nameFor(width, format),
  }));
  if (!targets.length) return null;
  return { ...image, source, flatten: format === "jpg", targets, missing: targets.some((t) => !exists(t.file)) };
}

/** Runs media-thumbs.ps1 on the jobs; returns the indexes that failed, with messages. */
function render(jobs) {
  const jobFile = path.join(os.tmpdir(), `media-variants-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(
    jobFile,
    JSON.stringify(
      jobs.map((job) => ({
        source: job.source,
        flatten: job.flatten,
        outputs: job.targets.map((t) => ({ width: t.width, height: t.height, path: path.join(job.dir, t.file) })),
      }))
    )
  );
  try {
    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", THUMBS_SCRIPT, "-Jobs", jobFile, "-Quality", String(QUALITY)],
      { encoding: "utf8", windowsHide: true, timeout: 10 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 }
    );
    if (result.error) return { error: result.error.message };
    const failed = new Map();
    const done = new Set();
    for (const line of (result.stdout ?? "").split(/\r?\n/)) {
      const match = /^(ok|fail) (\d+)(?: (.*))?$/.exec(line.trim());
      if (!match) continue;
      if (match[1] === "ok") done.add(Number(match[2]));
      else failed.set(Number(match[2]), match[3] ?? "unknown error");
    }
    jobs.forEach((_, i) => {
      if (!done.has(i) && !failed.has(i)) failed.set(i, (result.stderr || "no result").trim().split(/\r?\n/)[0]);
    });
    return { failed };
  } finally {
    fs.rmSync(jobFile, { force: true });
  }
}

/**
 * Brings every photo's copies up to date and deletes stale ones.
 *
 *   images  [{ dir, file, width, height }] — every photo in the scanned folders
 *   folders every scanned media folder (copies left in a folder whose photos
 *           are all gone are cleaned up too)
 *
 * Returns { variants, written, removed, notes }: `variants` maps
 * "<dir>/<file>" to the copies on disk, [{ width, file: "_w/…" }], smallest first.
 */
export function syncVariants(images, folders) {
  const notes = [];
  const plans = images.map(planFor).filter(Boolean);
  const jobs = plans.filter((plan) => plan.missing);

  let written = 0;
  if (jobs.length) {
    if (process.platform !== "win32") {
      notes.push(
        `${jobs.length} photo(s) have no small copies yet — they're made on Windows (System.Drawing); until then the site serves the originals`
      );
    } else {
      const { error, failed } = render(jobs);
      if (error) {
        notes.push(`could not make small photo copies (${error}); the site serves the originals`);
      } else {
        jobs.forEach((job, i) => {
          const rel = path.join(path.basename(job.dir), job.file);
          if (failed.has(i)) {
            notes.push(`${rel}: could not make small copies (${failed.get(i)}); the original is used`);
            return;
          }
          for (const target of job.targets) {
            const file = path.join(job.dir, target.file);
            if (!fs.existsSync(file)) continue;
            stripMetadata(file); // fresh encodes carry none; belt and braces
            written++;
          }
        });
      }
    }
  }

  // What is on disk now, per photo.
  const variants = new Map();
  const keep = new Set();
  for (const plan of plans) {
    const onDisk = plan.targets.filter((t) => fs.existsSync(path.join(plan.dir, t.file)));
    for (const t of onDisk) keep.add(path.join(plan.dir, t.file));
    if (onDisk.length) {
      variants.set(path.join(plan.dir, plan.file), onDisk.map(({ width, file }) => ({ width, file })));
    }
  }

  // Stale copies: generated names in _w/ that no current photo produces.
  let removed = 0;
  for (const dir of folders) {
    const out = path.join(dir, VARIANT_DIR);
    if (!fs.existsSync(out)) continue;
    for (const name of fs.readdirSync(out)) {
      const full = path.join(out, name);
      if (!VARIANT_NAME.test(name) || keep.has(full)) continue;
      fs.rmSync(full, { force: true });
      removed++;
    }
    if (!fs.readdirSync(out).length) fs.rmdirSync(out);
  }

  return { variants, written, removed, notes };
}
