// How transparent a PNG really is, read from its pixels (node:zlib, no
// dependencies). media-variants.mjs uses it to decide whether a photo's
// smaller copies can be JPEGs: fully opaque photos, and screenshots whose
// only transparency is a few rounded corners, can; real cut-outs can't.
//
//   transparentShare(buffer) → share (0…1) of pixels that aren't fully
//   opaque, or null when this reader can't tell (not a PNG, interlaced,
//   or colour-keyed transparency) — callers treat null as "transparent".
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function transparentShare(buf) {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(SIGNATURE)) return null;
  let ihdr = null;
  let trns = false;
  const idat = [];
  let pos = 8;
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") ihdr = data;
    else if (type === "tRNS") trns = true;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (!ihdr) return null;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const depth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];

  // Grey, RGB and palette images without a tRNS chunk have no transparency.
  const hasAlphaChannel = colorType === 4 || colorType === 6;
  if (!hasAlphaChannel) return trns ? null : 0;
  if (interlace !== 0 || (depth !== 8 && depth !== 16)) return null;

  const channels = colorType === 6 ? 4 : 2;
  const bpp = channels * (depth / 8); // bytes per pixel
  const stride = width * bpp;
  let raw;
  try {
    raw = zlib.inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }
  if (raw.length < (stride + 1) * height) return null;

  let prev = Buffer.alloc(stride);
  let line = Buffer.alloc(stride);
  let translucent = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = src[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      line[x] = v & 0xff;
    }
    // Alpha is the last sample of every pixel (both bytes at 16 bits).
    for (let x = bpp - 1; x < stride; x += bpp) {
      if (line[x] !== 0xff || (depth === 16 && line[x - 1] !== 0xff)) translucent++;
    }
    [prev, line] = [line, prev];
  }
  return translucent / (width * height);
}
