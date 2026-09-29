import type { TargetAndTransition, Transition, Variants } from "framer-motion";
import { DUR, EASE, motionSettings } from "./tokens";
import type { ViewportPhase, ViewportState } from "./viewport";

/**
 * REVEAL VARIANTS
 *
 * Every reveal has three states, named after where the element is:
 *
 *   "below"    waiting under the reveal line (or scrolled back down past it)
 *   "visible"  on screen
 *   "above"    scrolled past, off the top of the screen
 *
 * Going to "visible" from "below" therefore rises in; from "above" it drops
 * in from the top. Scrolling back up past something plays "below" — it exits
 * downward, the way it came. "above" is always applied instantly because the
 * element is already off screen when it happens.
 */

export type RevealVariant =
  | "rise"
  | "fade"
  | "mask"
  | "clip"
  | "split-left"
  | "split-right"
  | "blur"
  | "scale"
  | "drift"
  | "tilt";

export type RevealLabel = "below" | "visible" | "above";

export interface RevealTiming {
  /**
   * Seconds before the entrance starts. Leave it out for children of a
   * `groupVariants` parent: a delay here would override the parent's stagger.
   */
  delay?: number;
  /** Entrance duration (s). Defaults per variant. */
  duration?: number;
  /** Travel distance (px). Defaults to `motionSettings.revealDistance`. */
  distance?: number;
  /** Visitor prefers reduced motion → opacity only. */
  reduced?: boolean;
}

type Target = TargetAndTransition;
type SettleValues = NonNullable<Target["transitionEnd"]>;

interface VariantShape {
  below: (d: number) => Target;
  above: (d: number) => Target;
  visible: Target;
  /** Applied once the entrance finishes, so a resting element keeps no clip, filter or 3D context. */
  settle?: SettleValues;
  /** Resting values for this variant's transform/clip/filter keys (used under reduced motion). */
  neutral: Target;
  /** Default entrance duration (s). */
  duration: number;
  /** Entrance overrides for individual values. */
  enter?: Partial<Record<"opacity" | "transformPerspective", Transition>>;
  /** Exit overrides for individual values. */
  exit?: Partial<Record<"transformPerspective", Transition>>;
}

const INSTANT: Transition = { duration: 0 };
const INSET_OPEN = "inset(0% 0% 0% 0%)";
const MASK_CLOSED = "inset(14% 8% 14% 8% round 24px)";
const MASK_OPEN = "inset(0% 0% 0% 0% round 0px)";

/*
 * Geometry rules for every hidden state. The viewport engine sees the
 * element's *transformed* box, and Chrome's IntersectionObserver also cuts
 * that box down to the element's own clip-path. So a hidden state must never
 * reach further toward the side it enters from than the visible state does
 * (no scale > 1, offsets pointing away), and a clip-path on the revealing
 * element itself must always keep the edge it enters by (never collapse to
 * nothing or open from the far edge). Break either and an element sitting on
 * the reveal line flips back and forth. Wipes that need to start from the far
 * edge belong on an inner layer — see maskRevealVariants.
 */
const shapes: Record<RevealVariant, VariantShape> = {
  rise: {
    below: (d) => ({ opacity: 0, y: d }),
    above: (d) => ({ opacity: 0, y: -d }),
    visible: { opacity: 1, y: 0 },
    neutral: { y: 0 },
    duration: motionSettings.revealDuration,
  },
  fade: {
    below: () => ({ opacity: 0 }),
    above: () => ({ opacity: 0 }),
    visible: { opacity: 1 },
    neutral: {},
    duration: motionSettings.revealDuration,
  },
  // A window opening: the frame grows from an inset, rounded crop to full bleed.
  mask: {
    below: (d) => ({ opacity: 0, y: d * 0.4, scale: 0.97, clipPath: MASK_CLOSED }),
    above: (d) => ({ opacity: 0, y: -d * 0.4, scale: 0.97, clipPath: MASK_CLOSED }),
    visible: { opacity: 1, y: 0, scale: 1, clipPath: MASK_OPEN },
    settle: { clipPath: "none" },
    neutral: { y: 0, scale: 1, clipPath: "none" },
    duration: DUR.slow,
    enter: { opacity: { duration: DUR.base, ease: EASE.standard } },
  },
  // A directional wipe that unrolls from the edge that came into view first:
  // top-down while scrolling down, bottom-up while scrolling back up. The
  // closed clip keeps a hairline of that edge (hidden by the opacity).
  clip: {
    below: (d) => ({ opacity: 0, y: d * 0.5, clipPath: "inset(0% 0% 99.8% 0%)" }),
    above: (d) => ({ opacity: 0, y: -d * 0.5, clipPath: "inset(99.8% 0% 0% 0%)" }),
    visible: { opacity: 1, y: 0, clipPath: INSET_OPEN },
    settle: { clipPath: "none" },
    neutral: { y: 0, clipPath: "none" },
    duration: DUR.slow,
    enter: { opacity: { duration: DUR.fast, ease: EASE.standard } },
  },
  "split-left": {
    below: (d) => ({ opacity: 0, x: -d * 1.5, y: d * 0.3 }),
    above: (d) => ({ opacity: 0, x: -d * 1.5, y: -d * 0.3 }),
    visible: { opacity: 1, x: 0, y: 0 },
    neutral: { x: 0, y: 0 },
    duration: motionSettings.revealDuration,
  },
  "split-right": {
    below: (d) => ({ opacity: 0, x: d * 1.5, y: d * 0.3 }),
    above: (d) => ({ opacity: 0, x: d * 1.5, y: -d * 0.3 }),
    visible: { opacity: 1, x: 0, y: 0 },
    neutral: { x: 0, y: 0 },
    duration: motionSettings.revealDuration,
  },
  // Focus pull. Filters repaint, so keep this for a few large moments.
  blur: {
    below: (d) => ({ opacity: 0, y: d * 0.5, filter: "blur(14px)" }),
    above: (d) => ({ opacity: 0, y: -d * 0.5, filter: "blur(14px)" }),
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
    settle: { filter: "none" },
    neutral: { y: 0, filter: "none" },
    duration: DUR.slow,
  },
  scale: {
    below: (d) => ({ opacity: 0, scale: 0.92, y: d * 0.4 }),
    above: (d) => ({ opacity: 0, scale: 0.92, y: -d * 0.4 }),
    visible: { opacity: 1, scale: 1, y: 0 },
    neutral: { scale: 1, y: 0 },
    duration: motionSettings.revealDuration,
  },
  // Horizontal drift keyed to scroll direction: in from the right going down, from the left going up.
  drift: {
    below: (d) => ({ opacity: 0, x: d * 2 }),
    above: (d) => ({ opacity: 0, x: -d * 2 }),
    visible: { opacity: 1, x: 0 },
    neutral: { x: 0 },
    duration: DUR.slow,
  },
  // Leans back in perspective and stands up. The perspective is dropped once
  // settled (and restored instantly before an exit) so the resting element
  // carries no 3D transform: crisp text, no stacking-context side effects.
  tilt: {
    below: (d) => ({ opacity: 0, y: d, rotateX: 16, transformPerspective: 1000 }),
    above: (d) => ({ opacity: 0, y: -d, rotateX: -16, transformPerspective: 1000 }),
    visible: { opacity: 1, y: 0, rotateX: 0, transformPerspective: 1000 },
    settle: { transformPerspective: 0 },
    neutral: { y: 0, rotateX: 0, transformPerspective: 0 },
    duration: DUR.slow,
    enter: { transformPerspective: INSTANT },
    exit: { transformPerspective: INSTANT },
  },
};

/**
 * Framer spreads a value's own transition over the delay a parent hands
 * down, so a child carrying `delay: 0` would silently cancel its group's
 * stagger. Only write the key when a delay was actually asked for.
 */
function withDelay(transition: Transition, delay: number | undefined): Transition {
  return delay === undefined ? transition : { ...transition, delay };
}

/** Variants for one revealing element (standalone `<Reveal>` or a `<StaggerItem>`). */
export function revealVariants(variant: RevealVariant, timing: RevealTiming = {}): Variants {
  const shape = shapes[variant] ?? shapes.rise;
  const { delay } = timing;

  if (timing.reduced) {
    const hiddenOpacity = motionSettings.reducedMotionReveal === "none" ? 1 : 0;
    const fadeOut: Transition = { duration: DUR.fast * 0.6, ease: EASE.standard };
    const fadeIn = withDelay(
      { duration: DUR.fast, ease: EASE.standard },
      delay === undefined ? undefined : Math.min(delay, 0.15)
    );
    return {
      below: { ...shape.neutral, opacity: hiddenOpacity, transition: { default: INSTANT, opacity: fadeOut } },
      above: { ...shape.neutral, opacity: hiddenOpacity, transition: INSTANT },
      visible: { ...shape.neutral, opacity: 1, transition: { default: INSTANT, opacity: fadeIn } },
    };
  }

  const distance = timing.distance ?? motionSettings.revealDistance;
  const duration = timing.duration ?? shape.duration;
  const enter: Transition = {
    ...withDelay({ duration, ease: EASE.enter }, delay),
    ...(shape.enter?.opacity ? { opacity: withDelay(shape.enter.opacity, delay) } : {}),
    ...(shape.enter?.transformPerspective ? { transformPerspective: shape.enter.transformPerspective } : {}),
  };

  return {
    below: {
      ...shape.below(distance),
      transition: { duration: motionSettings.exitDuration, ease: EASE.exit, ...shape.exit },
    },
    above: { ...shape.above(distance), transition: INSTANT },
    visible: {
      ...shape.visible,
      transition: enter,
      ...(shape.settle ? { transitionEnd: shape.settle } : {}),
    },
  };
}

/**
 * Variants for a group container (`<Stagger>`, `<TextReveal>`): no visual
 * change of its own, it only orchestrates children. Entrances stagger in
 * order; exits run quickly in reverse; "above" is instant.
 */
export function groupVariants(gap: number, delay = 0): Variants {
  return {
    below: { transition: { delayChildren: staggerDelay(gap * 0.4, 0, true) } },
    above: { transition: { delayChildren: 0 } },
    visible: { transition: { delayChildren: staggerDelay(gap, delay, false) } },
  };
}

/** Delay for child `i` of `total`, in order (or reversed, for exits). */
function staggerDelay(gap: number, start: number, reverse: boolean) {
  return (i: number, total: number) => start + gap * (reverse ? total - 1 - i : i);
}

/* ------------------------------------------------------------------ */
/* Masked text (TextReveal)                                            */
/* ------------------------------------------------------------------ */

export interface MaskedTextTiming {
  /** Seconds before the first word/line. */
  delay?: number;
  /** Seconds between consecutive words/lines. */
  gap: number;
  reduced?: boolean;
}

/**
 * Words (or lines) sliding up out of a clipping mask. Pass each piece's
 * index as the motion element's `custom` prop. Exits sink back down all at
 * once; "above" parks them over the mask so re-entry drops in from the top.
 * A quick opacity fade rides along so tall accents or a very tight
 * line-height can never peek out of the mask while hidden.
 */
export function maskedTextVariants({ delay = 0, gap, reduced = false }: MaskedTextTiming): Variants {
  if (reduced) {
    const still: Target = { y: "0%", opacity: 1, transition: INSTANT };
    return { below: still, above: still, visible: still };
  }
  // Long headings still finish promptly.
  const maxOffset = motionSettings.staggerMax * 2;
  return {
    below: { y: "115%", opacity: 0, transition: { duration: motionSettings.exitDuration, ease: EASE.exit } },
    above: { y: "-115%", opacity: 0, transition: INSTANT },
    visible: (i: number) => {
      const start = delay + Math.min(i * gap, maxOffset);
      return {
        y: "0%",
        opacity: 1,
        transition: {
          duration: DUR.slow,
          ease: EASE.enter,
          delay: start,
          opacity: { duration: DUR.fast, ease: EASE.standard, delay: start },
        },
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Clip-path image reveal (MaskReveal)                                 */
/* ------------------------------------------------------------------ */

/**
 * "vertical"   wipes up from the bottom edge scrolling down, down from the top scrolling up
 * "horizontal" wipes left → right scrolling down, right → left scrolling up
 * "center"     opens outward from the middle
 */
export type MaskDirection = "vertical" | "horizontal" | "center";

const WIPES: Record<MaskDirection, { below: string; above: string; open: string }> = {
  vertical: { below: "inset(100% 0% 0% 0%)", above: "inset(0% 0% 100% 0%)", open: INSET_OPEN },
  horizontal: { below: "inset(0% 100% 0% 0%)", above: "inset(0% 0% 0% 100%)", open: INSET_OPEN },
  center: {
    below: "inset(50% 50% 50% 50% round 24px)",
    above: "inset(50% 50% 50% 50% round 24px)",
    open: MASK_OPEN,
  },
};

export interface MaskRevealTiming {
  delay?: number;
  /** Wipe duration (s). Default `DUR.slow`. */
  duration?: number;
  /** Starting zoom of the inner layer. Default `motionSettings.maskZoom`. */
  zoom?: number;
  reduced?: boolean;
}

const STILL_VARIANTS: Variants = { below: {}, above: {}, visible: {} };

/**
 * `frame` is the observed outer element: its box never changes, so the
 * viewport engine measures it exactly (only reduced motion fades it).
 * `content` is the inner layer that carries the wipe and counter-zooms —
 * clipping it can't disturb the observation, so the wipe is free to open
 * from the far edge.
 */
export function maskRevealVariants(
  direction: MaskDirection,
  { delay, duration = DUR.slow, zoom = motionSettings.maskZoom, reduced = false }: MaskRevealTiming = {}
): { frame: Variants; content: Variants } {
  if (reduced) {
    const still: Target = { scale: 1, clipPath: "none", transition: INSTANT };
    return {
      frame: revealVariants("fade", { delay, reduced: true }),
      content: { below: still, above: still, visible: still },
    };
  }
  const wipe = WIPES[direction] ?? WIPES.vertical;
  const exit: Transition = { duration: motionSettings.exitDuration, ease: EASE.exit };
  const enter: Transition = {
    ...withDelay({ duration, ease: EASE.enter }, delay),
    scale: withDelay({ duration: duration * 1.4, ease: EASE.enter }, delay),
  };
  return {
    frame: STILL_VARIANTS,
    content: {
      below: { clipPath: wipe.below, scale: zoom, transition: exit },
      above: { clipPath: wipe.above, scale: zoom, transition: INSTANT },
      // Resting with no clip keeps focus rings and shadows unclipped.
      visible: { clipPath: wipe.open, scale: 1, transition: enter, transitionEnd: { clipPath: "none" } },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Map a viewport phase to the reveal state it should animate to. */
export function revealLabel(phase: ViewportPhase): RevealLabel {
  return phase === "inside" ? "visible" : phase === "after" ? "above" : "below";
}

/**
 * Effective entrance delay: elements that were already on screen when they
 * mounted (page load, route change, tab switch) shouldn't keep anyone waiting.
 */
export function entranceDelay(delay: number, state: ViewportState): number {
  if (!state.inViewOnMount) return delay;
  return Math.min(delay * motionSettings.initialDelayScale, motionSettings.initialDelayMax);
}
