import type { BezierDefinition, SpringOptions } from "framer-motion";

/**
 * MOTION TOKENS — the one file to edit when tuning animation.
 *
 * Every component in `src/animations/` (and every page that uses it) reads
 * its timing from here, so changing a number below changes the feel of the
 * whole site consistently. CSS transitions use the mirrored `--motion-*`
 * custom properties in `src/styles/motion.css` — keep the two in step if
 * you change an easing curve or a duration.
 */

/* ------------------------------------------------------------------ */
/* EASING                                                              */
/* ------------------------------------------------------------------ */

export const EASE = {
  /** Things arriving: fast start, long soft settle. The default for reveals. */
  enter: [0.16, 1, 0.3, 1],
  /** General UI movement (menus, tabs, hovers). */
  standard: [0.22, 1, 0.36, 1],
  /** Big, memorable moments only — never more than one at once. */
  cinematic: [0.6, 0.02, 0.15, 1],
  /** Things leaving: gentle start, quick finish. */
  exit: [0.5, 0, 0.75, 0],
  /** Micro feedback (buttons, toggles): quick and settled, no bounce. */
  snappy: [0.2, 0.8, 0.2, 1],
} as const satisfies Record<string, BezierDefinition>;

/* ------------------------------------------------------------------ */
/* DURATIONS (seconds)                                                 */
/* ------------------------------------------------------------------ */

export const DUR = {
  /** Hover / press feedback. */
  micro: 0.18,
  /** Small UI changes, reveal exits. */
  fast: 0.3,
  /** Standard section reveal. */
  base: 0.55,
  /** Large media, mask wipes, drifts. */
  slow: 0.8,
  /** Hero-scale moments. */
  cinematic: 1.1,
} as const;

/* ------------------------------------------------------------------ */
/* SPRINGS                                                             */
/* ------------------------------------------------------------------ */

export const SPRING = {
  /** Calm follow for large surfaces. */
  soft: { stiffness: 120, damping: 20, mass: 1 },
  /** 3D card tilt: responsive but never wobbly. */
  tilt: { stiffness: 170, damping: 18, mass: 0.7 },
  /** Ambient pointer parallax (hero glow, portrait depth): lazy on purpose. */
  pointer: { stiffness: 60, damping: 20, mass: 1 },
  /** Magnetic buttons and small snappy elements. */
  magnetic: { stiffness: 220, damping: 16, mass: 0.6 },
  /** Quick settle for toggles and indicators. */
  snappy: { stiffness: 420, damping: 32, mass: 0.8 },
} as const satisfies Record<string, SpringOptions>;

/* ------------------------------------------------------------------ */
/* SETTINGS — the knobs                                                */
/* ------------------------------------------------------------------ */

export interface MotionSettings {
  /** Master switch for scroll reveals. `false` → everything renders visible and still. */
  revealsEnabled: boolean;
  /** How far (px) content travels while revealing (rise/drop, splits, drift scale from this). */
  revealDistance: number;
  /**
   * Where the "reveal line" sits, as a fraction of the screen height measured
   * up from the bottom edge. 0.1 → an element reveals once its top edge has
   * risen 10% into the screen, and hides again (scrolling up) once it drops
   * back below that line.
   */
  revealOffset: number;
  /** Duration (s) of a standard reveal. Mask/clip/drift use `DUR.slow`. */
  revealDuration: number;
  /** Duration (s) of the reverse animation when scrolling back up past something. */
  exitDuration: number;
  /** Seconds between items in a `<Stagger>` group. */
  staggerGap: number;
  /**
   * Longest stagger offset (s) any one item waits. A grid of 20 cards
   * entering together still finishes quickly: later items share this cap.
   */
  staggerMax: number;
  /** Seconds between words in `<TextReveal>` (lines use 2.5× this). */
  textStagger: number;
  /** Starting zoom of the image inside `<MaskReveal>` (settles to 1). `1` = no zoom. */
  maskZoom: number;
  /**
   * Elements already on screen when they mount (page load, route change,
   * tab switch) shouldn't make the visitor wait: their `delay` is multiplied
   * by this and capped at `initialDelayMax` seconds.
   */
  initialDelayScale: number;
  initialDelayMax: number;
  /** Master switch for depth effects: parallax, tilt, pointer-follow. */
  depthEnabled: boolean;
  /** Parallax travel (px) at `speed={1}`. `speed={0.2}` → ±24px across the viewport. */
  parallaxStrength: number;
  /** Parallax multiplier on touch screens (phones scroll fast; keep depth subtler). */
  touchParallaxScale: number;
  /** Maximum card tilt in degrees. Keep it small — depth, not gimmick. */
  tiltMax: number;
  /** Scale a tilt card grows to while hovered. */
  tiltScale: number;
  /** Perspective distance (px) for tilt cards. Smaller = more dramatic. */
  tiltPerspective: number;
  /** How far `<TiltLayer depth={n}>` slides sideways, as a fraction of `n`, at full tilt. */
  tiltLayerShift: number;
  /** Peak opacity of the soft light that follows the pointer on `<Tilt glare>`. */
  tiltGlare: number;
  /** Ambient pointer tracking (`usePointer`) on/off. */
  pointerEnabled: boolean;
  /** Seconds for one full loop of `<Marquee>` (longer = slower). */
  marqueeDuration: number;
  /**
   * With the visitor's "reduce motion" setting on, reveals become:
   *  "fade" — a short opacity fade, still reversible (default)
   *  "none" — content simply shows, nothing animates
   */
  reducedMotionReveal: "fade" | "none";
}

export const motionSettings: MotionSettings = {
  revealsEnabled: true,
  revealDistance: 40,
  revealOffset: 0.1,
  revealDuration: DUR.base,
  exitDuration: 0.4,
  staggerGap: 0.07,
  staggerMax: 0.6,
  textStagger: 0.045,
  maskZoom: 1.12,
  initialDelayScale: 0.6,
  initialDelayMax: 0.6,

  depthEnabled: true,
  parallaxStrength: 120,
  touchParallaxScale: 0.5,
  tiltMax: 7,
  tiltScale: 1.02,
  tiltPerspective: 1000,
  tiltLayerShift: 0.3,
  tiltGlare: 0.14,
  pointerEnabled: true,

  marqueeDuration: 40,
  reducedMotionReveal: "fade",
};
