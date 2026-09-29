import type { RefObject } from "react";
import { useReducedMotionSafe } from "./env";
import { motionSettings } from "./tokens";
import { revealLabel, type RevealLabel } from "./variants";
import { useViewportState, type ViewportOptions, type ViewportPhase, type ViewportState } from "./viewport";

export interface RevealState {
  /** The variant label to animate to: "below" | "visible" | "above". */
  label: RevealLabel;
  phase: ViewportPhase;
  state: ViewportState;
  /** Visitor prefers reduced motion (false during prerender/hydration). */
  reduced: boolean;
  /** Reveals are on for this element (`motionSettings.revealsEnabled` and not `disabled`). */
  active: boolean;
}

/**
 * Everything a custom reversible reveal needs, for elements that don't fit
 * `<Reveal>`:
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { label, reduced, active } = useReveal(ref);
 *   <motion.div ref={ref} data-reveal={label} initial={active ? "below" : false}
 *     animate={label} variants={revealVariants("scale", { reduced })} />
 */
export function useReveal(ref: RefObject<Element | null>, options: ViewportOptions = {}): RevealState {
  const reduced = useReducedMotionSafe();
  const active = motionSettings.revealsEnabled && !options.disabled;
  const state = useViewportState(ref, { ...options, disabled: !active });
  return { label: revealLabel(state.phase), phase: state.phase, state, reduced, active };
}
