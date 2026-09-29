import type { ResolvedImage } from "@/types/content";

/**
 * GALLERY SIZING — how big a photo may be drawn, from its own pixels.
 *
 * Most of the site's photos are small phone shots and certificate scans
 * (a few hundred pixels across), so galleries size every frame from the
 * image's intrinsic width/height (recorded in the media manifest) instead
 * of stretching it to the layout. A frame never grows past the point
 * where its photo would be drawn more than MAX_UPSCALE × its own size;
 * layouts centre what's left instead of blowing the picture up. When the
 * owner swaps in larger originals the same galleries simply grow.
 */

/** How far past its own pixels a photo may be drawn (1 = never enlarged). */
export const MAX_UPSCALE = 1.1;

/** Wider than this, a photo is a banner/score strip: it gets a row of its own. */
export const PANORAMA = 2.4;

type Size = Pick<ResolvedImage, "width" | "height">;

export interface FrameCapOptions {
  /** Contained photos sit on a mat: the fraction of the frame inset on each side. */
  mat?: number;
}

/**
 * Widest (CSS px) a frame of aspect `ratio` may be drawn before the photo
 * inside it — `cover` (cropped to fill) or `contain` (whole, on a mat) —
 * exceeds MAX_UPSCALE. Undefined when the photo's size is unknown (no cap).
 */
export function frameMaxWidth(
  image: Size,
  ratio: number,
  fit: "cover" | "contain",
  { mat = 0 }: FrameCapOptions = {}
): number | undefined {
  const { width, height } = image;
  if (!width || !height) return undefined;
  const limit =
    fit === "cover"
      ? Math.min(width, height * ratio)
      : Math.max(width, height * ratio) / (1 - 2 * mat);
  return Math.round(limit * MAX_UPSCALE);
}

/** `px` as a CSS length, or `fallback` when the size is unknown. */
export const px = (value: number | undefined, fallback = "100%") =>
  value === undefined ? fallback : `${value}px`;
