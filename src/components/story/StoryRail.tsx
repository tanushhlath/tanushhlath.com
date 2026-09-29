import { AnimatePresence, motion, type MotionValue, type Variants } from "framer-motion";
import { DUR, EASE, useReducedMotionSafe } from "@/animations";
import Link from "@/routing/Link";
import { storyCopy } from "@/lib/content";
import { paths } from "@/routing/paths";
import { cn } from "@/lib/cn";
import type { StoryChapterView } from "./storyModel";

/** +1 = the story moved forward (scrolling down), -1 = back. */
export type StoryDirection = 1 | -1;

const roll: Variants = {
  enter: (dir: StoryDirection) => ({ y: dir > 0 ? "105%" : "-105%", opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (dir: StoryDirection) => ({ y: dir > 0 ? "-105%" : "105%", opacity: 0 }),
};

/**
 * A number that rolls like an odometer: only the digits that change move,
 * upward when the story moves forward and downward when it moves back.
 * Characters are stacked in one grid cell, so no layout animation is needed.
 */
function Odometer({ value, dir, className }: { value: string; dir: StoryDirection; className?: string }) {
  const reduced = useReducedMotionSafe();
  const transition = { duration: reduced ? 0 : DUR.base, ease: EASE.standard };
  return (
    <span className={cn("story-odo", className)} aria-hidden="true">
      {value.split("").map((char, i) => (
        <span className="story-odo__cell" key={i}>
          <AnimatePresence initial={false} custom={dir}>
            <motion.span
              key={char}
              className="story-odo__char"
              custom={dir}
              variants={roll}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {char}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/** A line of text that swaps with a short directional crossfade. */
function Swap({ value, dir, className }: { value: string; dir: StoryDirection; className?: string }) {
  const reduced = useReducedMotionSafe();
  return (
    <span className={cn("story-swap", className)}>
      <AnimatePresence initial={false} custom={dir}>
        <motion.span
          key={value}
          className="story-swap__item"
          custom={dir}
          variants={roll}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.standard }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface StoryRailProps {
  chapters: StoryChapterView[];
  activeChapter: StoryChapterView;
  year: number;
  dir: StoryDirection;
  /** Scroll progress through the whole timeline, 0…1. */
  progress: MotionValue<number>;
}

/**
 * The moving year marker.
 *
 * Wide screens: a sticky column beside the timeline — chapter N / total,
 * the active year rolling like an odometer, the chapter's name, and a
 * chapter index whose progress line fills as you scroll.
 *
 * Phones: the same state as a compact sticky pill under the top bar
 * (year · chapter) with a thin progress bar along its bottom edge, set on
 * a full-width band that carries the top bar's surface down to it.
 *
 * The rail only re-renders when the active moment changes; the progress
 * line is scroll-linked (a MotionValue), so it reverses on its own.
 */
export function StoryRail({ chapters, activeChapter, year, dir, progress }: StoryRailProps) {
  const total = chapters.length;
  const chapterLine = `${storyCopy.chapterLabel} ${activeChapter.label}`;

  return (
    <aside className="story-rail" data-tone={activeChapter.tone}>
      {/* Phones: the compact pill, on a band that continues the top bar's
          surface and fades out below it, so text scrolls away under one
          soft edge instead of peeking out around the capsule. */}
      <span className="story-rail__band" aria-hidden="true" />
      <div className="story-pill" aria-hidden="true">
        <Odometer value={String(year)} dir={dir} className="story-pill__year" />
        <span className="story-pill__sep" />
        <span className="story-pill__chapter">
          <span className="story-pill__num">{activeChapter.label}</span>
          <Swap value={activeChapter.chapter.era} dir={dir} className="story-pill__era" />
        </span>
        <motion.span className="story-pill__progress" style={{ scaleX: progress }} />
      </div>

      {/* Wider screens: the sticky marker + chapter index. */}
      <div className="story-rail__sticky">
        <div className="story-rail__marker" aria-hidden="true">
          <p className="story-rail__count">
            <Swap value={chapterLine} dir={dir} />
            <span className="story-rail__total">/ {String(total).padStart(2, "0")}</span>
          </p>
          <Odometer value={String(year)} dir={dir} className="story-rail__year font-display" />
          <Swap value={activeChapter.chapter.era} dir={dir} className="story-rail__era font-display" />
        </div>

        <nav className="story-rail__nav" aria-label={`${chapterLine} / ${String(total).padStart(2, "0")}`}>
          <span className="story-rail__track" aria-hidden="true">
            <motion.span className="story-rail__fill" style={{ scaleY: progress }} />
          </span>
          <ol className="story-rail__list">
            {chapters.map(({ chapter, label }) => {
              const current = chapter.id === activeChapter.chapter.id;
              return (
                <li key={chapter.id}>
                  <Link
                    href={paths.story(chapter.id)}
                    className="story-rail__link"
                    aria-current={current ? "step" : undefined}
                    data-cursor="view"
                    data-cursor-label={chapter.yearLabel}
                  >
                    <span className="story-rail__link-num">{label}</span>
                    <span className="story-rail__link-era">{chapter.era}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </aside>
  );
}
