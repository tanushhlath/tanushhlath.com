// Lossless PNG re-encoder for the images generate-icons.ps1 writes.
// System.Drawing always saves 32-bit RGBA with weak compression; this
// rewrites each file with the same pixels but smaller: RGB instead of RGBA
// when the image is fully opaque, the best PNG row filter per row, and
// maximum deflate. Only rewrites a file if the result is smaller.
// No dependencies (node:zlib).
//
//   node scripts/optimize-png.mjs <file-or-folder> [...]
//   (run automatically by `npm run icons`)
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// ---- CRC32 (PNG chunk checksums) -----------------------------------------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Decodes an 8-bit RGB/RGBA non-interlaced PNG to raw pixel rows. */
function decode(file) {
  const buf = fs.readFileSync(file);
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");
  let pos = 8;
  let ihdr;
  const idat = [];
  const extra = []; // ancillary chunks we keep verbatim (none by default)
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") ihdr = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    else if (type === "sRGB") extra.push({ type, data });
    pos += 12 + len;
  }
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const depth = ihdr[8], colorType = ihdr[9], interlace = ihdr[12];
  if (depth !== 8 || (colorType !== 6 && colorType !== 2) || interlace !== 0) return null;
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      out[x] = v & 0xff;
    }
  }
  return { width, height, bpp, pixels, extra };
}

/** Encodes raw rows with the per-row filter that minimises the sum of |bytes|. */
function encode({ width, height, bpp, pixels, extra }) {
  const stride = width * bpp;
  const out = Buffer.alloc((stride + 1) * height);
  const candidate = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    let best = Infinity;
    for (let f = 0; f <= 4; f++) {
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? row[x - bpp] : 0;
        const b = prev ? prev[x] : 0;
        const c = prev && x >= bpp ? prev[x - bpp] : 0;
        const predictor = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c);
        const v = (row[x] - predictor) & 0xff;
        candidate[x] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < best) {
        best = score;
        out[y * (stride + 1)] = f;
        candidate.copy(out, y * (stride + 1) + 1);
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = bpp === 4 ? 6 : 2;
  const idat = zlib.deflateSync(out, { level: 9, memLevel: 9, strategy: zlib.constants.Z_FILTERED });
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    ...extra.map((c) => chunk(c.type, c.data)),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Drops the alpha channel when every pixel is fully opaque. */
function dropOpaqueAlpha(img) {
  if (img.bpp !== 4) return img;
  for (let i = 3; i < img.pixels.length; i += 4) if (img.pixels[i] !== 255) return img;
  const rgb = Buffer.alloc((img.pixels.length / 4) * 3);
  for (let i = 0, j = 0; i < img.pixels.length; i += 4, j += 3) {
    rgb[j] = img.pixels[i];
    rgb[j + 1] = img.pixels[i + 1];
    rgb[j + 2] = img.pixels[i + 2];
  }
  return { ...img, bpp: 3, pixels: rgb };
}

function collect(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.toLowerCase().endsWith(".png") ? [target] : [];
  return fs.readdirSync(target).flatMap((name) => collect(path.join(target, name)));
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("usage: node scripts/optimize-png.mjs <file-or-folder> [...]");
  process.exit(1);
}

for (const file of targets.flatMap(collect)) {
  const before = fs.statSync(file).size;
  const img = decode(file);
  if (!img) {
    console.log(`  skip   ${file} (not 8-bit RGB/RGBA)`);
    continue;
  }
  const encoded = encode(dropOpaqueAlpha(img));
  if (encoded.length < before) fs.writeFileSync(file, encoded);
  const after = Math.min(before, encoded.length);
  console.log(`  png    ${file}  ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
}
