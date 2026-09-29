import { Fragment, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { DUR, EASE, Reveal, useHydrated, useReducedMotionSafe } from "@/animations";
import { useAtmosphere } from "@/components/atmosphere/useAtmosphere";
import { ArrowLink, FilterBar, SegmentedTabs, tabPanelProps } from "@/components/ui";
import { getAllWork, getDidEvents, getProjects, getRecognitions, pages, workCopy, workLenses } from "@/lib/content";
import Link from "@/routing/Link";
import { WORK_LENSES, paths, type WorkLens } from "@/routing/paths";
import { AllLens } from "./AllLens";
import { BuiltLens } from "./BuiltLens";
import { DidLens } from "./DidLens";
import { WORK_UI, countLabel, pad2 } from "./helpers";
import { LensDock } from "./LensDock";
import { getLensFilters, lensOrder, useWorkState, type WorkState } from "./lensState";
import { RecognizedLens } from "./RecognizedLens";
import { WorkHero } from "./WorkHero";

const LENS_COUNTS: Record<WorkLens, () => number> = {
  built: () => getProjects().length,
  did: () => getDidEvents().length,
  recognized: () => getRecognitions().length,
  all: () => getAllWork().length,
};

/** Per-panel transition context: which way we moved, and whether to animate at all. */
interface Motion {
  dir: number;
  instant: boolean;
  reduced: boolean;
}

/** Lens content: exits against the direction of travel, enters from it. */
const PANEL: Variants = {
  enter: ({ dir, instant, reduced }: Motion) =>
    instant ? { opacity: 1, x: 0 } : { opacity: 0, x: reduced ? 0 : dir * 64 },
  center: ({ instant, reduced }: Motion) => ({
    opacity: 1,
    x: 0,
    transition: instant ? { duration: 0 } : { duration: reduced ? DUR.fast : DUR.slow, ease: EASE.enter },
  }),
  exit: ({ dir, instant, reduced }: Motion) =>
    instant
      ? { opacity: 0, transition: { duration: 0 } }
      : { opacity: 0, x: reduced ? 0 : dir * -40, transition: { duration: DUR.fast, ease: EASE.exit } },
};

/** The giant outlined lens word behind the lens head slides the same way. */
const GHOST: Variants = {
  enter: ({ dir, instant, reduced }: Motion) =>
    instant ? { opacity: 1, x: "0%" } : { opacity: 0, x: reduced ? "0%" : `${dir * 18}%` },
  center: ({ instant, reduced }: Motion) => ({
    opacity: 1,
    x: "0%",
    transition: instant ? { duration: 0 } : { duration: reduced ? DUR.fast : DUR.cinematic, ease: EASE.cinematic },
  }),
  exit: ({ dir, instant, reduced }: Motion) =>
    instant
      ? { opacity: 0, transition: { duration: 0 } }
      : { opacity: 0, x: reduced ? "0%" : `${dir * -14}%`, transition: { duration: DUR.base, ease: EASE.exit } },
};

/**
 * Intro words are displaced vertically: the old line lifts out of its
 * masks as the new one rises in. With reduced motion the lines only
 * crossfade. The markup never changes shape: every state resolves from the
 * transition context, so a line that arrives before switching is live
 * (the URL fragment applied right after hydration) renders at rest instead
 * of waiting in its masks for an entrance that never runs.
 */
const LINE: Variants = {
  enter: ({ instant, reduced }: Motion) => ({ opacity: reduced && !instant ? 0 : 1 }),
  center: ({ instant, reduced }: Motion) => ({
    opacity: 1,
    transition: { duration: reduced && !instant ? DUR.fast : 0 },
  }),
  exit: ({ instant, reduced }: Motion) => ({
    opacity: reduced && !instant ? 0 : 1,
    transition: { duration: instant ? 0 : DUR.micro },
  }),
};

interface WordMotion extends Motion {
  i: number;
}

const WORD: Variants = {
  enter: ({ instant, reduced }: WordMotion) => ({ y: instant || reduced ? "0%" : "108%" }),
  center: ({ i, instant, reduced }: WordMotion) => ({
    y: "0%",
    transition: instant || reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE.enter, delay: 0.14 + i * 0.022 },
  }),
  exit: ({ i, instant, reduced }: WordMotion) =>
    instant || reduced
      ? { y: "0%", transition: { duration: 0 } }
      : { y: "-108%", transition: { duration: DUR.fast, ease: EASE.exit, delay: i * 0.01 } },
};

function DisplacedLine({ text, motionState }: { text: string; motionState: Motion }) {
  return (
    <span className="wk-displace">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          className="wk-displace__line"
          custom={motionState}
          variants={LINE}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {text.split(/\s+/).map((word, i) => (
            <Fragment key={`${word}-${i}`}>
              {i > 0 && " "}
              <span className="wk-displace__mask">
                <motion.span className="wk-displace__word" custom={{ ...motionState, i }} variants={WORD}>
                  {word}
                </motion.span>
              </span>
            </Fragment>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * Becomes true one frame after hydration. Until then, lens changes are
 * applied instantly: that's the URL fragment arriving after the static
 * (Built) HTML hydrates, which should look like a page load, not a switch.
 */
function useSwitchReady(): boolean {
  const hydrated = useHydrated();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [hydrated]);
  return ready;
}

/**
 * The end of a lens: the way into the next one (All wraps back to Built),
 * with its hint and how much is in it — so the page closes by leading
 * somewhere instead of just stopping.
 */
function NextLens({ lens, onGo }: { lens: WorkLens; onGo: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const next = WORK_LENSES[(lensOrder(lens) + 1) % WORK_LENSES.length];
  const copy = workLenses[next];
  return (
    <Link
      href={paths.work(next)}
      className="wk-next"
      data-lens={next}
      data-cursor="view"
      data-cursor-label={copy.label}
      onClick={onGo}
    >
      <span className="wk-next__kicker">{WORK_UI.nextLens}</span>
      <span className="wk-next__index" aria-hidden="true">
        {pad2(lensOrder(next) + 1)}
      </span>
      <span className="wk-next__label">{copy.label}</span>
      <span className="wk-next__hint">
        {copy.hint}
        <span aria-hidden="true"> · </span>
        <span className="wk-next__count">{countLabel(LENS_COUNTS[next]())}</span>
      </span>
      <span className="wk-next__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function LensBody({ state }: { state: WorkState }) {
  switch (state.lens) {
    case "built":
      return <BuiltLens state={state} />;
    case "did":
      return <DidLens state={state} />;
    case "recognized":
      return <RecognizedLens state={state} />;
    case "all":
      return <AllLens state={state} />;
  }
}

/**
 * /work/ — Built, Did, Recognized and All: four lenses on one body of
 * work, each composed differently. The lens and its filter live in the
 * URL fragment (#did/leadership); switching is a designed transition —
 * the heading's verb moves, the lens word and intro are displaced, and
 * the content crossfades with movement in the direction you travelled.
 */
export function WorkIndex() {
  const [state, setState] = useWorkState();
  const { lens, filter } = state;
  const reduced = useReducedMotionSafe();
  const ready = useSwitchReady();
  useAtmosphere(`work-${lens}`);

  // Direction of travel between lenses (adjusted during render when the lens changes).
  const [travel, setTravel] = useState({ lens, dir: 1 });
  if (travel.lens !== lens) setTravel({ lens, dir: lensOrder(lens) >= lensOrder(travel.lens) ? 1 : -1 });
  const motionState: Motion = { dir: travel.dir, instant: !ready, reduced };

  const tabsRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const panelTopRef = useRef<HTMLDivElement>(null);

  const selectLens = (next: string) => {
    const value = WORK_LENSES.find((l) => l === next);
    if (value && value !== lens) setState({ lens: value });
  };

  const selectFromDock = (next: WorkLens) => {
    if (next !== lens) setState({ lens: next });
    const top = panelTopRef.current;
    if (top) top.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const selectFilter = (value: string) => {
    setState({ lens, filter: value === "all" ? undefined : value });
  };

  // The next-lens door is a real /work/#<lens> link (Link turns it into a
  // state change); bring the lens head back into view as the lens switches.
  const goToNextLens = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    panelTopRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const filters = getLensFilters(lens);
  const total = LENS_COUNTS[lens]();
  const copy = workLenses[lens];

  const tabs: ReactNode = (
    <div ref={tabsRef} className="wk-tabs">
      <SegmentedTabs
        key={ready ? "live" : "boot"}
        label={pages.work.title}
        idPrefix="work"
        variant="editorial"
        active={lens}
        onChange={selectLens}
        options={WORK_LENSES.map((value, i) => ({
          value,
          label: workLenses[value].label,
          hint: workLenses[value].hint,
          count: LENS_COUNTS[value](),
          index: pad2(i + 1),
        }))}
      />
    </div>
  );

  return (
    <div className="work-page" data-lens={lens}>
      <WorkHero lens={lens} lenses={tabs} />

      <div id="work-lenses" ref={panelTopRef} className="wk-lenses">
        {/* Everything in the panel follows the #lens/filter fragment: hidden
            on a deep-link load until the fragment is applied (see App.tsx). */}
        <section {...tabPanelProps("work", lens)} className="wk-panel" data-hash-panel="">
          <div className="wk-shell wk-lenshead">
            <div className="wk-lenshead__ghost" aria-hidden="true">
              <AnimatePresence initial={false} mode="popLayout" custom={motionState}>
                <motion.span
                  key={lens}
                  className="wk-lenshead__ghost-word"
                  custom={motionState}
                  variants={GHOST}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {copy.label}
                </motion.span>
              </AnimatePresence>
            </div>
            <h2 className="sr-only">{copy.label}</h2>
            <p className="wk-lenshead__intro">
              <DisplacedLine text={copy.intro} motionState={motionState} />
            </p>
            {filters.length > 0 && (
              <FilterBar
                key={lens}
                className="wk-filters"
                label={`${WORK_UI.filter}: ${copy.label}`}
                layout="scroll"
                options={[{ value: "all", label: workCopy.allFilter, count: total }, ...filters]}
                active={filter ?? "all"}
                onChange={selectFilter}
              />
            )}
          </div>

          <div className="wk-shell wk-stage">
            <AnimatePresence mode="wait" initial={false} custom={motionState}>
              <motion.div
                key={lens}
                className="wk-stage__lens"
                data-lens={lens}
                custom={motionState}
                variants={PANEL}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={filter ?? "all"}
                    initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: reduced ? DUR.fast : DUR.base, ease: EASE.enter } }}
                    exit={{ opacity: 0, y: reduced ? 0 : -10, transition: { duration: DUR.micro, ease: EASE.exit } }}
                  >
                    <LensBody state={state} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      <footer ref={endRef} className="wk-shell wk-coda" id="work-archive">
        <Reveal variant="clip" className="wk-coda__rule" aria-hidden="true" />
        <Reveal variant="rise" className="wk-coda__next" data-hash-panel="">
          <NextLens lens={lens} onGo={goToNextLens} />
        </Reveal>
        <Reveal delay={0.08} className="wk-coda__links">
          <ArrowLink href={workCopy.archiveLink.href} variant="pill" cursorLabel={pages.archive.title}>
            {workCopy.archiveLink.label}
          </ArrowLink>
          <ArrowLink href={paths.explore()} cursorLabel={pages.explore.title}>
            {pages.explore.heading ?? pages.explore.title}
          </ArrowLink>
        </Reveal>
      </footer>

      <LensDock lens={lens} onSelect={selectFromDock} watchRef={tabsRef} endRef={endRef} />
    </div>
  );
}
