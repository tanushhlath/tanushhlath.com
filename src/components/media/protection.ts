import type { SyntheticEvent } from "react";
import { asset } from "@/routing/fileMode";

/**
 * MEDIA PROTECTION — what it does, honestly.
 *
 * Photos and videos on this site are deterrent-protected: no download or
 * "save" UI, no drag-out, no long-press callout, no right-click menu on
 * media, no copying media out of a selection, and a transparent shield
 * sits over every image so the browser's image context menu never opens.
 * That stops casual saving. It does NOT (and nothing on the web can)
 * stop screenshots, screen recording, or someone reading the page's
 * network requests in developer tools.
 */

const block = (e: SyntheticEvent) => e.preventDefault();

/** Spread onto any plain element that wraps protected media. */
export const protectHandlers = {
  onContextMenu: block,
  onDragStart: block,
  onCopy: block,
  onCut: block,
} as const;

/**
 * The same, minus drag — for framer-motion elements, where `onDragStart`
 * is the gesture API. (Images inside are `draggable={false}` anyway.)
 */
export const protectMotionHandlers = {
  onContextMenu: block,
  onCopy: block,
  onCut: block,
} as const;

/**
 * Resolves a media path for the current hosting mode. Root-relative
 * site paths ("/media/…") go through `asset()` so they also work when a
 * page is opened straight from disk; blob:, data: and absolute URLs pass
 * through untouched.
 */
export function mediaUrl(src: string): string {
  return src.startsWith("/") && !src.startsWith("//") ? asset(src) : src;
}

interface Size {
  width?: number;
  height?: number;
}

/** Width ÷ height, clamped so extreme panoramas/strips still crop well. */
export function aspectOf(size: Size, fallback = 4 / 3, [min, max]: [number, number] = [0.6, 1.9]): number {
  const ratio = size.width && size.height ? size.width / size.height : fallback;
  return Math.min(max, Math.max(min, ratio));
}

/**
 * Cover or contain for an image shown in a frame of `frameRatio`. Many of
 * the site's images are documents — certificates, letters, score strips —
 * so a crop that would cut away more than ~20% of the picture shows the
 * whole thing instead, on the frame's backdrop. An explicit `focus` in the
 * content data means the crop is intended, so it always covers.
 */
export function fitFor(image: Size & { focus?: string }, frameRatio: number): "cover" | "contain" {
  if (image.focus || !image.width || !image.height) return "cover";
  const natural = image.width / image.height;
  const mismatch = natural > frameRatio ? natural / frameRatio : frameRatio / natural;
  return mismatch > 1.25 ? "contain" : "cover";
}

/**
 * Largest width (CSS length) a frame should grow to before a small source
 * image starts to look soft: ~1.8× its intrinsic width, never below
 * `floor`. Undefined when the size is unknown (no cap).
 */
export function upscaleCap(size: Size, floor = "20rem"): string | undefined {
  return size.width ? `max(${floor}, ${Math.round(size.width * 1.8)}px)` : undefined;
}

/** Two-digit counter label: 3 → "03". */
export const pad2 = (n: number) => String(n).padStart(2, "0");
