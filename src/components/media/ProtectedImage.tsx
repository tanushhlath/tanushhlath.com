import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ImageInfo, ResolvedImage } from "@/types/content";
import { getImageInfo } from "@/lib/content";
import { cn } from "@/lib/cn";
import { mediaUrl, protectHandlers } from "./protection";

export interface ProtectedImageProps {
  image: ResolvedImage;
  /** Classes for the wrapping frame. */
  className?: string;
  /** Classes for the <img> itself. */
  imgClassName?: string;
  fit?: "cover" | "contain";
  /** Above-the-fold image: eager load + high fetch priority. */
  priority?: boolean;
  /**
   * How wide the image is drawn, as an <img sizes> value ("50vw",
   * "(min-width: 64rem) 22rem, 90vw"). It picks the responsive copy the
   * prerendered page starts loading; once the page runs, the real drawn
   * size is measured and takes over. Fill images without it assume the
   * whole viewport width until then.
   */
  sizes?: string;
  /** Absolutely fill the nearest positioned ancestor (cards, covers, tiles). */
  fill?: boolean;
  /**
   * Always load the untouched original file, never a smaller copy — for
   * big views like the photo viewer. Default: only when the image is
   * neither `fill`, `backdrop` nor given `sizes` (drawn at its own size).
   */
  original?: boolean;
  /**
   * `fill` only: never draw the photo larger than this multiple of its own
   * pixel size (default FILL_MAX_SCALE). In a bigger frame it stays centred
   * at that size and the frame's backdrop shows around it.
   */
  maxScale?: number;
  /**
   * A blurred, decorative copy of a photo (ambient glows, card
   * backdrops): never capped, and a small copy is loaded — the blur
   * hides the detail anyway. Alt text defaults to "".
   */
  backdrop?: boolean;
  /** Override the record's alt text (e.g. "" for a decorative duplicate). */
  alt?: string;
  style?: CSSProperties;
}

/**
 * Largest multiple of its own pixel size a `fill` photo is drawn at
 * (small phone shots and certificate scans look soft past this).
 */
const FILL_MAX_SCALE = 1.2;

/**
 * Before the page runs, a cover crop draws the picture wider than its box
 * (and covers drift slightly larger still), so the prerendered `sizes`
 * hint asks for a copy this much wider — keeps cropped photos sharp.
 */
const COVER_SLACK = 1.25;

/** Measured sizes: headroom for hover zooms and drifts (transforms aren't in the layout box). */
const MEASURE_SLACK = 1.1;

/** A backdrop is blurred: a copy this fraction of its drawn width is plenty. */
const BACKDROP_SHARE = 0.25;

type Candidate = { src: string; width: number };

/**
 * The only way the site renders a photo. A real <img> (width/height from
 * the media manifest so nothing shifts while loading, lazy + async decode
 * by default) under a transparent shield, with drag, long-press callout,
 * copy and the context menu disabled. See ./protection.ts for exactly
 * what that does and doesn't prevent.
 *
 * Responsive: when the build made smaller copies of the photo (see
 * scripts/lib/media-variants.mjs), they're offered through srcset/sizes.
 * After mount the image's real drawn size (crop included) is measured and
 * becomes `sizes`, so every screen downloads the smallest copy that's
 * still sharp — and never a smaller one than it already has. If a copy
 * fails to load, the original is used instead; without copies (e.g. a
 * build on a machine that can't make them) the original is all there is.
 *
 * Fill images are capped at FILL_MAX_SCALE × their own pixels (`maxScale`),
 * so a small photo in a big frame sits centred instead of blown up.
 *
 * If the file fails to load, the frame shows a quiet caption-style note
 * instead of a broken-image icon.
 */
export function ProtectedImage({
  image,
  className,
  imgClassName,
  fit = "cover",
  priority = false,
  sizes,
  fill = false,
  original,
  maxScale = FILL_MAX_SCALE,
  backdrop = false,
  alt,
  style,
}: ProtectedImageProps) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // The src whose responsive copies failed: that image falls back to its original.
  const [copiesFailed, setCopiesFailed] = useState<string>();
  // The measured `sizes` (CSS px) for a src; replaces the hint once known.
  const [measured, setMeasured] = useState<{ src: string; px: number }>();

  const info = getImageInfo(image.src);
  const width = image.width ?? info?.width;
  const height = image.height ?? info?.height;
  const ratio = width && height ? width / height : undefined;

  const useCopies = !(original ?? (!fill && !sizes && !backdrop)) && copiesFailed !== image.src;
  const candidates = useMemo(
    () => (useCopies ? candidatesFor(image.src, width, info) : undefined),
    [useCopies, image.src, width, info]
  );
  const srcSet = candidates?.map((c) => `${mediaUrl(c.src)} ${c.width}w`).join(", ");
  const hint = backdrop
    ? "160px"
    : scaleSizes(sizes ?? "100vw", fill && fit === "cover" ? COVER_SLACK : 1);
  const measuredPx = measured?.src === image.src ? measured.px : undefined;

  const onError = useCallback(() => {
    if (imgRef.current?.getAttribute("srcset")) setCopiesFailed(image.src);
    else frameRef.current?.setAttribute("data-failed", "");
  }, [image.src]);

  // A prerendered image can fail before hydration, when React's onError
  // isn't attached yet — catch that case once on mount.
  useEffect(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0 && img.getAttribute("src")) onError();
    return () => frame?.removeAttribute("data-failed");
  }, [onError]);

  // Measure how wide the picture is really drawn and ask for exactly that:
  // `sizes` hints are guesses, and a cover crop in a narrow frame draws the
  // photo much wider than the frame. Only ever asks for more than what's
  // already loaded, so a resize never triggers a pointless smaller download.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !candidates || typeof ResizeObserver === "undefined") return;
    const src = image.src;
    const observer = new ResizeObserver(([entry]) => {
      const { width: boxW, height: boxH } = entry.contentRect;
      if (!boxW || !boxH) return;
      const drawn =
        ratio && fit === "cover"
          ? Math.max(boxW, boxH * ratio)
          : ratio && fit === "contain"
            ? Math.min(boxW, boxH * ratio)
            : boxW;
      const need = Math.max(8, Math.ceil((drawn * (backdrop ? BACKDROP_SHARE : MEASURE_SLACK)) / 8) * 8);
      const loaded = loadedWidth(img, candidates);
      setMeasured((prev) => {
        const current = prev?.src === src ? prev.px : 0;
        if (need <= current) return prev;
        // The file on screen is already sharp enough: leave the choice alone.
        if (!current && loaded && loaded >= need * window.devicePixelRatio) return prev;
        return { src, px: need };
      });
    });
    observer.observe(img);
    return () => observer.disconnect();
  }, [candidates, image.src, ratio, fit, backdrop]);

  const label = alt ?? (backdrop ? "" : image.alt);
  const scale = backdrop ? undefined : maxScale;
  // The fill frame is absolutely positioned between its insets (0, or a
  // layout's mat): max sizes + auto margins shrink it and keep it centred
  // inside whatever area those insets leave.
  const capped: CSSProperties | undefined =
    fill && scale && Number.isFinite(scale) && width && height
      ? { margin: "auto", maxWidth: Math.round(width * scale), maxHeight: Math.round(height * scale) }
      : undefined;

  return (
    <span
      ref={frameRef}
      className={cn("protected-frame", fill && "protected-frame--fill", className)}
      style={capped ? { ...capped, ...style } : style}
      data-capped={capped ? "" : undefined}
      aria-hidden={backdrop || undefined}
      {...protectHandlers}
    >
      <img
        ref={imgRef}
        srcSet={srcSet}
        sizes={srcSet ? (measuredPx ? `${measuredPx}px` : hint) : undefined}
        src={mediaUrl(image.src)}
        alt={label}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        draggable={false}
        onError={onError}
        className={cn(
          "protected-media",
          fit === "contain" ? "object-contain" : "object-cover",
          imgClassName
        )}
        style={image.focus ? { objectPosition: image.focus } : undefined}
      />
      <span className="media-shield" aria-hidden="true" />
      {label && (
        <span className="media-failed-note" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * The srcset candidates: the build's copies, smallest first. The largest
 * is always full resolution — the full-size copy, or else the original
 * itself. Undefined when the build made no copies.
 */
function candidatesFor(src: string, width: number | undefined, info: ImageInfo | undefined): Candidate[] | undefined {
  if (!info?.variants.length || !width) return undefined;
  return info.variants.some((v) => v.width >= width) ? [...info.variants] : [...info.variants, { src, width }];
}

/** Pixel width of the candidate the <img> currently shows, if it has loaded one. */
function loadedWidth(img: HTMLImageElement, candidates: readonly Candidate[]): number | undefined {
  if (!img.complete || !img.naturalWidth || !img.currentSrc) return undefined;
  return candidates.find((c) => new URL(mediaUrl(c.src), document.baseURI).href === img.currentSrc)?.width;
}

/** "(min-width: 64rem) 22rem, 90vw" × 1.25 → "(min-width: 64rem) calc(22rem * 1.25), calc(90vw * 1.25)". */
function scaleSizes(sizes: string, factor: number): string {
  if (factor === 1) return sizes;
  return splitOutsideParens(sizes, ",")
    .map((entry) => {
      const tokens = splitOutsideParens(entry, " ");
      const length = tokens.pop();
      if (!length || length === "auto") return entry;
      return [...tokens, `calc(${length} * ${factor})`].join(" ");
    })
    .join(", ");
}

/** Splits on `separator` (a single character, or " " for any whitespace) outside parentheses. */
function splitOutsideParens(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0 && (separator === " " ? /\s/.test(ch) : ch === separator)) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}
