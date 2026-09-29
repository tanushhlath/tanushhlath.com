import type { CSSProperties, ReactNode } from "react";
import type { ResolvedImage } from "@/types/content";
import { cn } from "@/lib/cn";
import { ProtectedImage } from "./ProtectedImage";
import { fitFor } from "./protection";

export interface MediaCoverProps {
  /** The record's cover. Omit (or pass undefined) for the typographic fallback. */
  image?: ResolvedImage;
  /** Record title — drives the fallback monogram and pattern. */
  title: string;
  /** Small label on the fallback, e.g. the category ("Entrepreneurship"). */
  label?: string;
  /**
   * `view-transition-name` for the card → detail shared-element morph,
   * e.g. `work-${id}`. Must be unique on the page: set it on ONE cover
   * per record, and the same name on the detail hero.
   */
  vtName?: string;
  /** CSS aspect ratio, e.g. "16/10". Omit to fill the parent's box. */
  aspect?: string;
  /**
   * "auto" (default) crops to fill, except when a known `aspect` would cut
   * away a large part of the picture (certificates, banners) — then the
   * whole image sits on the cover's backdrop.
   */
  fit?: "auto" | "cover" | "contain";
  priority?: boolean;
  sizes?: string;
  /**
   * The cover is only a blurred, decorative backdrop (e.g. behind a pager
   * link): the photo may be enlarged past the size cap, and a small copy
   * is loaded. See ProtectedImage `backdrop`.
   */
  backdrop?: boolean;
  /** Hover zoom + slow crop drift (default true). */
  interactive?: boolean;
  /** Legibility gradient for text laid over the cover. */
  veil?: "none" | "bottom" | "full";
  className?: string;
  style?: CSSProperties;
  /** Content laid over the cover (tags, counts, a title). */
  children?: ReactNode;
}

/**
 * Never draw a cover photo past this multiple of its own pixels. The
 * cover's zoom layer adds up to ×1.07 on hover (×1.01 at rest), so the
 * photo stays within ~1.25× its real size even while hovered. A photo too
 * small for its frame sits centred on the cover's backdrop instead.
 */
const COVER_MAX_SCALE = 1.15;

/**
 * Card/hero cover. With a photo: the image sits slightly over-scaled
 * inside its frame; hovering the card (this element, or any ancestor with
 * the `group` class or `data-cover-host`) zooms in and lets the crop
 * drift slowly — it holds wherever it drifted to on leave, so nothing
 * snaps. Small photos are never blown up past COVER_MAX_SCALE. Without a
 * photo: a designed typographic panel (monogram + pattern + label)
 * derived deterministically from the title, never an empty grey box.
 */
export function MediaCover({
  image,
  title,
  label,
  vtName,
  aspect,
  fit = "auto",
  priority,
  sizes,
  backdrop = false,
  interactive = true,
  veil = "none",
  className,
  style,
  children,
}: MediaCoverProps) {
  const frameRatio = parseRatio(aspect);
  const resolvedFit =
    fit !== "auto" ? fit : image && frameRatio ? fitFor(image, frameRatio) : "cover";
  return (
    <span
      className={cn(
        "media-cover",
        interactive && "media-cover--interactive",
        !aspect && "media-cover--fill",
        className
      )}
      style={{ aspectRatio: aspect, viewTransitionName: vtName, ...style }}
      data-cover={image ? "image" : "fallback"}
      data-fit={image ? resolvedFit : undefined}
    >
      {image ? (
        <span className="media-cover__zoom">
          <span className="media-cover__drift">
            <ProtectedImage
              image={image}
              fill
              fit={resolvedFit}
              priority={priority}
              sizes={sizes}
              maxScale={COVER_MAX_SCALE}
              backdrop={backdrop}
            />
          </span>
        </span>
      ) : (
        <CoverFallback title={title} label={label} />
      )}
      {veil !== "none" && <span className={`media-cover__veil media-cover__veil--${veil}`} aria-hidden="true" />}
      {children && <span className="media-cover__content">{children}</span>}
    </span>
  );
}

/** "16/10", "16 / 10", "1.6" → 1.6; anything else → undefined. */
function parseRatio(aspect?: string): number | undefined {
  if (!aspect) return undefined;
  const [w, h = "1"] = aspect.split("/").map((part) => part.trim());
  const ratio = Number(w) / Number(h);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined;
}

const STOP_WORDS = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "the", "to", "with"]);

/** "Master's Union – AI Hackathon" → "MU"; "InnoVenture Competition" → "IC". */
function monogram(title: string): string {
  const words = title
    .replace(/['’]s\b/g, "")
    .split(/[\s\-–—:&/,.()]+/)
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));
  const letters = words
    .slice(0, 2)
    .map((w) => w.match(/[\p{L}\p{N}]/u)?.[0] ?? "")
    .join("");
  return letters.toUpperCase() || "·";
}

/** Small stable string hash (djb2) — same title, same artwork, every render. */
function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

const PATTERNS = 4;

function CoverFallback({ title, label }: { title: string; label?: string }) {
  const h = hash(title);
  const pattern = h % PATTERNS;
  // Lavender for roughly a third of covers; electric blue stays dominant.
  const tone = (h >>> 3) % 3 === 0 ? "lavender" : "azure";
  return (
    <span
      className={`media-fallback media-fallback--p${pattern} media-fallback--${tone}`}
      aria-hidden="true"
    >
      <span className="media-fallback__glow" />
      <span className="media-fallback__pattern" />
      <span className="media-fallback__mono font-display">{monogram(title)}</span>
      {label && <span className="media-fallback__label">{label}</span>}
    </span>
  );
}
