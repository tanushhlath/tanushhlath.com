import { Fragment, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSectionProgress, useViewportPhase, type ScrollRange } from "@/animations";
import { useAtmosphere } from "@/components/atmosphere/Atmosphere";
import { ChapterOpener } from "./ChapterOpener";
import { StoryMoment, type MomentFocus } from "./StoryMoment";
import { StoryQuote } from "./StoryQuote";
import { StoryRail, type StoryDirection } from "./StoryRail";
import type { StoryModel } from "./storyModel";

/** The line that fills with scroll: starts as the story's top reaches mid-screen, full at its end. */
const PROGRESS_RANGE: Exclude<Parameters<typeof useSectionProgress>[1], ScrollRange | undefined> = [
  "start 0.45",
  "end 0.55",
];

/**
 * The "reading line": a thin band a little above the middle of the screen.
 * Whatever timeline piece crosses it is the part being read.
 */
const READING_BAND = "-42% 0px -52% 0px";

interface ActiveState {
  index: number;
  dir: StoryDirection;
}

function focusOf(i: number, active: number): MomentFocus {
  if (i === active) return "active";
  if (i < active) return "past";
  return i === active + 1 ? "next" : "future";
}

/**
 * The narrative timeline: a sticky year marker beside a spine that fills
 * with scroll, chapters that open out of date markers, moments, and the
 * quotes between them.
 *
 * Scroll state, without re-rendering per scroll event:
 *  - which moment is being read comes from ONE IntersectionObserver on a
 *    reading band; React state changes only when that moment changes
 *    (moments, chapter openers and quotes all report the moment they
 *    belong to), and it records the direction so the year marker rolls
 *    the right way;
 *  - the spine and the rail's progress are scroll-linked MotionValues;
 *  - the active chapter tints the page (story.css, data-tone) and hands
 *    its year to the site atmosphere (`useAtmosphere`), which fades a giant
 *    numeral in behind everything — only while the timeline is on screen.
 * All of it follows the scroll both ways and replays on the way back down.
 */
export function StoryTimeline({ model }: { model: StoryModel }) {
  const { chapters, moments } = model;
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveState>({ index: 0, dir: 1 });
  // "Inside" once the timeline's top has crossed the middle of the screen.
  const phase = useViewportPhase(rootRef, { amount: 0.5 });
  const progress = useSectionProgress(flowRef, PROGRESS_RANGE);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const inBand = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = Number((entry.target as HTMLElement).dataset.storyIndex);
          if (!Number.isFinite(i)) continue;
          if (entry.isIntersecting) inBand.set(entry.target, i);
          else inBand.delete(entry.target);
        }
        if (inBand.size === 0) return; // between pieces: keep the last one
        const next = Math.max(...inBand.values());
        setActive((prev) => (prev.index === next ? prev : { index: next, dir: next > prev.index ? 1 : -1 }));
      },
      { rootMargin: READING_BAND, threshold: 0 }
    );
    root.querySelectorAll("[data-story-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const current = moments[Math.min(active.index, moments.length - 1)];
  const activeChapter = chapters.find((c) => c.chapter.id === current?.chapterId) ?? chapters[0];
  const onScreen = phase === "inside";

  // Chapter sub-mood (e.g. "story-chapter-first-steps"). No year in the
  // value on purpose: the year already rolls in the rail and heads each
  // moment, so the atmosphere's giant background numeral stays off.
  useAtmosphere(onScreen && current ? `story-${current.chapterId}` : null);

  if (!current || !activeChapter) return null;

  return (
    <div
      ref={rootRef}
      id="story-timeline"
      className="story-timeline"
      data-tone={activeChapter.tone}
      data-live={onScreen || undefined}
    >
      <div className="story-wash" aria-hidden="true" />

      <div className="story-timeline__inner">
        <StoryRail
          chapters={chapters}
          activeChapter={activeChapter}
          year={current.moment.year}
          dir={active.dir}
          progress={progress}
        />

        <div ref={flowRef} className="story-flow">
          <span className="story-spine" aria-hidden="true">
            <motion.span className="story-spine__fill" style={{ scaleY: progress }} />
          </span>

          {chapters.map((view) => (
            <section
              key={view.chapter.id}
              id={view.chapter.id}
              className="story-chapter"
              data-tone={view.tone}
              data-state={
                view.chapter.id === activeChapter.chapter.id
                  ? "active"
                  : view.chapter.number < activeChapter.chapter.number
                    ? "past"
                    : "future"
              }
              aria-labelledby={`${view.chapter.id}-title`}
            >
              <ChapterOpener view={view} observeIndex={view.moments[0]?.index ?? 0} />
              <div className="story-chapter__moments">
                {view.moments.map((m) => (
                  <Fragment key={m.moment.id}>
                    <StoryMoment view={m} focus={focusOf(m.index, active.index)} />
                    {m.moment.quote && <StoryQuote view={m} />}
                  </Fragment>
                ))}
              </div>
            </section>
          ))}

          <span className="story-flow__end" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
