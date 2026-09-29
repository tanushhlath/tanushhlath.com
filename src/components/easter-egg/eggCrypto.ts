import { asset } from "@/routing/fileMode";

/**
 * EASTER EGG DECRYPTION (browser side of scripts/encrypt-easter-egg.mjs)
 *
 * The video ships only as AES-256-GCM ciphertext (public/media/easter-egg/
 * egg.bin); the key is derived from the password with PBKDF2-SHA256, so
 * the password itself is never stored anywhere. Nothing is fetched until
 * the visitor submits a password:
 *
 *   1. egg.json  → { v: 1, iterations, salt, verifier: { iv, data }, video: { iv, file, type, bytes } }
 *   2. key = PBKDF2-SHA256(password.trim(), salt, iterations) → AES-GCM 256
 *   3. decrypt verifier; it must read "tanushh-easter-egg-ok" (wrong password → "wrong")
 *   4. fetch egg.bin, decrypt, wrap in a Blob → object URL for <VideoPlayer>
 *
 * The caller owns the object URL and must URL.revokeObjectURL() it when
 * the dialog closes. Honest limits: this keeps the video out of casual
 * reach and out of search engines; anyone who knows (or guesses) the
 * password can still watch — and record — it.
 */

const META_PATH = "/media/easter-egg/egg.json";
const VERIFIER_TEXT = "tanushh-easter-egg-ok";

interface EggMeta {
  v: number;
  iterations: number;
  salt: string;
  verifier: { iv: string; data: string };
  video: { iv: string; file: string; type: string; bytes?: number };
}

export type UnlockResult =
  | { status: "ok"; url: string; type: string }
  | { status: "wrong" }
  | { status: "unsupported" }
  | { status: "error" };

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isEggMeta(value: unknown): value is EggMeta {
  const m = value as EggMeta | null;
  return (
    !!m &&
    m.v === 1 &&
    typeof m.iterations === "number" &&
    typeof m.salt === "string" &&
    typeof m.verifier?.iv === "string" &&
    typeof m.verifier?.data === "string" &&
    typeof m.video?.iv === "string" &&
    typeof m.video?.file === "string"
  );
}

/** WebCrypto is only available in secure contexts (https, localhost). */
export function canUnlock(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle?.deriveKey === "function";
}

/**
 * Try a password. Resolves "wrong" for a wrong password, "unsupported"
 * without WebCrypto, "error" when the files can't be loaded. Rejects only
 * with an AbortError when `signal` aborts.
 */
export async function unlockEgg(password: string, signal?: AbortSignal): Promise<UnlockResult> {
  if (!canUnlock()) return { status: "unsupported" };
  const { subtle } = crypto;

  let meta: EggMeta;
  try {
    const response = await fetch(asset(META_PATH), { signal, cache: "no-cache" });
    if (!response.ok) return { status: "error" };
    const json: unknown = await response.json();
    if (!isEggMeta(json)) return { status: "error" };
    meta = json;
  } catch (error) {
    if (signal?.aborted) throw error;
    return { status: "error" };
  }

  const material = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password.trim()),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64(meta.salt), iterations: meta.iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  signal?.throwIfAborted();

  try {
    const check = await subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(meta.verifier.iv) },
      key,
      fromBase64(meta.verifier.data)
    );
    if (new TextDecoder().decode(check) !== VERIFIER_TEXT) return { status: "wrong" };
  } catch {
    // AES-GCM authentication failed: the key (so the password) is wrong.
    return { status: "wrong" };
  }
  signal?.throwIfAborted();

  try {
    const base = META_PATH.slice(0, META_PATH.lastIndexOf("/") + 1);
    const response = await fetch(asset(`${base}${meta.video.file}`), { signal });
    if (!response.ok) return { status: "error" };
    const plain = await subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(meta.video.iv) },
      key,
      await response.arrayBuffer()
    );
    signal?.throwIfAborted();
    const type = meta.video.type || "video/mp4";
    return { status: "ok", url: URL.createObjectURL(new Blob([plain], { type })), type };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { status: "error" };
  }
}
