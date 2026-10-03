import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotionSafe } from "./env";
import { motionSettings } from "./tokens";
import { revealLabel, type RevealLabel } from "./variants";
import {
  isPristineViewportState,
  useViewportState,
  type ViewportOptions,
  type ViewportPhase,
  type ViewportState,
} from "./viewport";

export interface RevealState {
  /** The state to show: "below" | "visible" | "above". */
  label: RevealLabel;
  phase: ViewportPhase;
  state: ViewportState;
  /** Visitor prefers reduced motion (false during prerender/hydration). */
  reduced: boolean;
  /** Reveals are on for this element (`motionSettings.revealsEnabled` and not `disabled`). */
  active: boolean;
  /** Still in its prerendered state — nothing has moved yet. */
  pristine: boolean;
}

/**
 * Everything a custom reversible reveal needs, for elements that don't fit
 * `<Reveal>`:
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { label, state, reduced, active, pristine } = useReveal(ref);
 *   const timing = { delay: entranceDelay(0.1, state), reduced, pristine };
 *   const settled = useRevealSettled(state, label, revealSettleMs("scale", timing), active);
 *   <div ref={ref} data-reveal={label}
 *     style={active ? revealStyle("scale", label, { ...timing, settled }) : undefined} />
 */
export function useReveal(ref: RefObject<Element | null>, options: ViewportOptions = {}): RevealState {
  const reduced = useReducedMotionSafe();
  const active = motionSettings.revealsEnabled && !options.disabled;
  const state = useViewportState(ref, { ...options, disabled: !active });
  return {
    label: revealLabel(state.phase),
    phase: state.phase,
    state,
    reduced,
    active,
    pristine: isPristineViewportState(state),
  };
}

/**
 * true once the current entrance has run its course: the reveal has been
 * "visible" for `settleMs` (its delay plus its longest transition). Reveal
 * components then rest in their plain pose with no inline transition, so
 * the page's own styles and transitions for the element take over. Every
 * new entrance starts unsettled again (each viewport change is a new
 * `state` object).
 */
export function useRevealSettled(state: ViewportState, label: RevealLabel, settleMs: number, enabled = true): boolean {
  const [settledState, setSettledState] = useState<ViewportState | null>(null);
  const entering = enabled && label === "visible";
  useEffect(() => {
    if (!entering) return;
    const timer = window.setTimeout(() => setSettledState(state), settleMs);
    return () => window.clearTimeout(timer);
  }, [entering, state, settleMs]);
  return entering && settledState === state;
}

/**
 * A wipe that rests with `clip-path: none` (so focus rings and shadows
 * aren't cut, and no stacking context is left behind) can't transition from
 * there: `none` doesn't interpolate, and the exit would snap shut. When the
 * exit pose arrives straight from rest, the open clip is set and flushed
 * first, so the wipe closes smoothly the way the entrance opened it.
 * `openClip` is the variant's open clip (null when it has none).
 */
export function useClipExitFromRest(
  ref: RefObject<HTMLElement | null>,
  label: RevealLabel,
  resting: boolean,
  openClip: string | null
): void {
  const wasResting = useRef(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (openClip && element && label === "below" && wasResting.current) {
      const closed = element.style.clipPath;
      element.style.clipPath = openClip;
      // Style flush: the exit's other transitions start here, and the clip
      // is now open — so setting it closed again transitions.
      void getComputedStyle(element).clipPath;
      element.style.clipPath = closed;
    }
    wasResting.current = resting;
  }, [ref, label, resting, openClip]);
}
