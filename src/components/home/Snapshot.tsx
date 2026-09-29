import { Fragment, useMemo, useRef } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { Reveal, motionSettings, useHydrated, useReducedMotionSafe, useSectionProgress } from "@/animations";
import { home, site } from "@/lib/content";
import type { ScrollOffsets } from "./homeUtils";
import { KickerHeading } from "./parts";

/**
 * WHO I AM — the first section, rising over the receding hero.
 *
 * The short bio is read into light: each word brightens as the paragraph
 * scrolls up the screen, so the text "develops" at reading pace (scroll-
 * linked, so it dims again word by word going back up). Under a quiet
 * line: where I live and where I go to school, in one honest sentence.
 */

/** 0 when the paragraph's top reaches 88% down the screen → 1 when its bottom reaches 58%. */
const READ_RANGE: ScrollOffsets = ["start 0.88", "end 0.58"];
/** Opacity of words not yet read. */
const DIM = 0.16;

export function Snapshot() {
  const copy = home.snapshot;
  return (
    <section id={copy.id} className="home-section home-snapshot" aria-labelledby="home-snapshot-title">
      <div className="home-container home-snapshot__grid">
        <KickerHeading id="home-snapshot-title" className="home-snapshot__label">
          {copy.kicker}
        </KickerHeading>
        <div className="home-snapshot__body">
          <ReadingText text={site.bioShort} className="home-snapshot__bio" />
          <Reveal variant="rise" distance={16} delay={0.1} className="home-snapshot__place">
            <span className="home-snapshot__pin" aria-hidden="true" />
            <p>{site.location.long}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ReadingText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const progress = useSectionProgress(ref, READ_RANGE);
  const hydrated = useHydrated();
  const reduced = useReducedMotionSafe();
  // Prerender + hydration + reduced motion: the whole paragraph at full strength.
  const live = hydrated && !reduced && motionSettings.revealsEnabled;
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <Word word={word} index={i} total={words.length} progress={progress} live={live} />
        </Fragment>
      ))}
    </p>
  );
}

function Word({
  word,
  index,
  total,
  progress,
  live,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  live: boolean;
}) {
  // Words light up in order across the first 85% of the range, each over a short window.
  const start = (index / total) * 0.85;
  const opacity = useTransform(progress, [start, start + 0.15], [DIM, 1]);
  return <motion.span style={live ? { opacity } : undefined}>{word}</motion.span>;
}
