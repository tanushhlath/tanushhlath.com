// Encrypts the private Easter egg video so it can ship on a static host
// without a public, playable file.
//
//   node scripts/encrypt-easter-egg.mjs --password <password>
//   (or set EASTER_EGG_PASSWORD instead of passing --password)
//
// Reads   private-media/easter-egg/easter-egg.mp4   (gitignored, never deployed)
// Writes  public/media/easter-egg/egg.json          (salt, IVs, password check)
//         public/media/easter-egg/egg.bin           (the encrypted video)
//
// Format (read by the Easter egg dialog with the browser's WebCrypto):
//   key      = PBKDF2-SHA256(password, salt, 310000 iterations) → AES-256-GCM
//   verifier = AES-GCM("tanushh-easter-egg-ok") under its own IV — lets the
//              dialog reject a wrong password before downloading the video
//   egg.bin  = AES-GCM(video bytes) = ciphertext followed by the 16-byte tag
//
// The password is never written anywhere — pick one, run this once, and put
// only a *hint* in src/content/site.ts (easterEgg.hint). Re-run this script
// whenever the video or the password changes, then rebuild.
//
// Honest limitation: anyone who knows the password can decrypt the video,
// and nothing stops a screen recording. This keeps the file unplayable for
// people who haven't found the password; it is not DRM.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ITERATIONS = 310000;
const VERIFIER_TEXT = "tanushh-easter-egg-ok";

const MIME = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };

function parseArgs(argv) {
  const args = {
    input: path.join(root, "private-media", "easter-egg", "easter-egg.mp4"),
    outDir: path.join(root, "public", "media", "easter-egg"),
    password: process.env.EASTER_EGG_PASSWORD,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--password") args.password = value;
    else if (flag === "--input") args.input = path.resolve(value);
    else if (flag === "--out") args.outDir = path.resolve(value);
    else continue;
    i++;
  }
  return args;
}

const b64 = (bytes) => Buffer.from(bytes).toString("base64");

async function deriveKey(password, salt, iterations) {
  const material = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function main() {
  const { input, outDir, password } = parseArgs(process.argv.slice(2));
  if (!password) {
    console.error("Usage: node scripts/encrypt-easter-egg.mjs --password <password>");
    console.error("       (or set the EASTER_EGG_PASSWORD environment variable)");
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error(`Easter egg video not found: ${path.relative(root, input)}`);
    console.error("Put the video there (the private-media/ folder is gitignored) and run this again.");
    process.exit(1);
  }

  const video = fs.readFileSync(input);
  const type = MIME[path.extname(input).toLowerCase()] ?? "video/mp4";
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const verifierIv = webcrypto.getRandomValues(new Uint8Array(12));
  const videoIv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);

  const verifier = await subtle.encrypt({ name: "AES-GCM", iv: verifierIv }, key, new TextEncoder().encode(VERIFIER_TEXT));
  const encrypted = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: videoIv }, key, video));

  const meta = {
    v: 1,
    iterations: ITERATIONS,
    salt: b64(salt),
    verifier: { iv: b64(verifierIv), data: b64(verifier) },
    video: { iv: b64(videoIv), file: "egg.bin", type, bytes: video.length },
  };

  // Round-trip before writing anything, so a bad run can't replace good files.
  const check = await deriveKey(password, salt, ITERATIONS);
  const plain = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: videoIv }, check, encrypted));
  if (!Buffer.from(plain).equals(video)) throw new Error("Round-trip check failed; nothing written.");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "egg.bin"), encrypted);
  fs.writeFileSync(path.join(outDir, "egg.json"), JSON.stringify(meta, null, 2) + "\n");

  console.log(`  egg      ${path.relative(root, input)} (${video.length} bytes, ${type})`);
  console.log(`        -> ${path.relative(root, path.join(outDir, "egg.json"))} + egg.bin (${encrypted.length} bytes)`);
  console.log("  The password is not stored anywhere. Keep only a hint in src/content/site.ts.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
