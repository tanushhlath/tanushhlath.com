// Lossless metadata stripping for published images.
//
// Photos exported from phones, cameras and design tools carry hidden
// metadata — EXIF (camera, GPS, capture time), XMP, and tool-specific
// text blocks (e.g. Canva's account/document ids). None of it is needed
// to display an image, so it is removed before the file is published.
// Pixels are never touched: PNG chunks / JPEG segments are simply dropped.
//
//   PNG : removes tEXt, iTXt, zTXt, eXIf, tIME chunks (keeps colour info)
//   JPEG: removes APP1 (EXIF/XMP), APP13 (IPTC) and COM segments — except
//         the one EXIF field browsers need to show a phone photo upright
//         (Orientation), which is kept in a minimal EXIF block of its own
//   other formats are left as they are
import fs from "node:fs";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_METADATA_CHUNKS = new Set(["tEXt", "iTXt", "zTXt", "eXIf", "tIME"]);

function stripPng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const kept = [buf.subarray(0, 8)];
  let removed = 0;
  let pos = 8;
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const end = pos + 12 + len;
    if (end > buf.length) return null; // truncated/corrupt: leave the file alone
    if (PNG_METADATA_CHUNKS.has(type)) removed++;
    else kept.push(buf.subarray(pos, end));
    pos = end;
    if (type === "IEND") break;
  }
  return removed ? Buffer.concat(kept) : null;
}

/** EXIF Orientation (1–8) from an APP1 segment's payload, or 1 (upright / not EXIF / unreadable). */
function exifOrientation(payload) {
  if (payload.length < 14 || payload.toString("latin1", 0, 6) !== "Exif\0\0") return 1;
  try {
    const tiff = payload.subarray(6);
    const le = tiff.toString("latin1", 0, 2) === "II";
    const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
    const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
    const ifd = u32(4);
    const count = u16(ifd);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > tiff.length) break;
      if (u16(entry) === 0x0112) {
        const value = u16(entry + 8);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }
  } catch {
    // unreadable EXIF: treat as upright
  }
  return 1;
}

/** A complete APP1 segment holding nothing but the Orientation tag. */
function orientationSegment(orientation) {
  const seg = Buffer.alloc(36);
  seg.writeUInt16BE(0xffe1, 0);
  seg.writeUInt16BE(34, 2); // length, excluding the marker
  seg.write("Exif\0\0", 4, "latin1");
  seg.write("MM", 10, "latin1"); // big-endian TIFF header
  seg.writeUInt16BE(42, 12);
  seg.writeUInt32BE(8, 14); // first IFD right after the header
  seg.writeUInt16BE(1, 18); // one entry:
  seg.writeUInt16BE(0x0112, 20); //   Orientation
  seg.writeUInt16BE(3, 22); //   SHORT
  seg.writeUInt32BE(1, 24); //   × 1
  seg.writeUInt16BE(orientation, 28); //   value (left-justified), 2 bytes padding
  seg.writeUInt32BE(0, 32); // no next IFD
  return seg;
}

function stripJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  const kept = [buf.subarray(0, 2)];
  let removed = 0;
  let pos = 2;
  while (pos + 4 <= buf.length && buf[pos] === 0xff) {
    const marker = buf[pos + 1];
    // Start of scan: the rest of the file is image data.
    if (marker === 0xda) {
      kept.push(buf.subarray(pos));
      return removed ? Buffer.concat(kept) : null;
    }
    const len = buf.readUInt16BE(pos + 2);
    const end = pos + 2 + len;
    if (end > buf.length) return null;
    const segment = buf.subarray(pos, end);
    if (marker === 0xe1) {
      // Keep only the orientation (a sideways phone photo must stay upright).
      const orientation = exifOrientation(segment.subarray(4));
      const minimal = orientation !== 1 ? orientationSegment(orientation) : null;
      if (minimal && minimal.equals(segment)) kept.push(segment); // already minimal
      else {
        removed++;
        if (minimal) kept.push(minimal);
      }
    } else if (marker === 0xed || marker === 0xfe) removed++;
    else kept.push(segment);
    pos = end;
  }
  return null; // unexpected structure: leave the file alone
}

/** Strips metadata from `file` in place. Returns true if the file changed. */
export function stripMetadata(file) {
  const lower = file.toLowerCase();
  const buf = fs.readFileSync(file);
  const stripped = lower.endsWith(".png")
    ? stripPng(buf)
    : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
      ? stripJpeg(buf)
      : null;
  if (!stripped) return false;
  fs.writeFileSync(file, stripped);
  return true;
}
