import { useEffect, useId, useState, type RefObject } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { DUR, EASE, SPRING, observeViewport, useReducedMotionSafe } from "@/animations";
import { workLenses } from "@/lib/content";
import { WORK_LENSES, type WorkLens } from "@/routing/paths";
import { WORK_UI } from "./helpers";

export interface LensDockProps {
  lens: WorkLens;
  onSelect: (lens: WorkLens) => void;
  /** The main lens switcher: the dock appears once it has scrolled away above. */
  watchRef: RefObject<HTMLElement | null>;
  /** The end of the lenses: the dock leaves when this comes into view. */
  endRef: RefObject<HTMLElement | null>;
}

/**
 * A small floating lens switcher at the bottom of the screen, there only
 * while the real one is scrolled away (Did alone is dozens of rows long).
 * It never covers the end of the page: it slides away as the archive link
 * arrives. Choosing a lens here also brings you back to the lens's top.
 */
export function LensDock({ lens, onSelect, watchRef, endRef }: LensDockProps) {
  const reduced = useReducedMotionSafe();
  const groupId = useId();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tabs = watchRef.current;
    const end = endRef.current;
    if (!tabs || !end) return;
    let past = false;
    let atEnd = false;
    const update = () => setVisible(past && !atEnd);
    const stopTabs = observeViewport(tabs, (phase) => {
      past = phase === "after";
      update();
    });
    const stopEnd = observeViewport(end, (phase) => {
      atEnd = phase !== "before";
      update();
    });
    return () => {
      stopTabs();
      stopEnd();
    };
  }, [watchRef, endRef]);

  return (
    <motion.nav
      className="wk-dock"
      aria-label={WORK_UI.quickSwitch}
      aria-hidden={!visible}
      inert={!visible}
      initial={false}
      animate={visible ? "shown" : "hidden"}
      variants={{
        shown: { y: 0, opacity: 1, transition: { duration: reduced ? 0 : DUR.base, ease: EASE.enter } },
        hidden: { y: reduced ? 0 : "140%", opacity: 0, transition: { duration: reduced ? 0 : DUR.fast, ease: EASE.exit } },
      }}
    >
      <LayoutGroup id={groupId}>
        <ul className="wk-dock__list">
          {WORK_LENSES.map((value) => {
            const active = value === lens;
            return (
              <li key={value}>
                <button
                  type="button"
                  className="wk-dock__button"
                  aria-pressed={active}
                  onClick={() => onSelect(value)}
                  data-cursor="view"
                  data-cursor-label={workLenses[value].label}
                >
                  {active && (
                    <motion.span
                      layoutId="wk-dock-pill"
                      className="wk-dock__pill"
                      aria-hidden="true"
                      transition={reduced ? { duration: 0 } : { type: "spring", ...SPRING.snappy }}
                    />
                  )}
                  <span className="wk-dock__label">{workLenses[value].label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </motion.nav>
  );
}
