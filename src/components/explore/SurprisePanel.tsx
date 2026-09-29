import type { Ref } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { DUR, EASE } from "@/animations";
import { MediaCover } from "@/components/media";
import { ArrowLink } from "@/components/ui";
import type { ArchiveEntry } from "@/lib/content";
import { EXPLORE_UI, surpriseContext, surpriseCopy, surpriseKey } from "./exploreModel";

export interface SurpriseDraw {
  entry: ArchiveEntry;
  /** Increments with every draw, so the same record drawn twice still animates. */
  n: number;
}

export interface SurprisePanelProps {
  draws: SurpriseDraw[];
  onAnother: () => void;
  onClose: () => void;
  reduced: boolean;
  panelRef: Ref<HTMLElement>;
}

/**
 * "Surprise me": a record pulled out of the archive, not a slot machine.
 * The new find rises out of the drawer and its photo develops from the
 * bottom up; the previous finds are set aside onto a small pile behind
 * it. Kind, category and context come first, then the title — and a way
 * to open it, or draw another.
 */
export function SurprisePanel({ draws, onAnother, onClose, reduced, panelRef }: SurprisePanelProps) {
  const current = draws[draws.length - 1];
  const pile = draws.slice(-3, -1).reverse();

  return (
    <AnimatePresence initial={false}>
      {current && (
        <motion.section
          key="surprise"
          ref={panelRef}
          id="surprise"
          className="ex-surprise-wrap"
          aria-label={surpriseCopy.lead}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: "auto",
            opacity: 1,
            transition: { duration: reduced ? DUR.fast : DUR.slow, ease: EASE.enter },
          }}
          exit={{ height: 0, opacity: 0, transition: { duration: reduced ? DUR.micro : DUR.base, ease: EASE.exit } }}
        >
          <div className="ex-shell">
            <div className="ex-surprise">
              <div className="ex-surprise__stage" aria-hidden="true">
                {pile.map((draw, depth) => (
                  <span key={draw.n} className="ex-surprise__pile" data-depth={depth}>
                    <MediaCover image={draw.entry.cover} title={draw.entry.title} interactive={false} sizes="200px" />
                  </span>
                ))}
                <AnimatePresence mode="popLayout" initial={false} custom={reduced}>
                  <motion.span
                    key={current.n}
                    className="ex-surprise__card"
                    custom={reduced}
                    variants={DRAW}
                    initial="enter"
                    animate="in"
                    exit="out"
                  >
                    <motion.span className="ex-surprise__develop" custom={reduced} variants={DEVELOP}>
                      {/* No fallback label: the tab above the card already names the kind. */}
                      <MediaCover
                        image={current.entry.cover}
                        title={current.entry.title}
                        aspect="4/3"
                        sizes="(min-width: 1024px) 30vw, 80vw"
                      />
                    </motion.span>
                    <span className="ex-surprise__tab">{current.entry.kindLabel}</span>
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="ex-surprise__text">
                <div className="ex-surprise__live" aria-live="polite" aria-atomic="true">
                  <AnimatePresence mode="wait" initial={false} custom={reduced}>
                    <motion.div
                      key={`${current.n}:${surpriseKey(current.entry)}`}
                      custom={reduced}
                      variants={TEXT}
                      initial="enter"
                      animate="in"
                      exit="out"
                    >
                      <motion.p className="ex-surprise__lead" custom={reduced} variants={LINE}>
                        <span className="ex-spark" aria-hidden="true" />
                        {surpriseCopy.lead}
                      </motion.p>
                      <motion.p className="ex-surprise__context" custom={reduced} variants={LINE}>
                        {surpriseContext(current.entry).map((part) => (
                          <span key={part}>{part}</span>
                        ))}
                      </motion.p>
                      <motion.h2 className="ex-surprise__title font-display" custom={reduced} variants={LINE}>
                        {current.entry.title}
                      </motion.h2>
                      <motion.p className="ex-surprise__summary" custom={reduced} variants={LINE}>
                        {current.entry.summary}
                      </motion.p>
                      {current.entry.recognition && (
                        <motion.p className="ex-result" custom={reduced} variants={LINE}>
                          <span className="ex-result__ribbon" aria-hidden="true" />
                          {current.entry.recognition.result}
                        </motion.p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="ex-surprise__actions">
                  <ArrowLink href={current.entry.href} variant="solid" cursorLabel={EXPLORE_UI.open}>
                    {surpriseCopy.open}
                  </ArrowLink>
                  <button
                    type="button"
                    className="arrow-link arrow-link--pill ex-surprise__again"
                    onClick={onAnother}
                    data-cursor="view"
                    data-cursor-label={surpriseCopy.again}
                  >
                    <span className="ex-surprise__again-icon" aria-hidden="true">↻</span>
                    <span className="arrow-link__label">{surpriseCopy.again}</span>
                  </button>
                </div>
              </div>

              <button type="button" className="ex-surprise__close" onClick={onClose} aria-label={EXPLORE_UI.close}>
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/** The card: rises out of the drawer standing up; leaves by being set aside onto the pile. */
const DRAW: Variants = {
  enter: (reduced: boolean) =>
    reduced ? { opacity: 0 } : { opacity: 0, y: 56, rotateX: 24, rotate: 0, scale: 0.95, transformPerspective: 900 },
  in: (reduced: boolean) => ({
    opacity: 1,
    y: 0,
    x: 0,
    rotateX: 0,
    rotate: 0,
    scale: 1,
    transformPerspective: 900,
    transition: { duration: reduced ? DUR.fast : 0.85, ease: EASE.cinematic },
  }),
  out: (reduced: boolean) =>
    reduced
      ? { opacity: 0, transition: { duration: DUR.micro } }
      : { opacity: 0, x: -64, y: 18, rotate: -8, scale: 0.86, transition: { duration: 0.45, ease: EASE.exit } },
};

/** The photo develops from the bottom edge up once the card has surfaced. */
const DEVELOP: Variants = {
  enter: (reduced: boolean) => (reduced ? {} : { clipPath: "inset(100% 0% 0% 0%)" }),
  in: (reduced: boolean) =>
    reduced
      ? {}
      : {
          clipPath: "inset(0% 0% 0% 0%)",
          transition: { duration: 0.9, ease: EASE.enter, delay: 0.22 },
          transitionEnd: { clipPath: "none" },
        },
  out: {},
};

const TEXT: Variants = {
  enter: {},
  in: (reduced: boolean) => ({ transition: { staggerChildren: reduced ? 0 : 0.07, delayChildren: reduced ? 0 : 0.28 } }),
  out: { opacity: 0, transition: { duration: DUR.micro } },
};

const LINE: Variants = {
  enter: (reduced: boolean) => (reduced ? { opacity: 0 } : { opacity: 0, y: 14 }),
  in: (reduced: boolean) => ({ opacity: 1, y: 0, transition: { duration: reduced ? DUR.fast : DUR.base, ease: EASE.enter } }),
};
