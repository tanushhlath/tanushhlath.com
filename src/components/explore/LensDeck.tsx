import { memo, useRef, type KeyboardEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, type Transition } from "framer-motion";
import { DUR, EASE, Reveal } from "@/animations";
import { MediaCover } from "@/components/media";
import { exploreCopy, type ExploreLensKey } from "@/lib/content";
import type { ResolvedImage } from "@/types/content";
import { LENS_KEYS, pad2, shapeLens, thingsLabel } from "./exploreModel";

export interface LensDeckProps {
  active: ExploreLensKey | null;
  onSelect: (lens: ExploreLensKey) => void;
  /** false until just after hydration (a lens from the URL applies instantly). */
  animate: boolean;
  reduced: boolean;
}

/**
 * Door corner radii in px. Set through the motion style (not CSS) so
 * Framer can correct them while a door morphs: layout animations scale
 * the box, which would otherwise stretch the corners into a pill.
 */
const DOOR_RADIUS = { open: 22, compact: 16 } as const;

/**
 * Five doors into the same person. Before a choice they stand side by
 * side, each with a small fanned stack of real photos from its path;
 * hovering one spreads its photos apart. Choosing a lens is a morph:
 * that door widens into the lens's headline while the others step back
 * into slim tabs you can still switch to (phones: the chosen door spans
 * the width and the others line up beneath it as chips).
 *
 * Memoised: the results below assemble in a later commit (see
 * ExploreView), which must not re-render the deck — that would re-measure
 * the doors mid-morph and restart their layout animation.
 */
export const LensDeck = memo(function LensDeck({ active, onSelect, animate, reduced }: LensDeckProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const still = !animate || reduced;
  const layout: Transition = still ? { duration: 0 } : { duration: DUR.slow, ease: EASE.cinematic };
  const fade: Transition = still ? { duration: 0 } : { duration: DUR.fast, ease: EASE.standard };
  /*
   * While a door opens, its lens word travels from the foot of the door to
   * the top. What appears around it waits so the word never slides through
   * visible text: the headline once the word is most of the way up, and
   * (for a door reopening from a tab) the label, which sits right under
   * the word, only once it has arrived.
   */
  const detailIn: Transition = still ? { duration: 0 } : { duration: DUR.base, ease: EASE.enter, delay: DUR.slow * 0.6 };
  const labelIn: Transition = still ? { duration: 0 } : { duration: DUR.fast, ease: EASE.standard, delay: DUR.slow * 0.85 };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    let next = index + step;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = LENS_KEYS.length - 1;
    else if (step === 0) return;
    event.preventDefault();
    next = (next + LENS_KEYS.length) % LENS_KEYS.length;
    refs.current[next]?.focus();
  };

  return (
    <Reveal variant="tilt" className="ex-deck-wrap">
      <p className="ex-deck__prompt" aria-hidden="true">
        <span className="ex-deck__prompt-rule" />
        {exploreCopy.lensPrompt}
      </p>
      <LayoutGroup id="explore-deck">
        <div className="ex-deck" role="group" aria-label={exploreCopy.lensPrompt} data-state={active ? "chosen" : "idle"}>
          {LENS_KEYS.map((key, i) => {
            const lens = shapeLens(key);
            const isActive = key === active;
            const compact = active !== null && !isActive;
            return (
              <motion.button
                key={key}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                layout
                transition={{ layout }}
                style={{ borderRadius: compact ? DOOR_RADIUS.compact : DOOR_RADIUS.open }}
                type="button"
                className="ex-door"
                data-lens={key}
                data-active={isActive ? "true" : "false"}
                data-compact={compact ? "true" : "false"}
                aria-pressed={isActive}
                aria-label={lens.label}
                onClick={() => {
                  if (!isActive) onSelect(key);
                }}
                onKeyDown={(event) => onKeyDown(event, i)}
                data-cursor="view"
                data-cursor-label={lens.short}
              >
                <motion.span layout="position" transition={{ layout }} className="ex-door__top">
                  <span className="ex-door__index">{pad2(i + 1)}</span>
                  <span className="ex-door__count">{thingsLabel(lens.total)}</span>
                </motion.span>

                <motion.span layout="position" transition={{ layout }} className="ex-door__word font-display">
                  {lens.short}
                </motion.span>

                <AnimatePresence initial={false} mode="popLayout">
                  {!compact && (
                    <motion.span
                      key="label"
                      layout="position"
                      transition={{ layout, opacity: labelIn }}
                      className="ex-door__label"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: still ? 0 : DUR.micro } }}
                    >
                      {lens.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* popLayout: a closing door's headline leaves the flow at once, so its
                    removal later doesn't re-measure the deck and restart the morph. */}
                <AnimatePresence initial={false} mode="popLayout">
                  {isActive && (
                    <motion.span
                      key="detail"
                      layout="position"
                      transition={{ layout }}
                      className="ex-door__detail"
                      initial={{ opacity: 0, y: still ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0, transition: detailIn }}
                      exit={{ opacity: 0, transition: { duration: still ? 0 : DUR.micro } }}
                    >
                      <span className="ex-door__headline font-display">{lens.headline}</span>
                      <span className="ex-door__desc">{lens.description}</span>
                    </motion.span>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {!compact && lens.fan.length > 0 && (
                    <motion.span
                      key="fan"
                      layout="position"
                      transition={{ layout }}
                      className="ex-fan"
                      data-spread={isActive ? "true" : "false"}
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: fade }}
                      exit={{ opacity: 0, transition: { duration: still ? 0 : DUR.micro } }}
                    >
                      {lens.fan.map((card, n) => (
                        <FanCard key={card.image?.src ?? n} image={card.image} title={card.title} index={n} />
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>

                <span className="ex-door__glow" aria-hidden="true" />
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>
    </Reveal>
  );
});

function FanCard({ image, title, index }: { image?: ResolvedImage; title: string; index: number }) {
  return (
    <span className="ex-fan__card" data-n={index}>
      <MediaCover image={image} title={title} interactive={false} sizes="120px" />
    </span>
  );
}
