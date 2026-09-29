import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import {
  Parallax,
  Reveal,
  TextReveal,
  Tilt,
  TiltLayer,
  useDepthEnabled,
  useSectionProgress,
} from "@/animations";
import { MediaCover, ProtectedImage } from "@/components/media";
import { ExpandIcon } from "@/components/media/icons";
import { aspectOf, mediaUrl } from "@/components/media/protection";
import { ArrowLink, Kicker } from "@/components/ui";
import { ProjectArt } from "@/components/work";
import { detailCopy, type WorkEntry, type WorkItem } from "@/lib/content";
import { workTransitionName } from "@/routing/transitions";
import type { ResolvedImage } from "@/types/content";
import { DetailBack } from "./DetailBack";
import { DETAIL_UI, dateOf, distinctRecognition, pad2, type DetailMediaPlan } from "./model";
import { RecognitionMark } from "./RecognitionMark";
import type { ReturnTrail } from "./returnTrail";

type ScrollOffsets = Exclude<Parameters<typeof useSectionProgress>[1], string | undefined>;

/** From the hero's top reaching the top of the screen to its bottom leaving it. */
const HERO_EXIT: ScrollOffsets = ["start start", "end start"];
/**
 * Frame proportions follow the photo, clamped so panoramas and tall scans
 * still sit well (beyond the clamp the photo is shown whole on the plate).
 */
const PHOTO_RATIO: [number, number] = [0.66, 2.1];
/**
 * The cover is never drawn past this multiple of its own pixels (most are
 * small phone shots and certificate scans). The frame is sized from the
 * same limit, so the photo fills it instead of floating small on a large
 * plate.
 */
const HERO_MAX_SCALE = 1.2;
/** A frame never shrinks below this, however small the photo (it then sits on the plate). */
const HERO_MIN_W = "22rem";

export interface DetailHeroProps {
  work: WorkItem;
  entry: WorkEntry;
  plan: DetailMediaPlan;
  trail: ReturnTrail;
  /** Open the photo viewer on the cover photo. */
  onOpenCover: () => void;
}

/**
 * The record's opening. Depth in four planes (REQUIREMENTS §135): the
 * blurred light of the cover stays still behind everything, the photo
 * drifts slowly inside its frame, the text column moves at its own rate,
 * and the frame tips back in 3D as the hero scrolls away (and follows the
 * pointer on desktop). The frame carries `view-transition-name:
 * work-<id>`, so the card clicked on the Work index morphs into it — it
 * is never hidden by an entrance animation for that reason.
 *
 * At rest the photo is shown whole — many covers are certificates and
 * letters whose text runs to the edges — and only starts to drift (a slow
 * push-in) once the hero is scrolling away.
 */
export function DetailHero({ work, entry, plan, trail, onOpenCover }: DetailHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const depth = useDepthEnabled();
  const progress = useSectionProgress(heroRef, HERO_EXIT);
  const rotateX = useTransform(progress, [0, 1], [0, 10]);
  const scale = useTransform(progress, [0, 1], [1, 0.9]);
  const y = useTransform(progress, [0, 1], [0, 90]);
  // The photo inside the frame: 1 → 1.1 leaves 5% to spare on each side, and it travels 3% of that.
  const photoScale = useTransform(progress, [0, 1], [1, 1.1]);
  const photoY = useTransform(progress, [0, 1], ["0%", "3%"]);

  const { item } = work;
  const cover = plan.media.cover;
  const date = dateOf(item);
  // An award whose result is its own title ("Best Boarder Award") needs no seal repeating it.
  const recognition = work.kind === "event" ? distinctRecognition(work.item) : undefined;
  const org = work.kind === "event" ? work.item.organization : undefined;
  const ghost = item.year !== undefined ? String(item.year) : entry.typeLabel;
  const titleSize = item.title.length > 52 ? "long" : item.title.length > 30 ? "medium" : "short";
  const visual = cover ? "photo" : work.kind === "project" ? "art" : "plate";
  const primaryLink = item.links?.[0];
  const frameVars = cover
    ? photoFrameVars(cover)
    : { "--dt-frame-w": visual === "art" ? "min(100%, 38rem)" : "min(100%, 24rem)" };

  const facts: { term: string; value: string }[] = [];
  if (date) facts.push({ term: DETAIL_UI.when, value: date });
  if (org) facts.push({ term: DETAIL_UI.with, value: org });
  if (entry.statusLabel) facts.push({ term: DETAIL_UI.status, value: entry.statusLabel });

  const mediaCount = plan.hasVideos ? plan.stage.videos.length : plan.stage.images.length;
  const jumpLabel = plan.hasVideos ? detailCopy.media.videos : detailCopy.media.photos;

  return (
    <header
      ref={heroRef}
      className="dt-hero"
      data-visual={visual}
      data-title={titleSize}
      data-seal={recognition ? "" : undefined}
      aria-labelledby="detail-title"
      style={frameVars as CSSProperties}
    >
      {cover && <Ambient image={cover} />}
      <Parallax speed={-0.08} className="dt-hero__ghost" aria-hidden="true">
        <span className="font-display" data-numeric={item.year !== undefined ? "" : undefined}>
          {ghost}
        </span>
      </Parallax>

      <div className="dt-shell dt-hero__grid">
        <div className="dt-hero__bar">
          <Reveal variant="fade">
            <DetailBack trail={trail} />
          </Reveal>
        </div>

        <Parallax speed={0.12} className="dt-hero__text">
          <Reveal variant="fade">
            <Kicker className="dt-hero__kicker">
              {entry.typeLabel}
              <span className="dt-hero__kicker-sep" aria-hidden="true">
                ·
              </span>
              {entry.categoryLabel}
            </Kicker>
          </Reveal>
          <TextReveal as="h1" id="detail-title" text={item.title} className="dt-hero__title font-display" />
          <Reveal delay={0.14}>
            <p className="dt-hero__summary">{item.summary}</p>
          </Reveal>
          {facts.length > 0 && (
            <Reveal delay={0.2}>
              <dl className="dt-facts">
                {facts.map((fact) => (
                  <div key={fact.term} className="dt-facts__item">
                    <dt>{fact.term}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
          {(primaryLink || plan.showStage) && (
            <Reveal delay={0.26} className="dt-hero__actions">
              {primaryLink && (
                <ArrowLink href={primaryLink.url} variant="solid">
                  {primaryLink.label}
                </ArrowLink>
              )}
              {plan.showStage && (
                <ArrowLink href="#media" variant="pill" direction="down" cursorLabel={jumpLabel}>
                  {jumpLabel}
                  <span className="dt-hero__count">{pad2(mediaCount)}</span>
                </ArrowLink>
              )}
            </Reveal>
          )}
        </Parallax>

        <motion.div
          className="dt-hero__visual"
          style={depth ? { rotateX, scale, y, transformPerspective: 1200 } : undefined}
        >
          <Tilt max={4} glare={visual === "photo"} className="dt-hero__tilt">
            <Frame
              work={work}
              entry={entry}
              image={cover}
              coverIndex={plan.coverIndex}
              onOpen={onOpenCover}
              drift={depth ? { scale: photoScale, y: photoY } : undefined}
            />
            {recognition && (
              <TiltLayer depth={34} className="dt-hero__seal">
                <RecognitionMark
                  recognition={recognition}
                  variant="seal"
                  label={detailCopy.event.recognition}
                  year={recognition.year ?? item.year}
                />
              </TiltLayer>
            )}
          </Tilt>
        </motion.div>
      </div>
    </header>
  );
}

/**
 * Sizing for a photo frame, as CSS variables on the hero:
 *   --dt-frame-w      beside the text (desktop): never wider than the column,
 *                     the photo's sharpness limit, or ~68% of the screen height
 *   --dt-frame-ratio  the frame's proportions (the photo's own, clamped)
 *   --dt-frame-cap    the sharpness limit (HERO_MAX_SCALE × the photo's width),
 *                     so a stacked frame that spans the column caps its height
 *                     at the photo's drawn height instead (styles/detail.css)
 */
function photoFrameVars(image: ResolvedImage): Record<string, string> {
  const ratio = aspectOf(image, 4 / 3, PHOTO_RATIO).toFixed(4);
  const cap = image.width ? `max(${HERO_MIN_W}, ${Math.round(image.width * HERO_MAX_SCALE)}px)` : "40rem";
  return {
    "--dt-frame-w": `min(100%, ${cap}, calc(68svh * ${ratio}))`,
    "--dt-frame-ratio": ratio,
    "--dt-frame-cap": cap,
  };
}

/** The cover's own light, blurred far behind the hero. Still — the background plane. */
function Ambient({ image }: { image: ResolvedImage }) {
  return (
    <div className="dt-hero__ambient" aria-hidden="true">
      <img src={mediaUrl(image.src)} alt="" decoding="async" draggable={false} />
    </div>
  );
}

interface FrameProps {
  work: WorkItem;
  entry: WorkEntry;
  image?: ResolvedImage;
  coverIndex: number;
  onOpen: () => void;
  /** Scroll-linked push-in of the photo inside the frame (omitted when depth is off). */
  drift?: { scale: MotionValue<number>; y: MotionValue<string> };
}

/** The shared-element target: photo, generated project art, or a typographic plate. */
function Frame({ work, entry, image, coverIndex, onOpen, drift }: FrameProps) {
  const vtName = workTransitionName(work.item.id);

  if (!image) {
    const plate: ReactNode =
      work.kind === "project" ? (
        <ProjectArt
          category={work.item.category}
          title={work.item.title}
          variant="stage"
          label={[entry.categoryLabel, entry.statusLabel].filter(Boolean).join(" · ")}
        />
      ) : (
        <MediaCover title={work.item.title} label={entry.categoryLabel} interactive={false} />
      );
    return (
      <div
        className={work.kind === "project" ? "dt-frame dt-frame--art" : "dt-frame dt-frame--plate"}
        style={{ viewTransitionName: vtName }}
      >
        {plate}
      </div>
    );
  }

  // The whole photo, always: the frame takes the photo's own proportions and
  // size limit, so "contain" fills it edge to edge; where the frame is wider
  // (a stacked hero spanning the column, or a panorama past the clamp) the
  // photo sits centred on the frame's plate, lit by its own colours — never
  // cropped, never enlarged past HERO_MAX_SCALE.
  const frameStyle = { viewTransitionName: vtName };
  const inner = (
    <>
      <span className="dt-frame__glow" aria-hidden="true">
        <img src={mediaUrl(image.src)} alt="" decoding="async" draggable={false} />
      </span>
      <motion.span className="dt-frame__depth" style={drift}>
        <ProtectedImage
          image={image}
          fill
          fit="contain"
          priority
          maxScale={HERO_MAX_SCALE}
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="dt-frame__photo"
        />
      </motion.span>
      <span className="dt-frame__edge" aria-hidden="true" />
    </>
  );

  if (coverIndex < 0) {
    return (
      <div className="dt-frame dt-frame--photo" style={frameStyle}>
        {inner}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="dt-frame dt-frame--photo dt-frame--button"
      style={frameStyle}
      onClick={onOpen}
      aria-label={`${image.alt || work.item.title} — ${DETAIL_UI.viewLarger}`}
      data-cursor="view"
      data-cursor-label={DETAIL_UI.expand}
    >
      {inner}
      <span className="dt-frame__hint" aria-hidden="true">
        <ExpandIcon />
      </span>
    </button>
  );
}
