// Packs the favicon PNGs made by generate-icons.ps1 into public/favicon.ico
// (the file browsers request at /favicon.ico by default). Each size is
// stored as an embedded PNG, which every current browser and Windows
// understand. No dependencies.
//
//   node scripts/build-ico.mjs        (also part of `npm run icons`)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandingDir = path.join(root, "public", "images", "branding");
const outFile = path.join(root, "public", "favicon.ico");
const sizes = [16, 32, 48];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const images = sizes.map((size) => {
  const file = path.join(brandingDir, `favicon-${size}.png`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${path.relative(root, file)} — run scripts/generate-icons.ps1 first.`);
  }
  const data = fs.readFileSync(file);
  if (!data.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error(`${file} is not a PNG`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width !== size || height !== size) {
    throw new Error(`${path.basename(file)} is ${width}x${height}, expected ${size}x${size}`);
  }
  return { size, data };
});

// ICONDIR (6 bytes) + one ICONDIRENTRY (16 bytes) per image, then the images.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(images.length, 4);

let offset = header.length + 16 * images.length;
const entries = images.map(({ size, data }) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colours
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += data.length;
  return entry;
});

const ico = Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
fs.writeFileSync(outFile, ico);
console.log(`  wrote  ${path.relative(root, outFile)} (${sizes.join(", ")} px, ${ico.length} bytes)`);
