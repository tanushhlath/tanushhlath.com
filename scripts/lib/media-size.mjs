// Reads pixel dimensions straight from media file headers, without
// decoding (or even fully reading) the file. No dependencies.
//   imageSize(file) → { width, height } | null   PNG, JPEG (incl. EXIF rotation), WebP, GIF, AVIF
//   videoSize(file) → { width, height } | null   MP4/MOV/M4V via the video track's `tkhd` box (incl. rotation)
// Used by media-manifest.mjs (layout-shift-free media) and prerender.mjs
// (og:image:width/height).
import fs from "node:fs";
import path from "node:path";

export const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
export const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".mov", ".webm"]);

/* ------------------------------------------------------------------ */
/* Image headers                                                       */
/* ------------------------------------------------------------------ */

/** Reads the first `length` bytes of a file (headers only, never the whole file). */
function readHead(file, length) {
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(length);
    const read = fs.readSync(fd, buf, 0, length, 0);
    return buf.subarray(0, read);
  } finally {
    fs.closeSync(fd);
  }
}

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function gifSize(buf) {
  if (buf.length < 10 || !/^GIF8[79]a$/.test(buf.toString("ascii", 0, 6))) return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function webpSize(buf) {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  if (chunk === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  return null;
}

/** EXIF orientation (1–8) from a JPEG APP1 segment; null when the segment isn't EXIF (e.g. XMP). */
function exifOrientation(seg) {
  if (seg.toString("ascii", 0, 6) !== "Exif\0\0") return null;
  const tiff = seg.subarray(6);
  const le = tiff.toString("ascii", 0, 2) === "II";
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) break;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return 1;
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let orientation = 1;
  let pos = 2;
  while (pos + 9 < buf.length) {
    if (buf[pos] !== 0xff) return null;
    const marker = buf[pos + 1];
    if (marker === 0xff) {
      pos += 1;
      continue;
    }
    const len = buf.readUInt16BE(pos + 2);
    if (marker === 0xe1) {
      // An XMP block (also APP1) often follows the EXIF one: it must not reset the orientation.
      try {
        orientation = exifOrientation(buf.subarray(pos + 4, pos + 2 + len)) ?? orientation;
      } catch {
        // unreadable EXIF: keep what we have
      }
    }
    // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buf.readUInt16BE(pos + 5);
      const width = buf.readUInt16BE(pos + 7);
      // Orientations 5–8 are displayed rotated by 90°.
      return orientation >= 5 ? { width: height, height: width } : { width, height };
    }
    pos += 2 + len;
  }
  return null;
}

function avifSize(buf) {
  if (buf.toString("ascii", 4, 8) !== "ftyp") return null;
  const at = buf.indexOf("ispe", 0, "ascii");
  if (at < 0 || at + 16 > buf.length) return null;
  return { width: buf.readUInt32BE(at + 8), height: buf.readUInt32BE(at + 12) };
}

export function imageSize(file, ext = path.extname(file).toLowerCase()) {
  // Headers live near the start; JPEG EXIF/SOF can sit a little further in.
  const buf = readHead(file, ext === ".jpg" || ext === ".jpeg" ? 256 * 1024 : 64 * 1024);
  switch (ext) {
    case ".png":
      return pngSize(buf);
    case ".gif":
      return gifSize(buf);
    case ".webp":
      return webpSize(buf);
    case ".avif":
      return avifSize(buf);
    default:
      return jpegSize(buf);
  }
}

/* ------------------------------------------------------------------ */
/* MP4 / MOV: moov > trak > tkhd                                        */
/* ------------------------------------------------------------------ */

/** Iterates ISO-BMFF boxes inside buf[start, end). */
function* boxes(buf, start, end) {
  let pos = start;
  while (pos + 8 <= end) {
    let size = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(pos + 8));
      header = 16;
    } else if (size === 0) {
      size = end - pos;
    }
    if (size < header || pos + size > end) return;
    yield { type, start: pos + header, end: pos + size };
    pos += size;
  }
}

/** Finds the top-level `moov` box by reading box headers only. */
function readMoov(file) {
  const fd = fs.openSync(file, "r");
  try {
    const fileSize = fs.fstatSync(fd).size;
    const head = Buffer.alloc(16);
    let pos = 0;
    while (pos + 8 <= fileSize) {
      fs.readSync(fd, head, 0, 16, pos);
      let size = head.readUInt32BE(0);
      const type = head.toString("latin1", 4, 8);
      if (size === 1) size = Number(head.readBigUInt64BE(8));
      else if (size === 0) size = fileSize - pos;
      if (size < 8) return null;
      if (type === "moov") {
        const moov = Buffer.alloc(size);
        fs.readSync(fd, moov, 0, size, pos);
        return moov;
      }
      pos += size;
    }
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

function mp4Size(file) {
  const moov = readMoov(file);
  if (!moov) return null;
  const [moovBox] = boxes(moov, 0, moov.length);
  for (const trak of boxes(moov, moovBox.start, moovBox.end)) {
    if (trak.type !== "trak") continue;
    for (const box of boxes(moov, trak.start, trak.end)) {
      if (box.type !== "tkhd") continue;
      const version = moov[box.start];
      // version/flags (4) + times/ids/duration (20 or 32) + reserved (8)
      // + layer, alternate group, volume, reserved (8) → 3x3 matrix (36) → width, height (16.16).
      const matrix = box.start + 4 + (version === 1 ? 32 : 20) + 16;
      const width = Math.round(moov.readUInt32BE(matrix + 36) / 65536);
      const height = Math.round(moov.readUInt32BE(matrix + 40) / 65536);
      if (!width || !height) continue; // audio track
      // A 90°/270° rotation matrix has a = d = 0: the video displays turned.
      const a = moov.readInt32BE(matrix);
      const d = moov.readInt32BE(matrix + 16);
      return a === 0 && d === 0 ? { width: height, height: width } : { width, height };
    }
  }
  return null;
}

export function videoSize(file, ext = path.extname(file).toLowerCase()) {
  if (ext === ".webm") return null; // Matroska: no cheap header read; renders fine without it.
  return mp4Size(file);
}
