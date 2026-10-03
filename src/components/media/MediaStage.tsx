import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { MediaLayout, ResolvedImage, ResolvedMedia, ResolvedVideo } from "@/types/content";
import { Reveal, Tilt, useParallax } from "@/animations";
import { cn } from "@/lib/cn";
import { getImageCopy } from "@/lib/content";
import { ProtectedImage } from "./ProtectedImage";
import { VideoPlayer } from "./VideoPlayer";
import { Lightbox } from "./Lightbox";
import { aspectOf, fitFor, mediaUrl, pad2, protectHandlers } from "./protection";
import { PANORAMA, frameMaxWidth, px } from "./sizing";
import { ChevronIcon, ExpandIcon } from "./icons";

type Layout = Exclude<MediaLayout, "auto">;

export interface MediaStageProps {
  media: ResolvedMedia;
  /** Record title — names the region, the viewer and each clip. */
  title: string;
  /**
   * The record's whole photo set, when `media` shows only part of it (a
   * detail page whose hero already shows the cover). Tiles are numbered
   * against it and the viewer pages through all of it, so every viewer
   * on the page counts the same way ("02 / 03"). Defaults to `media.images`.
   */
  sequence?: ResolvedImage[];
  /** Force a layout. Defaults to `media.layout` (picked by content resolution). */
  layout?: Layout;
  /** The small "Photographs 04" / "Footage 03" labels. Default true. */
  labels?: boolean;
  className?: string;
  id?: string;
}

/**
 * Renders a record's photos and videos. The layout comes from the media
 * data (count and type decide it, or the record forces one):
 *
 *   hero       one strong image, parallax depth inside its frame
 *   split      2–3 images, staggered, revealed from opposite sides
 *   mosaic     many images, justified rows (no awkward crops), "+N" tile
 *   filmstrip  many images, one horizontal strip with its own controls
 *   stack      a layered pile that spreads apart on hover/scroll
 *   stage      photos + video: a screen with a clip list and a photo rail
 *
 * Every frame is sized from its photo's own pixels (./sizing.ts): small
 * scans are shown sharp at about their real size, never stretched to the
 * layout; banners and score strips keep their shape on a row of their own.
 * Videos are always shown apart from photographs, with their captions.
 * Every photo opens the Lightbox; nothing loads until it's near the
 * viewport. Renders nothing when there is no media (the page stays
 * typography-led).
 */
export function MediaStage({ media, title, sequence, layout, labels = true, className, id }: MediaStageProps) {
  const [open, setOpen] = useState<number | null>(null);
  const { images, videos } = media;
  const numbering = useNumbering(images, sequence);
  if (images.length === 0 && videos.length === 0) return null;

  const chosen = pickLayout(layout ?? media.layout, images.length, videos.length);
  const layoutProps: LayoutProps = { images, numbering, onOpen: setOpen };

  return (
    <div
      id={id}
      className={cn("media-stage", className)}
      data-layout={chosen}
      {...protectHandlers}
    >
      {chosen === "stage" ? (
        <StageLayout {...layoutProps} videos={videos} title={title} labels={labels} />
      ) : (
        <>
          {images.length > 0 && (
            <div role="group" aria-label={`Photographs — ${title}`} className="media-stage__group">
              {labels && <GroupLabel kind="Photographs" count={images.length} />}
              <PhotoLayout layout={chosen} {...layoutProps} />
            </div>
          )}
          {videos.length > 0 && <FootageGroup videos={videos} title={title} labels={labels} />}
        </>
      )}
      <Lightbox
        images={numbering.images}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
        title={title}
      />
    </div>
  );
}

/** The requested layout, unless the media can't fill it (e.g. a "stack" of one). */
function pickLayout(requested: Layout, imageCount: number, videoCount: number): Layout {
  if (videoCount > 0 && (requested === "stage" || imageCount === 0)) return "stage";
  if (imageCount <= 1) return "hero";
  if (requested === "stage") return imageCount <= 3 ? "split" : "mosaic";
  return requested;
}

/* ------------------------------------------------------------------ */
/* Numbering — one count for the whole record                          */
/* ------------------------------------------------------------------ */

interface Numbering {
  /** Every photo the viewer pages through, in order. */
  images: ResolvedImage[];
  /** A shown photo's position in `images` (0-based). */
  of: (image: ResolvedImage) => number;
}

function useNumbering(shown: ResolvedImage[], sequence?: ResolvedImage[]): Numbering {
  return useMemo(() => {
    const position = (list: ResolvedImage[]) => new Map(list.map((img, i) => [img.src, i]));
    const inSequence = sequence ? position(sequence) : undefined;
    // A sequence that doesn't contain every shown photo can't number them; fall back to the shown set.
    const usable = sequence && inSequence && shown.every((img) => inSequence.has(img.src));
    const images = usable ? sequence : shown;
    const index = usable ? inSequence : position(shown);
    return { images, of: (img) => index.get(img.src) ?? 0 };
  }, [shown, sequence]);
}

/** Default alt text already carries "photo 2 of 3"; custom alt text gets the position added (when there's more than one). */
const HAS_POSITION = /\bphoto \d+ of \d+\b/i;

function viewLabel(image: ResolvedImage, index: number, total: number): string {
  const position = `photo ${index + 1} of ${total}`;
  if (!image.alt) return total > 1 ? `Photo ${index + 1} of ${total} — view larger` : "Photo — view larger";
  if (total < 2 || HAS_POSITION.test(image.alt)) return `${image.alt} — view larger`;
  return `${image.alt} — view larger (${position})`;
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

type OpenFn = (index: number) => void;

interface LayoutProps {
  /** The photos this layout shows. */
  images: ResolvedImage[];
  numbering: Numbering;
  /** Opens the viewer at a position in `numbering.images`. */
  onOpen: OpenFn;
}

function PhotoLayout({ layout, ...props }: LayoutProps & { layout: Layout }) {
  switch (layout) {
    case "hero":
      return <HeroLayout {...props} />;
    case "split":
      return <SplitLayout {...props} />;
    case "filmstrip":
      return <FilmstripLayout {...props} />;
    case "stack":
      return <StackLayout {...props} />;
    default:
      return <MosaicLayout {...props} />;
  }
}

function GroupLabel({ kind, count }: { kind: string; count: number }) {
  return (
    <p className="media-label">
      <span className="media-label__rule" aria-hidden="true" />
      {kind}
      <span className="media-label__count">{pad2(count)}</span>
    </p>
  );
}

/** Contained photos sit inset on the tile's backdrop (matches `.media-tile__frame[data-fit="contain"]`). */
const TILE_MAT = 0.06;

/** Largest width (px) a tile frame of `ratio` may take before its photo is enlarged past MAX_UPSCALE. */
function tileCap(image: ResolvedImage, ratio: number): number | undefined {
  const fit = fitFor(image, ratio);
  return frameMaxWidth(image, ratio, fit, { mat: fit === "contain" ? TILE_MAT : 0 });
}

interface TileProps {
  image: ResolvedImage;
  /** Position in the viewer's sequence (0-based). */
  index: number;
  /** Photos in the viewer's sequence. */
  total: number;
  onOpen: OpenFn;
  /** Frame aspect ratio (width ÷ height). */
  ratio: number;
  /** Caption placement. */
  caption?: "below" | "overlay" | "none";
  /** Images not shown in this layout — turns the tile into a "+N" tile. */
  more?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A photo that opens the viewer. Hover: zoom + lift; always a real button.
 * Publishes its shape (--tile-r) and size limits (--tile-max-w / --tile-max-h) for the layout.
 */
function Tile({
  image,
  index,
  total,
  onOpen,
  ratio,
  caption = "none",
  more = 0,
  priority,
  className,
  style,
}: TileProps) {
  const label = more ? `View all ${total} photos, starting with photo ${index + 1}` : viewLabel(image, index, total);
  const fit = fitFor(image, ratio);
  const cap = tileCap(image, ratio);
  const limits =
    cap === undefined ? undefined : { "--tile-max-w": `${cap}px`, "--tile-max-h": `${(cap / ratio).toFixed(1)}px` };
  return (
    <span
      className={cn("media-tile-wrap", className)}
      style={{ "--tile-r": ratio.toFixed(4), ...limits, ...style } as CSSProperties}
    >
      <button
        type="button"
        className="media-tile group"
        onClick={() => onOpen(index)}
        aria-label={label}
        data-cursor="view"
        data-cursor-label={more ? "All" : "Expand"}
      >
        <span className="media-tile__frame" data-fit={fit} style={{ aspectRatio: ratio.toFixed(4) }}>
          <span className="media-tile__zoom">
            <ProtectedImage image={image} fill fit={fit} priority={priority} />
          </span>
          {more > 0 ? (
            <span className="media-tile__more" aria-hidden="true">
              <span className="font-display">+{more}</span>
              <span className="media-tile__more-label">more</span>
            </span>
          ) : (
            <span className="media-tile__hint" aria-hidden="true">
              <ExpandIcon />
            </span>
          )}
          {caption === "overlay" && image.caption && !more && (
            <span className="media-tile__overlay-caption" aria-hidden="true">
              {image.caption}
            </span>
          )}
        </span>
      </button>
      {caption === "below" && image.caption && <span className="media-caption">{image.caption}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Justified rows — shared by split and mosaic                         */
/* ------------------------------------------------------------------ */

/** Frame shapes a row cell keeps as-is (beyond them the photo is shown whole on a mat). */
const ROW_RATIOS: [number, number] = [0.4, 10];

interface RowCell {
  image: ResolvedImage;
  ratio: number;
  /** Banner-shaped: gets a row of its own. */
  wide: boolean;
  style: CSSProperties;
}

/**
 * Each cell grows in proportion to its photo's shape, so a row of photos
 * shares one height and fills the width (whole photos, no forced crops)
 * — until a photo reaches its own size limit; then the row stops growing
 * and is centred instead of stretching the picture.
 */
function rowCells(images: ResolvedImage[]): RowCell[] {
  return images.map((image) => {
    const ratio = aspectOf(image, 4 / 3, ROW_RATIOS);
    return {
      image,
      ratio,
      wide: ratio >= PANORAMA,
      style: { "--r": ratio.toFixed(4), "--cap": px(tileCap(image, ratio)) } as CSSProperties,
    };
  });
}

/** Forces the next cell onto a new row (around banner-shaped photos). */
const RowBreak = () => <span className="media-rows__break" aria-hidden="true" />;

/* ------------------------------------------------------------------ */
/* hero — one strong image                                             */
/* ------------------------------------------------------------------ */

/** Contained hero photos sit inset 5% on the frame's backdrop. */
const HERO_MAT = 0.05;

/**
 * Depth by layers, not by cropping: the frame drifts a little ahead of
 * the page and its light lags behind it, while the photo inside is always
 * shown whole (many are letters and certificates with text to the edge).
 * Both are still under reduced motion (useParallax).
 */
const HERO_FRAME_TRAVEL = 12;
const HERO_GLOW_TRAVEL = -32;

function HeroLayout({ images, numbering, onOpen }: LayoutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glowY = useParallax(ref, { distance: HERO_GLOW_TRAVEL });
  const [lead, ...rest] = images;
  const extra = rest.slice(0, 4);
  const hidden = rest.length - extra.length;
  const total = numbering.images.length;
  return (
    <div ref={ref} className="media-hero">
      {/* Ambient light: the same photo, blurred far behind the frame — a small copy is plenty for a blur. */}
      <motion.span className="media-hero__ambient" aria-hidden="true" style={{ y: glowY }}>
        <img src={mediaUrl(getImageCopy(lead.src, 320))} alt="" loading="lazy" decoding="async" draggable={false} />
      </motion.span>
      <Reveal variant="mask">
        <HeroFrame image={lead} index={numbering.of(lead)} total={total} onOpen={onOpen} />
      </Reveal>
      {lead.caption && <p className="media-caption">{lead.caption}</p>}
      {extra.length > 0 && (
        <div className="media-hero__rest">
          {extra.map((img, i) => (
            <Reveal key={img.src} variant="rise" delay={0.06 * i}>
              <Tile
                image={img}
                index={numbering.of(img)}
                total={total}
                onOpen={onOpen}
                ratio={4 / 3}
                more={hidden > 0 && i === extra.length - 1 ? hidden : 0}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

/** The one strong image: its own shape and never larger than its pixels allow. */
function HeroFrame({
  image,
  index,
  total,
  onOpen,
}: {
  image: ResolvedImage;
  index: number;
  total: number;
  onOpen: OpenFn;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const y = useParallax(ref, { distance: HERO_FRAME_TRAVEL });
  // The photo's own shape (banners included), so nothing important is cropped away.
  const ratio = aspectOf(image, 16 / 10, [0.6, 3.2]);
  const fit = fitFor(image, ratio);
  const cap = frameMaxWidth(image, ratio, fit, { mat: fit === "contain" ? HERO_MAT : 0 });
  return (
    <motion.button
      ref={ref}
      type="button"
      className="media-tile media-hero__frame group"
      data-fit={fit}
      style={{
        y,
        aspectRatio: ratio.toFixed(4),
        width: `min(100%, calc(82svh * ${ratio.toFixed(4)})${cap === undefined ? "" : `, ${cap}px`})`,
      }}
      onClick={() => onOpen(index)}
      aria-label={viewLabel(image, index, total)}
      data-cursor="view"
      data-cursor-label="Expand"
    >
      <span className="media-tile__zoom">
        <ProtectedImage image={image} fill fit={fit} sizes="100vw" />
      </span>
      <span className="media-tile__hint" aria-hidden="true">
        <ExpandIcon />
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* split — 2–3 images, staggered                                       */
/* ------------------------------------------------------------------ */

function SplitLayout({ images, numbering, onOpen }: LayoutProps) {
  const cells = rowCells(images.slice(0, 3));
  const hidden = images.length - cells.length;
  const total = numbering.images.length;
  // Side by side, the later photos sit lower — the asymmetry. Banners take rows of their own instead.
  const staggered = !cells.some((c) => c.wide);
  return (
    <div className={cn("media-rows media-split", staggered && "media-split--staggered")}>
      {cells.map(({ image, ratio, wide, style }, i) => {
        const tile = (
          <Tile
            image={image}
            index={numbering.of(image)}
            total={total}
            onOpen={onOpen}
            ratio={ratio}
            caption="below"
            more={hidden > 0 && i === cells.length - 1 ? hidden : 0}
          />
        );
        return (
          <Fragment key={image.src}>
            {wide && i > 0 && <RowBreak />}
            <div className="media-rows__cell" style={style}>
              <Reveal variant={i === 0 ? "split-left" : "split-right"} delay={0.08 * i}>
                {i === 0 ? <Tilt max={4}>{tile}</Tilt> : tile}
              </Reveal>
            </div>
            {wide && i < cells.length - 1 && <RowBreak />}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* mosaic — justified rows                                             */
/* ------------------------------------------------------------------ */

const MOSAIC_LIMIT = 12;

function MosaicLayout({ images, numbering, onOpen }: LayoutProps) {
  const cells = rowCells(images.slice(0, MOSAIC_LIMIT));
  const hidden = images.length - cells.length;
  const total = numbering.images.length;
  return (
    <div className="media-rows media-mosaic">
      {cells.map(({ image, ratio, wide, style }, i) => (
        <Fragment key={image.src}>
          {wide && i > 0 && <RowBreak />}
          <div className="media-rows__cell" style={style}>
            <Reveal variant="rise" delay={(i % 4) * 0.05}>
              <Tile
                image={image}
                index={numbering.of(image)}
                total={total}
                onOpen={onOpen}
                ratio={ratio}
                caption="overlay"
                more={hidden > 0 && i === cells.length - 1 ? hidden : 0}
              />
            </Reveal>
          </div>
          {wide && i < cells.length - 1 && <RowBreak />}
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* filmstrip — one horizontal strip                                    */
/* ------------------------------------------------------------------ */

function FilmstripLayout({ images, numbering, onOpen }: LayoutProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const total = numbering.images.length;

  // Progress + edge state written straight to the DOM from one rAF per frame.
  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = track.scrollWidth - track.clientWidth;
      const progress = max > 0 ? track.scrollLeft / max : 1;
      root.style.setProperty("--strip-progress", progress.toFixed(4));
      root.toggleAttribute("data-at-start", track.scrollLeft <= 2);
      root.toggleAttribute("data-at-end", track.scrollLeft >= max - 2);
      root.toggleAttribute("data-scrollable", max > 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    track.addEventListener("scroll", schedule, { passive: true });
    // The track's own size and its content's (lazy photos arriving) both change what can scroll.
    const resize = new ResizeObserver(schedule);
    resize.observe(track);
    for (const item of Array.from(track.children)) resize.observe(item);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", schedule);
      resize.disconnect();
    };
  }, []);

  const scrollByPage = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <Reveal variant="drift">
      <div ref={rootRef} className="media-strip" data-at-start="">
        <div
          ref={trackRef}
          className="media-strip__track"
          tabIndex={0}
          role="group"
          aria-label="Photo strip — scroll sideways"
        >
          {images.map((img) => (
            <Tile
              key={img.src}
              image={img}
              index={numbering.of(img)}
              total={total}
              onOpen={onOpen}
              // The strip's height is shared, so wide photos are simply wider tiles.
              ratio={aspectOf(img, 4 / 3, [0.4, 4.5])}
              caption="overlay"
              className="media-strip__item"
            />
          ))}
        </div>
        <div className="media-strip__controls">
          <div className="media-strip__progress" aria-hidden="true">
            <span className="media-strip__progress-fill" />
          </div>
          <button
            type="button"
            className="media-round-btn media-strip__prev"
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll photos left"
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            className="media-round-btn media-strip__next"
            onClick={() => scrollByPage(1)}
            aria-label="Scroll photos right"
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* stack — layered depth that spreads apart                            */
/* ------------------------------------------------------------------ */

const STACK_MAX = 5;

/** A 4:3 card's width in the pile; other shapes keep about the same area. */
const STACK_CARD = 432;

interface CardPose {
  x: number;
  y: number;
  scale: number;
  rotate?: number;
}

/** Resting pile: each card a little further back, a little offset. */
const REST: CardPose[] = [
  { x: 0, y: 0, scale: 1, rotate: 0 },
  { x: 6, y: -5, scale: 0.95, rotate: -1.6 },
  { x: -5, y: -9, scale: 0.9, rotate: 1.4 },
  { x: 9, y: -12, scale: 0.86, rotate: -0.9 },
  { x: -8, y: -15, scale: 0.82, rotate: 1.1 },
];

/** Spread positions per pile size, in % of the card's own size. Card 0 stays on top. */
const SPREAD: Record<number, CardPose[]> = {
  1: [{ x: 0, y: 0, scale: 1 }],
  // Two cards: far enough apart that the back one shows about three-quarters of itself.
  2: [
    { x: -36, y: -2, scale: 1 },
    { x: 38, y: 4, scale: 0.94 },
  ],
  3: [
    { x: 0, y: -3, scale: 1 },
    { x: -56, y: 6, scale: 0.9 },
    { x: 56, y: 8, scale: 0.9 },
  ],
  4: [
    { x: -28, y: -8, scale: 1 },
    { x: 34, y: -12, scale: 0.92 },
    { x: -46, y: 14, scale: 0.88 },
    { x: 40, y: 16, scale: 0.88 },
  ],
  5: [
    { x: 0, y: -4, scale: 1 },
    { x: -58, y: -10, scale: 0.9 },
    { x: 58, y: -8, scale: 0.9 },
    { x: -40, y: 18, scale: 0.86 },
    { x: 42, y: 20, scale: 0.86 },
  ],
};

/** Phones: the cards run down the column (CSS), each whole, only nudged and tilted like loose prints. */
const COLUMN = (index: number): CardPose =>
  index % 2 === 0 ? { x: -3, y: 0, scale: 1, rotate: -1 } : { x: 3, y: 0, scale: 1, rotate: 1.2 };

/**
 * pile   — mouse/trackpad: a pile that spreads with scroll and on hover/focus.
 * spread — touch screens ≥ 768px: no hover, so the pile is shown spread.
 * column — phones: the cards cascade down the column, each fully visible.
 */
type StackMode = "pile" | "spread" | "column";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function StackLayout({ images, numbering, onOpen }: LayoutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const cards = images.slice(0, STACK_MAX);
  const total = numbering.images.length;
  const [mode, setMode] = useState<StackMode>("pile");

  // Spread = max(scroll position, hover/focus, forced).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  // Scrolling the pile to mid-screen opens it most of the way; hover/focus opens it fully.
  const fromScroll = useTransform(scrollYProgress, [0.45, 1], [0, 0.85]);
  const hover = useMotionValue(0);
  const fromHover = useSpring(hover, { stiffness: 170, damping: 24, mass: 0.6 });
  const forced = useMotionValue(0);
  const spread = useTransform(() => Math.max(fromScroll.get(), fromHover.get(), forced.get()));

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const touch = window.matchMedia("(hover: none)");
    const apply = () => setMode(narrow.matches ? "column" : touch.matches ? "spread" : "pile");
    apply();
    narrow.addEventListener("change", apply);
    touch.addEventListener("change", apply);
    return () => {
      narrow.removeEventListener("change", apply);
      touch.removeEventListener("change", apply);
    };
  }, []);

  const open = reduced || mode !== "pile";
  useEffect(() => {
    forced.set(open ? 1 : 0);
  }, [open, forced]);

  return (
    <div className="media-stack-wrap">
      <Reveal variant="scale">
        <div
          ref={ref}
          className="media-stack"
          data-spread={open ? "" : undefined}
          onPointerEnter={(e) => e.pointerType === "mouse" && hover.set(1)}
          onPointerLeave={() => hover.set(0)}
          onFocus={() => hover.set(1)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hover.set(0);
          }}
        >
          {cards.map((img, i) => (
            <StackCard
              key={img.src}
              image={img}
              index={numbering.of(img)}
              total={total}
              depth={i}
              count={cards.length}
              target={mode === "column" ? COLUMN(i) : SPREAD[cards.length][i]}
              spread={spread}
              onOpen={onOpen}
            />
          ))}
        </div>
      </Reveal>
      <p className="media-stack__hint">
        <span className="media-stack__hint-fine">Hover to spread the pile · click a photo to open it</span>
        <span className="media-stack__hint-touch">Tap a photo to open it</span>
        {images.length > cards.length && (
          <button type="button" className="media-text-btn" onClick={() => onOpen(numbering.of(images[0]))}>
            View all {total} photos
          </button>
        )}
      </p>
    </div>
  );
}

function StackCard({
  image,
  index,
  total,
  depth,
  count,
  target,
  spread,
  onOpen,
}: {
  image: ResolvedImage;
  /** Position in the viewer's sequence. */
  index: number;
  total: number;
  /** Position in the pile (0 = on top). */
  depth: number;
  count: number;
  target: CardPose;
  spread: MotionValue<number>;
  onOpen: OpenFn;
}) {
  const rest = REST[depth];
  const x = useTransform(() => `${lerp(rest.x, target.x, spread.get())}%`);
  const y = useTransform(() => `${lerp(rest.y, target.y, spread.get())}%`);
  const scale = useTransform(() => lerp(rest.scale, target.scale, spread.get()));
  const rotate = useTransform(() => lerp(rest.rotate ?? 0, target.rotate ?? 0, spread.get()));
  // Each card keeps its photo's shape; sizes balance by area and never exceed the photo's own size.
  const ratio = aspectOf(image, 4 / 3, [0.45, 2.6]);
  const fit = fitFor(image, ratio);
  const cap = tileCap(image, ratio);
  const nominal = Math.round(STACK_CARD * Math.sqrt(ratio / (4 / 3)));
  const sizing = {
    "--card-w": `${cap === undefined ? nominal : Math.min(nominal, cap)}px`,
    "--card-cap": px(cap),
  } as CSSProperties;
  return (
    <motion.button
      type="button"
      className="media-stack__card media-tile group"
      style={{ ...sizing, x, y, scale, rotate, zIndex: count - depth }}
      onClick={() => onOpen(index)}
      aria-label={viewLabel(image, index, total)}
      data-cursor="view"
      data-cursor-label="Expand"
    >
      <span className="media-tile__frame" data-fit={fit} style={{ aspectRatio: ratio.toFixed(4) }}>
        <span className="media-tile__zoom">
          <ProtectedImage image={image} fill fit={fit} />
        </span>
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* stage — photos + video                                              */
/* ------------------------------------------------------------------ */

const STAGE_PHOTOS = 6;

/** One caption shared by every clip is shown once, not under each player. */
function sharedCaption(videos: ResolvedVideo[]): string | undefined {
  if (videos.length < 2) return undefined;
  const first = videos[0].caption;
  return first && videos.every((v) => v.caption === first) ? first : undefined;
}

function StageLayout({
  images,
  numbering,
  onOpen,
  videos,
  title,
  labels,
}: LayoutProps & {
  videos: ResolvedVideo[];
  title: string;
  labels: boolean;
}) {
  const [active, setActive] = useState(0);
  const video = videos[active];
  const shared = sharedCaption(videos);
  const photos = images.slice(0, STAGE_PHOTOS);
  const hidden = images.length - photos.length;
  const total = numbering.images.length;
  // Portrait clips get a narrow screen column so the side panel can use the rest.
  const videoRatio = aspectOf(video, 16 / 9, [0.4, 2.4]);
  const portrait = videoRatio < 1;

  return (
    <div
      className="media-stage__stage"
      data-orientation={portrait ? "portrait" : "landscape"}
      style={{ "--vr": videoRatio.toFixed(4) } as CSSProperties}
    >
      <Reveal variant="fade" className="media-stage__screen">
        <div role="group" aria-label={`Footage — ${title}`}>
          <VideoPlayer
            key={video.src}
            src={video.src}
            poster={video.poster}
            width={video.width}
            height={video.height}
            maxHeight="74svh"
            title={videos.length > 1 ? `${title} — clip ${active + 1} of ${videos.length}` : title}
            caption={shared ? undefined : video.caption}
          />
        </div>
      </Reveal>

      <Reveal variant="split-right" delay={0.08} className="media-stage__side">
        {labels && <GroupLabel kind="Footage" count={videos.length} />}
        {shared && <p className="media-note">{shared}</p>}
        {videos.length > 1 && (
          <ol className="media-playlist" aria-label="Clips">
            {videos.map((v, i) => (
              <li key={v.src}>
                <button
                  type="button"
                  className="media-playlist__item"
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => setActive(i)}
                >
                  <span className="media-playlist__num font-display">{pad2(i + 1)}</span>
                  <span className="media-playlist__text">
                    <span className="media-playlist__title">Clip {pad2(i + 1)}</span>
                    {!shared && v.caption && <span className="media-playlist__caption">{v.caption}</span>}
                  </span>
                  <span className="media-playlist__state" aria-hidden="true">
                    {i === active ? "Showing" : "Show"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {photos.length > 0 && (
          <div role="group" aria-label={`Photographs — ${title}`} className="media-stage__photos">
            {labels && <GroupLabel kind="Photographs" count={images.length} />}
            <div className={cn("media-stage__rail", photos.length === 1 && "media-stage__rail--single")}>
              {photos.map((img, i) => (
                <Tile
                  key={img.src}
                  image={img}
                  index={numbering.of(img)}
                  total={total}
                  onOpen={onOpen}
                  ratio={photos.length === 1 ? aspectOf(img, 4 / 3, [0.8, 1.8]) : 1}
                  more={hidden > 0 && i === photos.length - 1 ? hidden : 0}
                />
              ))}
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Footage — videos alongside a photo layout                           */
/* ------------------------------------------------------------------ */

function FootageGroup({ videos, title, labels }: { videos: ResolvedVideo[]; title: string; labels: boolean }) {
  const shared = sharedCaption(videos);
  const portrait = videos.every((v) => v.width && v.height && v.height > v.width);
  const many = videos.length > 1;
  return (
    <div role="group" aria-label={`Footage — ${title}`} className="media-stage__group">
      {labels && <GroupLabel kind="Footage" count={videos.length} />}
      {shared && <p className="media-note">{shared}</p>}
      <div
        className={cn(
          "media-footage",
          many && (portrait ? "media-footage--portrait" : "media-footage--grid")
        )}
      >
        {videos.map((v, i) => (
          <Reveal key={v.src} variant="rise" delay={0.06 * i}>
            <VideoPlayer
              src={v.src}
              poster={v.poster}
              width={v.width}
              height={v.height}
              maxHeight={many ? "66svh" : "78svh"}
              title={many ? `${title} — clip ${i + 1} of ${videos.length}` : title}
              caption={shared ? undefined : v.caption}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
