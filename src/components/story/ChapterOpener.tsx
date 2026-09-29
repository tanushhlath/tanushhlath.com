import { useRef, type CSSProperties } from "react";
import { motion, useTransform } from "framer-motion";
import { Parallax, Reveal, TextReveal, useDepthEnabled, useSectionProgress, type ScrollRange } from "@/animations";
import { Kicker } from "@/components/ui";
import Link from "@/routing/Link";
import { storyCopy } from "@/lib/content";
import { paths } from "@/routing/paths";
import type { StoryChapterView } from "./storyModel";

/**
 * 0 as the opener's top enters the screen → 1 once its bottom edge is
 * clear of the reveal line. Measured to the card's BOTTOM on purpose: the
 * card only reaches full size when all of it is on screen, and by then
 * every line inside has crossed the site's standard reveal line
 * (`motionSettings.revealOffset`, 10% up from the bottom) — so however
 * tall the screen or the card, an open card is never an empty one.
 */
const OPEN_RANGE: Exclude<Parameters<typeof useSectionProgress>[1], ScrollRange | undefined> = [
  "start end",
  "end 0.8",
];

/** Kicker rule colour for each chapter tone. */
const KICKER_TONE = { 1: "ember", 2: "azure", 3: "lavender", 4: "azure", 5: "ember", 6: "lavender" } as const;

/**
 * A chapter's title card, which opens out of a small date marker (§13).
 *
 * Scrolling down, the chapter's first year sits on the timeline as a
 * pill; as the card rises into view the pill's clip grows into the full
 * panel and the chapter number, name and contents surface inside it
 * (kicker, then the title's words, the years and the contents — staggered
 * by delay on the standard reveal line, never by a higher one, so nothing
 * is still waiting once the card has opened). The opening is
 * scroll-linked (a CSS variable, --open 0…1, driven by a MotionValue), so
 * scrolling back up folds it back into the marker and scrolling down
 * again re-opens it — no state, no re-render.
 *
 * In the prerendered HTML, under reduced motion, and before hydration the
 * card is simply open (--open defaults to 1 in story.css).
 */
export function ChapterOpener({ view, observeIndex }: { view: StoryChapterView; observeIndex: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const depth = useDepthEnabled();
  const progress = useSectionProgress(ref, OPEN_RANGE);
  // Ease the opening so the marker holds briefly, then unfolds decisively.
  const open = useTransform(progress, [0, 0.18, 0.85, 1], [0, 0, 0.94, 1], { clamp: true });
  const { chapter, label, tone, startYear, moments } = view;
  const titleId = `${chapter.id}-title`;

  return (
    <motion.div
      ref={ref}
      className="story-opener"
      data-story-index={observeIndex}
      style={depth ? ({ "--open": open } as unknown as CSSProperties) : undefined}
    >
      <span className="story-opener__panel" aria-hidden="true" />
      <span className="story-opener__marker" aria-hidden="true">
        <span className="story-opener__marker-dot" />
        {startYear}
      </span>

      <div className="story-opener__content">
        <Parallax speed={0.14} className="story-opener__number-wrap" aria-hidden="true">
          <span className="story-opener__number font-display">{label}</span>
        </Parallax>

        <div className="story-opener__text">
          <Reveal variant="fade">
            <Kicker tone={KICKER_TONE[tone as keyof typeof KICKER_TONE] ?? "azure"}>
              {storyCopy.chapterLabel} <span className="story-opener__kicker-num">{label}</span>
            </Kicker>
          </Reveal>
          <TextReveal
            as="h2"
            id={titleId}
            text={chapter.era}
            delay={0.05}
            className="story-opener__title font-display"
          />
          <Reveal variant="fade" delay={0.15} className="story-opener__years">
            {chapter.yearLabel}
          </Reveal>
        </div>

        <Reveal as="ol" variant="rise" delay={0.2} className="story-opener__toc">
          {moments.map(({ moment }) => (
            <li key={moment.id}>
              <Link href={paths.story(moment.id)} className="story-opener__toc-link">
                <span className="story-opener__toc-year">{moment.dateLabel ?? moment.year}</span>
                <span className="story-opener__toc-title">{moment.title}</span>
              </Link>
            </li>
          ))}
        </Reveal>
      </div>
    </motion.div>
  );
}
