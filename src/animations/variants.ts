import type { CSSProperties } from "react";
import { DUR, EASE, motionSettings } from "./tokens";
import type { ViewportPhase, ViewportState } from "./viewport";

/**
 * REVEAL POSES
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
 *
 * How it moves: each state is an inline style (opacity, transform and, for
 * some variants, clip-path or filter) and the browser's own CSS transitions
 * carry the element from one to the next. Opacity and transform transitions
 * run on the compositor, so no animation code runs on the main thread while
 * things reveal, and a reversal mid-entrance simply continues from wherever
 * the element is. The inline `transition` is only there while something can
 * move: once an entrance has finished (`settled`, see useRevealSettled) the
 * element rests in its plain pose — no clip, filter or 3D context — and any
 * transitions the page itself gives it (hover colours, shadows) apply again.
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
  /** Seconds before the entrance starts. */
  delay?: number;
  /** Entrance duration (s). Defaults per variant. */
  duration?: number;
  /** Travel distance (px). Defaults to `motionSettings.revealDistance`. */
  distance?: number;
  /** Visitor prefers reduced motion → opacity only. */
  reduced?: boolean;
  /** The entrance has finished: the resting pose, with no transition. */
  settled?: boolean;
  /**
   * Still in the prerendered state (never moved): the hidden pose needs no
   * exit transition yet, which keeps it out of the static HTML.
   */
  pristine?: boolean;
}

type Ease = readonly [number, number, number, number];

/** One state of a variant. Transform parts left out are 0 (scale 1). */
interface Pose {
  opacity: number;
  x?: number;
  y?: number;
  scale?: number;
  rotateX?: number;
  clip?: string;
  filter?: string;
}

type TransformPart = "x" | "y" | "scale" | "rotateX";

interface VariantShape {
  /** Transform functions this variant moves, in order (every state writes all of them, so they interpolate cleanly). */
  parts: readonly TransformPart[];
  /** Perspective (px) kept on the transform while moving; dropped once settled. */
  perspective?: number;
  below: (d: number) => Pose;
  above: (d: number) => Pose;
  visible: Pose;
  /** Default entrance duration (s). */
  duration: number;
  /** Opacity's own entrance timing, when it differs from the movement's. */
  opacity?: { duration: number; ease: Ease };
}

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
 * edge belong on an inner layer — see maskRevealStyles.
 */
const shapes: Record<RevealVariant, VariantShape> = {
  rise: {
    parts: ["y"],
    below: (d) => ({ opacity: 0, y: d }),
    above: (d) => ({ opacity: 0, y: -d }),
    visible: { opacity: 1 },
    duration: motionSettings.revealDuration,
  },
  fade: {
    parts: [],
    below: () => ({ opacity: 0 }),
    above: () => ({ opacity: 0 }),
    visible: { opacity: 1 },
    duration: motionSettings.revealDuration,
  },
  // A window opening: the frame grows from an inset, rounded crop to full bleed.
  mask: {
    parts: ["y", "scale"],
    below: (d) => ({ opacity: 0, y: d * 0.4, scale: 0.97, clip: MASK_CLOSED }),
    above: (d) => ({ opacity: 0, y: -d * 0.4, scale: 0.97, clip: MASK_CLOSED }),
    visible: { opacity: 1, clip: MASK_OPEN },
    duration: DUR.slow,
    opacity: { duration: DUR.base, ease: EASE.standard },
  },
  // A directional wipe that unrolls from the edge that came into view first:
  // top-down while scrolling down, bottom-up while scrolling back up. The
  // closed clip keeps a hairline of that edge (hidden by the opacity).
  clip: {
    parts: ["y"],
    below: (d) => ({ opacity: 0, y: d * 0.5, clip: "inset(0% 0% 99.8% 0%)" }),
    above: (d) => ({ opacity: 0, y: -d * 0.5, clip: "inset(99.8% 0% 0% 0%)" }),
    visible: { opacity: 1, clip: INSET_OPEN },
    duration: DUR.slow,
    opacity: { duration: DUR.fast, ease: EASE.standard },
  },
  "split-left": {
    parts: ["x", "y"],
    below: (d) => ({ opacity: 0, x: -d * 1.5, y: d * 0.3 }),
    above: (d) => ({ opacity: 0, x: -d * 1.5, y: -d * 0.3 }),
    visible: { opacity: 1 },
    duration: motionSettings.revealDuration,
  },
  "split-right": {
    parts: ["x", "y"],
    below: (d) => ({ opacity: 0, x: d * 1.5, y: d * 0.3 }),
    above: (d) => ({ opacity: 0, x: d * 1.5, y: -d * 0.3 }),
    visible: { opacity: 1 },
    duration: motionSettings.revealDuration,
  },
  // Focus pull. Filters repaint, so keep this for a few large moments.
  blur: {
    parts: ["y"],
    below: (d) => ({ opacity: 0, y: d * 0.5, filter: "blur(14px)" }),
    above: (d) => ({ opacity: 0, y: -d * 0.5, filter: "blur(14px)" }),
    visible: { opacity: 1, filter: "blur(0px)" },
    duration: DUR.slow,
  },
  scale: {
    parts: ["y", "scale"],
    below: (d) => ({ opacity: 0, scale: 0.92, y: d * 0.4 }),
    above: (d) => ({ opacity: 0, scale: 0.92, y: -d * 0.4 }),
    visible: { opacity: 1 },
    duration: motionSettings.revealDuration,
  },
  // Horizontal drift keyed to scroll direction: in from the right going down, from the left going up.
  drift: {
    parts: ["x"],
    below: (d) => ({ opacity: 0, x: d * 2 }),
    above: (d) => ({ opacity: 0, x: -d * 2 }),
    visible: { opacity: 1 },
    duration: DUR.slow,
  },
  // Leans back in perspective and stands up. The perspective is dropped once
  // settled, so the resting element carries no 3D transform: crisp text, no
  // stacking-context side effects.
  tilt: {
    parts: ["y", "rotateX"],
    perspective: 1000,
    below: (d) => ({ opacity: 0, y: d, rotateX: 16 }),
    above: (d) => ({ opacity: 0, y: -d, rotateX: -16 }),
    visible: { opacity: 1 },
    duration: DUR.slow,
  },
};

/* ------------------------------------------------------------------ */
/* CSS helpers                                                         */
/* ------------------------------------------------------------------ */

const round = (value: number) => Math.round(value * 100) / 100;
const ms = (seconds: number) => `${Math.round(seconds * 1000)}ms`;
const cubic = (ease: Ease) => `cubic-bezier(${ease.join(", ")})`;

function transformOf(shape: VariantShape, pose: Pose): string {
  const fns = shape.perspective ? [`perspective(${shape.perspective}px)`] : [];
  for (const part of shape.parts) {
    if (part === "x") fns.push(`translateX(${round(pose.x ?? 0)}px)`);
    else if (part === "y") fns.push(`translateY(${round(pose.y ?? 0)}px)`);
    else if (part === "scale") fns.push(`scale(${round(pose.scale ?? 1)})`);
    else fns.push(`rotateX(${round(pose.rotateX ?? 0)}deg)`);
  }
  return fns.length ? fns.join(" ") : "none";
}

interface Track {
  property: "opacity" | "transform" | "clip-path" | "filter";
  duration: number;
  ease: Ease;
  delay?: number;
}

function transitionOf(tracks: readonly Track[]): string {
  return tracks
    .map(({ property, duration, ease, delay }) => `${property} ${ms(duration)} ${cubic(ease)}${delay ? ` ${ms(delay)}` : ""}`)
    .join(", ");
}

/** The CSS properties a shape moves besides opacity. */
function movedProperties(shape: VariantShape): Track["property"][] {
  const props: Track["property"][] = [];
  if (shape.parts.length || shape.perspective) props.push("transform");
  if (shape.visible.clip) props.push("clip-path");
  if (shape.visible.filter) props.push("filter");
  return props;
}

/* ------------------------------------------------------------------ */
/* Reveal                                                              */
/* ------------------------------------------------------------------ */

/**
 * Inline style for one revealing element (`<Reveal>`, `<StaggerItem>`, or
 * a custom reveal built on `useReveal`) in the state `label`.
 */
export function revealStyle(variant: RevealVariant, label: RevealLabel, timing: RevealTiming = {}): CSSProperties {
  const shape = shapes[variant] ?? shapes.rise;
  const moved = movedProperties(shape);
  const delay = timing.delay ?? 0;

  if (timing.reduced) {
    // Nothing moves: the resting pose, fading only (or not at all).
    const style: CSSProperties = {};
    if (moved.includes("transform")) style.transform = "none";
    if (moved.includes("clip-path")) style.clipPath = "none";
    if (moved.includes("filter")) style.filter = "none";
    const hidden = motionSettings.reducedMotionReveal === "none" ? 1 : 0;
    if (label === "visible") {
      style.opacity = 1;
      if (!timing.settled) {
        style.transition = transitionOf([
          { property: "opacity", duration: DUR.fast, ease: EASE.standard, delay: Math.min(delay, 0.15) },
        ]);
      }
    } else {
      style.opacity = hidden;
      if (label === "above") style.transition = "none";
      else if (!timing.pristine) style.transition = transitionOf([{ property: "opacity", duration: DUR.fast * 0.6, ease: EASE.standard }]);
    }
    return style;
  }

  const distance = timing.distance ?? motionSettings.revealDistance;

  if (label === "visible" && timing.settled) {
    const style: CSSProperties = { opacity: 1 };
    if (moved.includes("transform")) style.transform = "none";
    if (moved.includes("clip-path")) style.clipPath = "none";
    if (moved.includes("filter")) style.filter = "none";
    return style;
  }

  const pose = label === "visible" ? shape.visible : label === "above" ? shape.above(distance) : shape.below(distance);
  const style: CSSProperties = { opacity: pose.opacity };
  if (moved.includes("transform")) style.transform = transformOf(shape, pose);
  if (moved.includes("clip-path")) style.clipPath = pose.clip;
  if (moved.includes("filter")) style.filter = pose.filter;

  if (label === "above") {
    style.transition = "none";
  } else if (label === "below") {
    if (!timing.pristine) {
      style.transition = transitionOf(
        ["opacity" as const, ...moved].map((property) => ({
          property,
          duration: motionSettings.exitDuration,
          ease: EASE.exit,
        }))
      );
    }
  } else {
    const duration = timing.duration ?? shape.duration;
    style.transition = transitionOf([
      { property: "opacity", duration: shape.opacity?.duration ?? duration, ease: shape.opacity?.ease ?? EASE.enter, delay },
      ...moved.map((property) => ({ property, duration, ease: EASE.enter, delay })),
    ]);
  }
  return style;
}

/** The clip-path a variant opens to (null when it doesn't clip, or under reduced motion). */
export function revealOpenClip(variant: RevealVariant, reduced = false): string | null {
  return reduced ? null : ((shapes[variant] ?? shapes.rise).visible.clip ?? null);
}

/** Milliseconds from the moment a reveal turns "visible" until its entrance has finished. */
export function revealSettleMs(variant: RevealVariant, timing: RevealTiming = {}): number {
  const shape = shapes[variant] ?? shapes.rise;
  const delay = timing.delay ?? 0;
  if (timing.reduced) return Math.round((Math.min(delay, 0.15) + DUR.fast) * 1000);
  const duration = timing.duration ?? shape.duration;
  return Math.round((delay + Math.max(duration, shape.opacity?.duration ?? 0)) * 1000);
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
  /** The entrance has finished: the resting pose, with no transition. */
  settled?: boolean;
  /** Still in the prerendered state (never moved). */
  pristine?: boolean;
}

/**
 * `frame` is the observed outer element: its box never changes, so the
 * viewport engine measures it exactly (only reduced motion fades it).
 * `content` is the inner layer that carries the wipe and counter-zooms —
 * clipping it can't disturb the observation, so the wipe is free to open
 * from the far edge. Either may be undefined (nothing to set).
 */
export function maskRevealStyles(
  direction: MaskDirection,
  label: RevealLabel,
  { delay = 0, duration = DUR.slow, zoom = motionSettings.maskZoom, reduced = false, settled = false, pristine = false }: MaskRevealTiming = {}
): { frame?: CSSProperties; content?: CSSProperties } {
  if (reduced) {
    return {
      frame: revealStyle("fade", label, { delay, reduced: true, settled, pristine }),
      content: { transform: "none", clipPath: "none" },
    };
  }
  if (label === "visible" && settled) return { content: { transform: "none", clipPath: "none" } };
  const wipe = WIPES[direction] ?? WIPES.vertical;
  if (label === "visible") {
    return {
      content: {
        clipPath: wipe.open,
        transform: "scale(1)",
        transition: transitionOf([
          { property: "clip-path", duration, ease: EASE.enter, delay },
          { property: "transform", duration: duration * 1.4, ease: EASE.enter, delay },
        ]),
      },
    };
  }
  const content: CSSProperties = {
    clipPath: label === "above" ? wipe.above : wipe.below,
    transform: `scale(${round(zoom)})`,
  };
  if (label === "above") content.transition = "none";
  else if (!pristine) {
    content.transition = transitionOf([
      { property: "clip-path", duration: motionSettings.exitDuration, ease: EASE.exit },
      { property: "transform", duration: motionSettings.exitDuration, ease: EASE.exit },
    ]);
  }
  return { content };
}

/** The clip-path a MaskReveal's inner layer opens to (null under reduced motion). */
export function maskOpenClip(direction: MaskDirection, reduced = false): string | null {
  return reduced ? null : (WIPES[direction] ?? WIPES.vertical).open;
}

/** Milliseconds from the moment a MaskReveal turns "visible" until its entrance has finished. */
export function maskRevealSettleMs({ delay = 0, duration = DUR.slow, reduced = false }: MaskRevealTiming = {}): number {
  if (reduced) return revealSettleMs("fade", { delay, reduced: true });
  return Math.round((delay + duration * 1.4) * 1000);
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
