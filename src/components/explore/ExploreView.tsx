import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE, useHydrated, useReducedMotionSafe } from "@/animations";
import { useAtmosphere } from "@/components/atmosphere/useAtmosphere";
import { Magnetic, PageHero } from "@/components/ui";
import { exploreCopy, getSurprisePool, pages, type ExploreLensKey } from "@/lib/content";
import { useHashState } from "@/routing/useHashState";
import { ExploreResults } from "./ExploreResults";
import { LensDeck } from "./LensDeck";
import { parseLens, serializeLens, surpriseKey } from "./exploreModel";
import { SurprisePanel, type SurpriseDraw } from "./SurprisePanel";

/** Finds not to repeat for a while (the pool has ~70, so repeats stay rare). */
const RECENT_LIMIT = 10;

/**
 * Becomes true one frame after hydration. Until then a lens arriving from
 * the URL (/explore/#proud) applies instantly, like a page load.
 */
function useSettled(): boolean {
  const hydrated = useHydrated();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [hydrated]);
  return settled;
}

/**
 * The lens the results show. Once the page has settled it follows the
 * lens one step behind: choosing a door commits the deck on its own, so
 * the door starts to open on the very next frame, and the results (dozens
 * of cards to render, lay out and measure) assemble in a transition right
 * after instead of holding that first frame back. Until then — a deep
 * link applying on load — both change together, instantly.
 */
function useResultsLens(lens: ExploreLensKey | null, settled: boolean): ExploreLensKey | null {
  const [shown, setShown] = useState(lens);
  if (!settled && shown !== lens) setShown(lens);
  useEffect(() => {
    if (!settled || shown === lens) return;
    startTransition(() => setShown(lens));
  }, [settled, lens, shown]);
  return settled ? shown : lens;
}

/**
 * EXPLORE — "A different way in". Pick a lens and the site assembles a
 * path through everything that fits it (lens in the fragment:
 * /explore/#built … #proud). The room's light shifts with the lens
 * (useAtmosphere), the chosen door opens, the results arrive from all
 * sides and rearrange when you switch. Or let the archive surprise you.
 */
export function ExploreView() {
  const [lens, setLens] = useHashState<ExploreLensKey | null>(parseLens, serializeLens, null);
  useAtmosphere(lens ? `explore-${lens}` : null);
  const settled = useSettled();
  const resultsLens = useResultsLens(lens, settled);
  const reduced = useReducedMotionSafe();
  const copy = pages.explore;

  const deckRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const select = useCallback((next: ExploreLensKey) => setLens(next), [setLens]);

  const switchFromFooter = useCallback(
    (next: ExploreLensKey) => {
      setLens(next);
      requestAnimationFrame(() =>
        deckRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
      );
    },
    [setLens, reduced]
  );

  /* ---- Surprise me ------------------------------------------------ */

  const [draws, setDraws] = useState<SurpriseDraw[]>([]);
  const recent = useRef<string[]>([]);
  /** Where to bring the find into view after the next draw ("start" from the footer, "nearest" from the hero). */
  const scrollToPanel = useRef<{ block: ScrollLogicalPosition; afterOpen: boolean } | null>(null);

  const draw = useCallback(() => {
    // Random, but only here in the click handler — never during render.
    const pool = getSurprisePool();
    if (pool.length === 0) return;
    const last = recent.current[recent.current.length - 1];
    const avoid = new Set(recent.current.slice(-RECENT_LIMIT));
    let candidates = pool.filter((entry) => !avoid.has(surpriseKey(entry)));
    if (candidates.length === 0) candidates = pool.filter((entry) => surpriseKey(entry) !== last);
    if (candidates.length === 0) candidates = pool;
    const entry = candidates[Math.floor(Math.random() * candidates.length)];
    recent.current = [...recent.current, surpriseKey(entry)].slice(-RECENT_LIMIT);
    setDraws((previous) => [...previous, { entry, n: (previous[previous.length - 1]?.n ?? 0) + 1 }].slice(-3));
  }, []);

  const surpriseFromHero = useCallback(() => {
    // Make sure the whole find (with its Open / Another buttons) is on screen once the drawer has opened.
    scrollToPanel.current = { block: "nearest", afterOpen: draws.length === 0 };
    draw();
  }, [draw, draws.length]);

  const surpriseFromFooter = useCallback(() => {
    scrollToPanel.current = { block: "start", afterOpen: false };
    draw();
  }, [draw]);

  const closeSurprise = useCallback(() => {
    setDraws([]);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  const latest = draws[draws.length - 1]?.n;
  useEffect(() => {
    const request = scrollToPanel.current;
    if (latest === undefined || !request) return;
    scrollToPanel.current = null;
    // A freshly opened drawer grows from zero height; measure it once it has.
    const delay = request.afterOpen ? (reduced ? DUR.fast : DUR.slow) * 1000 + 60 : 0;
    const id = window.setTimeout(
      () => panelRef.current?.scrollIntoView({ block: request.block, behavior: reduced ? "auto" : "smooth" }),
      delay
    );
    return () => window.clearTimeout(id);
  }, [latest, reduced]);

  return (
    <div className="explore-page" data-lens={lens ?? "none"}>
      <PageHero
        variant="centered"
        className="ex-hero"
        kicker={copy.kicker}
        kickerTone="lavender"
        title={copy.heading ?? copy.title}
        emphasis="different"
        intro={copy.intro}
      >
        <Magnetic>
          <button
            ref={triggerRef}
            type="button"
            className="ex-trigger"
            onClick={surpriseFromHero}
            aria-controls={draws.length > 0 ? "surprise" : undefined}
            aria-expanded={draws.length > 0}
            data-cursor="view"
            data-cursor-label={exploreCopy.surprise.label}
          >
            <span className="ex-spark" aria-hidden="true" />
            {/* Stays "Surprise me": the open panel has its own "Another surprise". */}
            <span>{exploreCopy.surprise.label}</span>
          </button>
        </Magnetic>
      </PageHero>

      <SurprisePanel draws={draws} onAnother={draw} onClose={closeSurprise} reduced={reduced} panelRef={panelRef} />

      {/* The deck and the results follow the lens in the URL: hidden on a
          deep link (/explore/#care) until it has applied — see App.tsx. */}
      <div ref={deckRef} id="explore-lenses" className="ex-shell ex-deck-shell" data-hash-panel="">
        <LensDeck active={lens} onSelect={select} animate={settled} reduced={reduced} />
      </div>

      <AnimatePresence initial={false}>
        {resultsLens && (
          <motion.div
            key="results"
            className="ex-shell ex-results-shell"
            data-hash-panel=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: settled ? DUR.fast : 0 } }}
            exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE.exit } }}
          >
            <ExploreResults
              lensKey={resultsLens}
              animate={settled}
              reduced={reduced}
              onSwitch={switchFromFooter}
              onSurprise={surpriseFromFooter}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
