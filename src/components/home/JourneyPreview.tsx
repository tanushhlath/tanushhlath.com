import { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import { Reveal, Stagger, StaggerItem, useDepthEnabled, useSectionProgress } from "@/animations";
import { MediaCover, ProtectedImage } from "@/components/media";
import Link from "@/routing/Link";
import { getStoryChapters, getStoryImage, getTurningPoints, home, type StoryChapter } from "@/lib/content";
import { paths } from "@/routing/paths";
import type { ResolvedImage, StoryMoment } from "@/types/content";
import { pad, type ScrollOffsets } from "./homeUtils";
import { HomeLink, SectionIntro } from "./parts";

/**
 * STORY TEASER — "A short version of a longer story".
 *
 * Source order (and the phone/tablet order): kicker + heading → the
 * featured turning point → the chapter strip and the Story link, so the
 * section introduces itself before its photo like every other one.
 * Wide screens (home.css): the turning point on the left, the heading and
 * the chapters stacked on the right.
 *
 * The turning point is a date marker that opens into its photo: the year
 * sits in a small pill; as the section scrolls up, the photo expands out
 * of that pill to fill the frame (scroll-linked clip-path, so it folds back
 * into the year going up), then the moment's quote. The chapters are a
 * compact strip — number, era, years — with a progress line drawing down
 * beside it; chapters that hold a turning point carry a marker. Each
 * chapter opens the Story page at its first moment.
 */

/** 0 as the frame's top enters → 1 when its centre is 55% down the screen. */
const EXPAND_RANGE: ScrollOffsets = ["start 0.95", "center 0.55"];
/** Progress line: from the list entering to its end passing 60%. */
const LINE_RANGE: ScrollOffsets = ["start 0.85", "end 0.6"];

export function JourneyPreview() {
  const copy = home.journey;
  const chapters = getStoryChapters();
  const turningPoints = getTurningPoints();
  const featured = turningPoints.find((moment) => getStoryImage(moment)) ?? turningPoints[0];
  const image = featured ? getStoryImage(featured) : undefined;
  const turningIds = new Set(turningPoints.map((moment) => moment.id));

  return (
    <section id={copy.id ?? "story"} className="home-section home-story" aria-labelledby="home-story-title">
      <div className="home-container home-story__grid">
        <SectionIntro
          kicker={copy.kicker}
          heading={copy.heading ?? copy.kicker}
          headingId="home-story-title"
          size="lg"
          className="home-header--stacked home-story__head"
        />

        {featured && (
          <figure className="home-story__feature">
            <ExpandingMoment moment={featured} image={image} />
            <Reveal as="figcaption" variant="rise" distance={20} delay={0.1} className="home-story__caption">
              {featured.quote && <blockquote className="home-story__quote">“{featured.quote}”</blockquote>}
              <Link
                href={paths.story(featured.id)}
                className="home-story__moment"
                data-cursor="read"
                data-cursor-label="Read"
              >
                <span className="home-story__moment-year">{featured.dateLabel ?? featured.year}</span>
                <span className="home-story__moment-title">{featured.title}</span>
                <span className="home-story__moment-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </Reveal>
          </figure>
        )}

        <div className="home-story__body">
          <ChapterStrip chapters={chapters} turningIds={turningIds} />
          {copy.cta && (
            <Reveal variant="fade" delay={0.1} className="home-story__cta">
              <HomeLink href={copy.cta.href} variant="pill" cursor="read" cursorLabel="Read">
                {copy.cta.label}
              </HomeLink>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function ExpandingMoment({ moment, image }: { moment: StoryMoment; image?: ResolvedImage }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(ref, EXPAND_RANGE);
  const live = useDepthEnabled();

  // A pill in the middle of the frame (the date marker) → the whole frame.
  const inset = useTransform(progress, [0, 0.85], [1, 0], { clamp: true });
  const clipPath = useTransform(inset, (t) => {
    const y = (41 * t).toFixed(2);
    const x = (34 * t).toFixed(2);
    const r = Math.round(20 + 980 * t);
    return `inset(${y}% ${x}% ${y}% ${x}% round ${r}px)`;
  });
  const photoScale = useTransform(progress, [0, 1], [1.14, 1]);
  const markerOpacity = useTransform(progress, [0.3, 0.62], [1, 0]);
  const markerScale = useTransform(progress, [0.3, 0.62], [1, 1.6]);
  const year = moment.dateLabel ?? String(moment.year);

  return (
    <div ref={ref} className="home-story__frame">
      <motion.div className="home-story__clip" style={live ? { clipPath } : undefined}>
        <motion.div className="home-story__photo" style={live ? { scale: photoScale } : undefined}>
          {image ? (
            <ProtectedImage image={image} fill fit="cover" sizes="(min-width: 1024px) 34rem, 92vw" />
          ) : (
            <MediaCover title={moment.title} label={moment.era} interactive={false} />
          )}
        </motion.div>
        <span className="home-story__veil" aria-hidden="true" />
      </motion.div>
      {live && (
        <motion.span
          className="home-story__marker"
          style={{ opacity: markerOpacity, scale: markerScale }}
          aria-hidden="true"
        >
          {year}
        </motion.span>
      )}
    </div>
  );
}

function ChapterStrip({ chapters, turningIds }: { chapters: StoryChapter[]; turningIds: Set<string> }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(ref, LINE_RANGE);
  const live = useDepthEnabled();

  return (
    <div ref={ref} className="home-story__chapters">
      <span className="home-story__rail" aria-hidden="true">
        <motion.span className="home-story__rail-fill" style={live ? { scaleY: progress } : undefined} />
      </span>
      <Stagger as="ol" variant="rise" distance={18} gap={0.06} className="home-story__list">
        {chapters.map((chapter) => {
          const first = chapter.moments[0];
          const turning = chapter.moments.some((moment) => turningIds.has(moment.id));
          return (
            <StaggerItem as="li" key={chapter.id} className="home-story__chapter" data-turning={turning || undefined}>
              <Link
                href={paths.story(first.id)}
                className="home-story__chapter-link"
                data-cursor="read"
                data-cursor-label="Read"
              >
                <span className="home-story__chapter-num" aria-hidden="true">
                  {pad(chapter.number)}
                </span>
                <span className="home-story__chapter-era">{chapter.era}</span>{" "}
                <span className="home-story__chapter-years">{chapter.yearLabel}</span>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
