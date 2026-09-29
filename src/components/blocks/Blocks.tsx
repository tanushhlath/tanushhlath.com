import { useState, type ReactNode } from "react";
import type { Block, MediaLayout, MediaManifest, ResolvedImage, ResolvedMedia } from "@/types/content";
import manifestJson from "@/content/generated/media-manifest.json";
import { MaskReveal, Reveal, Stagger, StaggerItem } from "@/animations";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { isExternalHref, normalizeHref } from "@/routing/paths";
import { Lightbox } from "@/components/media/Lightbox";
import { MediaStage } from "@/components/media/MediaStage";
import { ProtectedImage } from "@/components/media/ProtectedImage";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { ExpandIcon } from "@/components/media/icons";
import { aspectOf, fitFor, upscaleCap } from "@/components/media/protection";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * CONTENT BLOCKS — renders the `body` / `sections` arrays from the content
 * files (see the `Block` type in src/types/content.ts):
 *
 *   heading   { text, kicker? }                       masked section heading
 *   text      { text, lead? }                          paragraphs (blank line = new paragraph)
 *   quote     { text, cite? }                          large pull quote
 *   image     { src, alt, caption? }                   photo, opens the viewer
 *   gallery   { images: [{ src, alt, caption? }] }     layout picked by count
 *   video     { src, caption?, poster? }               the site's video player
 *   cards     { cards: [{ title, text, href? }] }      small grid of cards
 *   timeline  { items: [{ label, title, text? }] }     vertical sequence
 *   stat      { stats: [{ value, label }] }            big figures
 *   callout   { title?, text, tone? }                  highlighted note (accent | warm | quiet)
 *   link      { label, href, description? }            prominent onward link
 *   embed     { url, title, aspect? }                  sandboxed, lazy iframe (https only)
 *
 *   <Blocks blocks={project.body} title={project.title} />
 *
 * Every block reveals reversibly as it scrolls in. Media paths are site
 * paths ("/media/events/<id>/5.png"); their dimensions come from the
 * media manifest, so nothing shifts while loading.
 */

export interface BlocksProps {
  blocks: readonly Block[] | undefined;
  /** The record/page title — names galleries, the photo viewer and videos. */
  title?: string;
  /** Prefix for heading anchors: `${idPrefix}-${slug}`. Omit for no ids. */
  idPrefix?: string;
  className?: string;
}

export function Blocks({ blocks, title, idPrefix, className }: BlocksProps) {
  if (!blocks || blocks.length === 0) return null;
  const headingIds = idPrefix ? headingAnchors(blocks, idPrefix) : [];
  return (
    <div className={cn("blocks", className)}>
      {blocks.map((block, i) => (
        <BlockView key={`${block.type}-${i}`} block={block} title={title} anchor={headingIds[i]} />
      ))}
    </div>
  );
}

function BlockView({ block, title, anchor }: { block: Block; title?: string; anchor?: string }) {
  switch (block.type) {
    case "heading":
      return (
        <SectionHeader
          id={anchor}
          kicker={block.kicker}
          title={block.text}
          className="block block--heading block--measure"
        />
      );

    case "text":
      return (
        <Reveal className={cn("block block--text block--measure", block.lead && "block--lead")}>
          {paragraphs(block.text).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Reveal>
      );

    case "quote":
      return (
        <Reveal as="figure" variant="mask" className="block block--quote block--measure">
          <span className="block-quote__mark font-display" aria-hidden="true">
            “
          </span>
          <blockquote className="block-quote__text font-display">
            <p>{block.text}</p>
          </blockquote>
          {block.cite && <figcaption className="block-quote__cite">— {block.cite}</figcaption>}
        </Reveal>
      );

    case "image":
      return <ImageBlock image={{ ...sizeOf(block.src), src: block.src, alt: block.alt, caption: block.caption }} />;

    case "gallery":
      return <GalleryBlock images={block.images} title={title} />;

    case "video": {
      const size = sizeOf(block.src);
      return (
        <Reveal variant="fade" className="block block--video">
          <VideoPlayer
            src={block.src}
            poster={block.poster}
            caption={block.caption}
            title={block.caption ?? title ?? "Video"}
            width={size.width}
            height={size.height}
          />
        </Reveal>
      );
    }

    case "cards":
      return (
        <Stagger as="ul" className="block block--cards" gap={0.07}>
          {block.cards.map((card, i) => (
            <StaggerItem as="li" key={`${card.title}-${i}`} className="block-card-item">
              <CardBody card={card} />
            </StaggerItem>
          ))}
        </Stagger>
      );

    case "timeline":
      return (
        <Stagger as="ol" className="block block--timeline" gap={0.08}>
          {block.items.map((item, i) => (
            <StaggerItem as="li" key={`${item.label}-${i}`} className="block-timeline__item">
              <span className="block-timeline__label">{item.label}</span>
              <span className="block-timeline__dot" aria-hidden="true" />
              <div className="block-timeline__body">
                <p className="block-timeline__title font-display">{item.title}</p>
                {item.text && <p className="block-timeline__text">{item.text}</p>}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      );

    case "stat":
      return (
        <Stagger as="dl" className="block block--stats" variant="scale" gap={0.08}>
          {block.stats.map((stat, i) => (
            <StaggerItem key={`${stat.label}-${i}`} className="block-stat">
              <dt className="block-stat__label">{stat.label}</dt>
              <dd className="block-stat__value font-display">{stat.value}</dd>
            </StaggerItem>
          ))}
        </Stagger>
      );

    case "callout":
      return (
        <Reveal
          variant="split-left"
          role="note"
          className={cn("block block--callout block--measure", `block-callout--${block.tone ?? "accent"}`)}
        >
          {block.title && <p className="block-callout__title">{block.title}</p>}
          <p className="block-callout__text">{block.text}</p>
        </Reveal>
      );

    case "link":
      return (
        <Reveal className="block block--link block--measure">
          <LinkRow href={block.href} className="block-link">
            <span className="block-link__body">
              <span className="block-link__label font-display">{block.label}</span>
              {block.description && <span className="block-link__description">{block.description}</span>}
            </span>
          </LinkRow>
        </Reveal>
      );

    case "embed":
      return <EmbedBlock url={block.url} title={block.title} aspect={block.aspect} />;

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Media blocks                                                        */
/* ------------------------------------------------------------------ */

function ImageBlock({ image }: { image: ResolvedImage }) {
  const [open, setOpen] = useState<number | null>(null);
  const name = image.alt || "Photo";
  const ratio = aspectOf(image, 16 / 10, [0.6, 2.4]);
  const fit = fitFor(image, ratio);
  return (
    <figure className="block block--image" style={{ maxWidth: upscaleCap(image, "min(100%, 28rem)") }}>
      <MaskReveal className="block-image__mask">
        <button
          type="button"
          className="media-tile block-image__button group"
          onClick={() => setOpen(0)}
          aria-label={`${name} — view larger`}
          data-cursor="view"
          data-cursor-label="Expand"
        >
          <span className="media-tile__frame" data-fit={fit} style={{ aspectRatio: ratio.toFixed(4) }}>
            <span className="media-tile__zoom">
              <ProtectedImage image={image} fill fit={fit} sizes="(min-width: 1024px) 60rem, 100vw" />
            </span>
            <span className="media-tile__hint" aria-hidden="true">
              <ExpandIcon />
            </span>
          </span>
        </button>
      </MaskReveal>
      {image.caption && <figcaption className="media-caption">{image.caption}</figcaption>}
      <Lightbox
        images={[image]}
        index={open}
        onClose={() => setOpen(null)}
        onIndexChange={setOpen}
        title={image.caption ?? name}
      />
    </figure>
  );
}

function GalleryBlock({ images, title }: { images: { src: string; alt: string; caption?: string }[]; title?: string }) {
  if (images.length === 0) return null;
  const resolved: ResolvedImage[] = images.map((img) => ({ ...sizeOf(img.src), ...img }));
  const media: ResolvedMedia = {
    images: resolved,
    videos: [],
    cover: resolved[0],
    layout: galleryLayout(resolved.length),
  };
  return (
    <div className="block block--gallery">
      <MediaStage media={media} title={title ?? "Gallery"} />
    </div>
  );
}

/** One photo leads; a few sit asymmetrically; more form justified rows; lots run as a strip. */
function galleryLayout(count: number): Exclude<MediaLayout, "auto"> {
  if (count <= 1) return "hero";
  if (count <= 3) return "split";
  if (count <= 9) return "mosaic";
  return "filmstrip";
}

function EmbedBlock({ url, title, aspect }: { url: string; title: string; aspect?: string }) {
  const host = httpsHost(url);
  // Only https embeds are framed; anything else becomes a plain link.
  if (!host) {
    return (
      <Reveal className="block block--link block--measure">
        <LinkRow href={url} className="block-link">
          <span className="block-link__body">
            <span className="block-link__label font-display">{title}</span>
          </span>
        </LinkRow>
      </Reveal>
    );
  }
  return (
    <Reveal as="figure" variant="fade" className="block block--embed">
      <div className="block-embed__frame" style={{ aspectRatio: cssAspect(aspect) }}>
        <iframe
          src={url}
          title={title}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <figcaption className="block-embed__caption">
        <span>{title}</span>
        <ExternalLink href={url} className="block-embed__source">
          Open on {host}
        </ExternalLink>
      </figcaption>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

/** A block-level link: internal through the site's Link (→), external in a new tab (↗). */
function LinkRow({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isExternalHref(href)) {
    return (
      <ExternalLink href={href} className={cn(className, "is-external")} arrow={false}>
        {children}
        <span className="block-link__arrow" aria-hidden="true">
          ↗
        </span>
      </ExternalLink>
    );
  }
  return (
    <Link href={normalizeHref(href)} className={className} data-cursor="view" data-cursor-label="Open">
      {children}
      <span className="block-link__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function CardBody({ card }: { card: { title: string; text: string; href?: string } }) {
  const inner = (
    <>
      <span className="block-card__title font-display">{card.title}</span>
      <span className="block-card__text">{card.text}</span>
    </>
  );
  if (!card.href) return <div className="block-card">{inner}</div>;
  return (
    <LinkRow href={card.href} className="block-card block-card--link">
      {inner}
    </LinkRow>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const manifest = manifestJson as unknown as MediaManifest;

/** Intrinsic size of a /media/<collection>/<id>/<file> path, from the generated manifest. */
function sizeOf(src: string): { width?: number; height?: number } {
  const match = /^\/media\/(events|projects)\/([^/]+)\/([^/?#]+)$/.exec(src);
  if (!match) return {};
  const [, collection, id, file] = match;
  const entry = manifest[collection as keyof MediaManifest]?.[id]?.find((f) => f.file === decodeURIComponent(file));
  return entry ? { width: entry.width, height: entry.height } : {};
}

/** Blank lines separate paragraphs; single line breaks are folded into spaces. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** "16/9", "16:9", "4 / 3" → "16 / 9"; anything else → 16 / 9. */
function cssAspect(aspect?: string): string {
  const match = aspect?.match(/^\s*(\d+(?:\.\d+)?)\s*[/:]\s*(\d+(?:\.\d+)?)\s*$/);
  return match ? `${match[1]} / ${match[2]}` : "16 / 9";
}

/** Hostname of an https URL ("youtube.com"), or undefined for anything else. */
function httpsHost(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.hostname.replace(/^www\./, "") : undefined;
  } catch {
    return undefined;
  }
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

/** Stable, unique anchor ids for heading blocks (index-aligned; undefined for other blocks). */
function headingAnchors(blocks: readonly Block[], prefix: string): (string | undefined)[] {
  const seen = new Map<string, number>();
  return blocks.map((block) => {
    if (block.type !== "heading") return undefined;
    const base = `${prefix}-${slugify(block.text)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}
