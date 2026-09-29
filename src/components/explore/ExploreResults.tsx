import { useRef } from "react";
import { AnimatePresence, LayoutGroup, motion, type Transition, type Variants } from "framer-motion";
import { DUR, EASE, Reveal, useSectionProgress } from "@/animations";
import { MediaCover } from "@/components/media";
import Link from "@/routing/Link";
import { exploreCopy, importanceLabels, labStatusLabels, storyCopy, type ExploreLensKey, type WorkEntry } from "@/lib/content";
import { ExploreCard } from "./ExploreCard";
import { EXPLORE_UI, LENS_KEYS, enterFrom, pad2, sectionLabels, shapeLens, thingsLabel, type ShapedLens } from "./exploreModel";

export interface ExploreResultsProps {
  lensKey: ExploreLensKey;
  /** false until just after hydration (a lens from the URL appears instantly). */
  animate: boolean;
  reduced: boolean;
  /** Switch lens from the footer (and bring the deck back into view). */
  onSwitch: (lens: ExploreLensKey) => void;
  onSurprise: () => void;
}

interface CardMotion {
  from: { x: number; y: number; rotate: number };
  i: number;
  reduced: boolean;
  instant: boolean;
}

/**
 * Entries arrive from their own side (see enterFrom) with a slight turn
 * and settle into place — on the first lens pick too, since the lists'
 * AnimatePresence plays its initial entrance unless the lens came from the
 * URL (`instant`); ones that belong to the old lens only step back and
 * fade; ones shared by both lenses glide to their new place.
 */
const CARD: Variants = {
  hidden: ({ from, reduced, instant }: CardMotion) =>
    instant ? { opacity: 1 } : reduced ? { opacity: 0 } : { opacity: 0, x: from.x, y: from.y, rotate: from.rotate, scale: 0.94 },
  shown: ({ i, reduced, instant }: CardMotion) => ({
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: instant
      ? { duration: 0 }
      : { duration: reduced ? DUR.fast : 0.7, ease: EASE.enter, delay: reduced ? 0 : Math.min(i * 0.035, 0.5) },
  }),
  gone: ({ reduced, instant }: CardMotion) =>
    instant
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          scale: reduced ? 1 : 0.92,
          y: reduced ? 0 : 10,
          transition: { duration: DUR.fast, ease: EASE.exit },
        },
};

/** The path line fills as the results pass the middle of the screen. */
const PATH_RANGE: ["start 0.65", "end 0.65"] = ["start 0.65", "end 0.65"];

/**
 * What a lens assembles: its own section first (turning points, lab
 * sketches, what I care about, or the wall of results), then the work
 * on that path as one persistent grid — cards shared between lenses
 * stay put and rearrange; the rest come and go. A thin path line runs
 * down the left and fills as you read.
 */
export function ExploreResults({ lensKey, animate, reduced, onSwitch, onSurprise }: ExploreResultsProps) {
  const lens = shapeLens(lensKey);
  const ref = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(ref, PATH_RANGE);
  const instant = !animate;
  const layout: Transition = instant || reduced ? { duration: 0 } : { duration: DUR.slow, ease: EASE.enter };
  const aux = auxFor(lens);
  const others = LENS_KEYS.filter((key) => key !== lensKey);
  const workLabel = sectionLabels.work;
  const rich = lens.entries.filter((entry) => entry.importance !== "archive");
  const compact = lens.entries.filter((entry) => entry.importance === "archive");

  const renderItem = (entry: WorkEntry, i: number) => {
    const custom: CardMotion = { from: enterFrom(entry.id), i, reduced, instant };
    return (
      <motion.li
        key={entry.id}
        layout
        transition={{ layout }}
        custom={custom}
        variants={CARD}
        initial="hidden"
        animate="shown"
        exit="gone"
        className="ex-grid__item"
        data-size={entry.importance}
      >
        <Reveal variant="rise" distance={24} className="ex-grid__reveal">
          <ExploreCard entry={entry} />
        </Reveal>
      </motion.li>
    );
  };

  return (
    <LayoutGroup id="explore-results">
      <div ref={ref} className="ex-results" data-lens={lensKey}>
        <span className="ex-path" aria-hidden="true">
          <motion.span className="ex-path__fill" style={{ scaleY: reduced ? 1 : progress }} />
        </span>

        <AnimatePresence mode="popLayout" initial={!instant}>
          {aux && (
            <motion.section
              key={`aux-${lensKey}`}
              layout="position"
              transition={{ layout }}
              className="ex-section ex-aux"
              data-aux={aux.type}
              aria-labelledby={`ex-aux-${lensKey}`}
              initial={{ opacity: 0, y: instant || reduced ? 0 : 24 }}
              animate={{ opacity: 1, y: 0, transition: instant ? { duration: 0 } : { duration: DUR.base, ease: EASE.enter, delay: 0.12 } }}
              exit={{ opacity: 0, transition: { duration: instant ? 0 : DUR.micro } }}
            >
              <SectionHead id={`ex-aux-${lensKey}`} index={1} label={aux.label} count={aux.count} />
              {aux.type === "story" && <StoryPath lens={lens} />}
              {aux.type === "lab" && <LabSketches lens={lens} />}
              {aux.type === "interests" && <Interests lens={lens} />}
              {aux.type === "recognitions" && <RecognitionWall lens={lens} />}
            </motion.section>
          )}
        </AnimatePresence>

        <motion.section
          layout="position"
          transition={{ layout }}
          className="ex-section ex-work"
          aria-labelledby="ex-work-label"
          hidden={lens.entries.length === 0}
        >
          <SectionHead id="ex-work-label" index={aux ? 2 : 1} label={workLabel} count={lens.entries.length} />
          {rich.length > 0 && (
            <ul className="ex-grid ex-grid--rich">
              <AnimatePresence mode="popLayout" initial={!instant}>
                {rich.map((entry, i) => renderItem(entry, i))}
              </AnimatePresence>
            </ul>
          )}
          {compact.length > 0 && (
            <>
              <p className="ex-grid__label">{importanceLabels.archive.short ?? importanceLabels.archive.label}</p>
              <ul className="ex-grid ex-grid--compact">
                <AnimatePresence mode="popLayout" initial={!instant}>
                  {compact.map((entry, i) => renderItem(entry, rich.length + i))}
                </AnimatePresence>
              </ul>
            </>
          )}
        </motion.section>

        <motion.footer layout="position" transition={{ layout }} className="ex-onward">
          <Reveal variant="fade" className="ex-onward__inner">
            <p className="ex-onward__prompt">{exploreCopy.lensPrompt}</p>
            <div className="ex-onward__lenses">
              {others.map((key) => {
                const other = shapeLens(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className="ex-chip"
                    data-lens={key}
                    onClick={() => onSwitch(key)}
                    aria-label={other.label}
                    data-cursor="view"
                    data-cursor-label={other.short}
                  >
                    <span className="ex-chip__word font-display">{other.short}</span>
                    <span className="ex-chip__count">{other.total}</span>
                  </button>
                );
              })}
              <button type="button" className="ex-chip ex-chip--surprise" onClick={onSurprise} data-cursor="view" data-cursor-label={exploreCopy.surprise.label}>
                <span className="ex-spark" aria-hidden="true" />
                {exploreCopy.surprise.label}
              </button>
            </div>
          </Reveal>
        </motion.footer>
      </div>
    </LayoutGroup>
  );
}

type AuxType = "story" | "lab" | "interests" | "recognitions";

function auxFor(lens: ShapedLens): { type: AuxType; label: string; count: number } | null {
  if (lens.story.length > 0) return { type: "story", label: sectionLabels.story, count: lens.story.length };
  if (lens.lab.length > 0) return { type: "lab", label: sectionLabels.lab, count: lens.lab.length };
  if (lens.interests.length > 0) return { type: "interests", label: sectionLabels.interests, count: lens.interests.length };
  if (lens.recognitions.length > 0) {
    return { type: "recognitions", label: sectionLabels.recognitions, count: lens.recognitions.length };
  }
  return null;
}

function SectionHead({ id, index, label, count }: { id: string; index: number; label: string; count: number }) {
  return (
    <Reveal variant="split-left" distance={20} className="ex-head">
      <span className="ex-head__node" aria-hidden="true" />
      <span className="ex-head__index" aria-hidden="true">
        {pad2(index)}
      </span>
      <h2 id={id} className="ex-head__label">
        {label}
      </h2>
      <span className="ex-head__count">{thingsLabel(count)}</span>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Lens-specific sections                                              */
/* ------------------------------------------------------------------ */

/** Grown: the turning points, as chapters you can step into. */
function StoryPath({ lens }: { lens: ShapedLens }) {
  return (
    <ol className="ex-story">
      {lens.story.map((moment, i) => (
        <li key={moment.id} className="ex-story__item">
          <Reveal variant={i % 2 === 0 ? "split-left" : "split-right"} className="ex-story__reveal">
            <Link
              href={moment.href}
              className="ex-moment group"
              data-cover-host=""
              data-cursor="view"
              data-cursor-label={EXPLORE_UI.read}
            >
              <span className="ex-moment__year font-display" aria-hidden="true">
                {moment.year}
              </span>
              {moment.image && (
                <span className="ex-moment__image" aria-hidden="true">
                  <MediaCover image={moment.image} title={moment.title} sizes="(min-width: 1024px) 22vw, 90vw" />
                </span>
              )}
              <span className="ex-moment__body">
                <span className="ex-moment__kicker">
                  {storyCopy.turningPoint} · {moment.dateLabel ?? moment.year}
                </span>
                <span className="ex-moment__title font-display">{moment.title}</span>
                <span className="ex-moment__summary">{moment.summary}</span>
                <span className="ex-moment__cta">
                  {sectionLabels.storyPage}
                  <span aria-hidden="true"> →</span>
                </span>
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/** Tried: lab ideas, drawn like sketches — deliberately looser than the cards. */
function LabSketches({ lens }: { lens: ShapedLens }) {
  return (
    <ul className="ex-lab">
      {lens.lab.map((idea, i) => (
        <li key={idea.id} className="ex-lab__item" style={{ ["--tilt" as string]: `${((i % 3) - 1) * 0.6}deg` }}>
          <Reveal variant="rise" delay={Math.min(i * 0.05, 0.3)} className="ex-lab__reveal">
            <Link href={idea.to} className="ex-idea" data-status={idea.status} data-cursor="view" data-cursor-label={EXPLORE_UI.open}>
              <span className="ex-idea__top">
                <span className="ex-idea__status">
                  <span className="ex-idea__dot" aria-hidden="true" />
                  {labStatusLabels[idea.status].label}
                </span>
                <span className="ex-idea__year">{idea.year}</span>
              </span>
              <span className="ex-idea__title font-display">{idea.title}</span>
              <span className="ex-idea__summary">{idea.summary}</span>
              <span className="ex-idea__dest">
                <span className="ex-idea__dest-kind">{idea.dest.kind}</span>
                <span className="ex-idea__dest-title">
                  {/* A no-break space glues the arrow to the last word, so it never wraps onto a line of its own. */}
                  {idea.dest.title && `${idea.dest.title}\u00a0`}
                  <span className="ex-idea__arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

/** Care: what holds my attention, and where it has already led. */
function Interests({ lens }: { lens: ShapedLens }) {
  return (
    <ul className="ex-care">
      {lens.interests.map((interest, i) => (
        <li key={interest.id} className="ex-care__item">
          <Reveal variant="rise" delay={Math.min(i * 0.05, 0.3)} className="ex-care__reveal">
            <Link href={interest.href} className="ex-interest" data-cursor="view" data-cursor-label={EXPLORE_UI.open}>
              <span className="ex-interest__cat">{interest.category}</span>
              <span className="ex-interest__title font-display">{interest.title}</span>
              <span className="ex-interest__note">{interest.note}</span>
              <span className="ex-interest__cta">
                {interest.cta}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

/** Proud: the results themselves, set big — each one opens the event behind it. */
function RecognitionWall({ lens }: { lens: ShapedLens }) {
  return (
    <ol className="ex-wall">
      {lens.recognitions.map((entry, i) => (
        <li key={entry.event.id} className="ex-wall__item" data-level={entry.recognition.level}>
          <Reveal variant="rise" delay={Math.min(i * 0.04, 0.3)} className="ex-wall__reveal">
            <Link href={entry.href} className="ex-win group" data-cursor="view" data-cursor-label={EXPLORE_UI.open}>
              <span className="ex-win__result font-display">{entry.recognition.result}</span>
              <span className="ex-win__event">{entry.event.title}</span>
              <span className="ex-win__meta">
                {entry.categoryLabel}
                {entry.year !== undefined && <> · {entry.year}</>}
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
