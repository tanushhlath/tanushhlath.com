/**
 * MOTION SYSTEM — import everything from "@/animations".
 *
 * Tune the feel of the whole site in ./tokens.ts (`motionSettings`, EASE,
 * DUR, SPRING). CSS helpers live in src/styles/motion.css.
 *
 * Ground rules
 *  - Every scroll reveal is reversible and direction-aware: scrolling down
 *    it rises in; scrolling back up past it, it exits downward; re-entering
 *    from the top it drops in from above; it replays every time. Never use
 *    `once: true`.
 *  - Reduced motion is handled inside every export (opacity-only or still;
 *    no parallax, tilt or pointer depth). Touch screens get no tilt/pointer.
 *  - Nothing re-renders per scroll or pointer event; only transform,
 *    opacity, clip-path (and, sparingly, filter) animate.
 *  - All of it is prerender/hydration safe. Restraint: one or two moving
 *    things per screen, not everything at once.
 *
 * SCROLL REVEALS
 *   <Reveal>…</Reveal>                                   rise in (default)
 *   <Reveal variant="split-left" delay={0.1} as="section" id="x" className="…">
 *       variants: rise | fade | mask | clip | split-left | split-right | blur | scale | drift | tilt
 *       props: delay, duration, distance, amount (reveal line), as, id, className, style, disabled
 *   <Stagger as="ul" gap={0.06} variant="rise"><StaggerItem as="li">…</StaggerItem>…</Stagger>
 *       items reveal as each reaches the screen; items arriving together cascade in order
 *   <TextReveal as="h2" text="A different way in" emphasis="different" className="…" />
 *       masked word-by-word heading (mode="lines": one mask per "\n"-separated line)
 *   <MaskReveal direction="vertical" className="aspect-[4/3] rounded-2xl"><img … /></MaskReveal>
 *       clip-path wipe + settling zoom for images (direction: vertical | horizontal | center)
 *
 * DEPTH
 *   <Parallax speed={-0.15}><img … /></Parallax>         scroll parallax (negative = lags behind)
 *   <Parallax axis="x" distance={40}>…</Parallax>        exact px travel, sideways
 *   <Drift distance={60}>…</Drift>                       sideways drift as a band scrolls past
 *   <Tilt max={5} glare className="rounded-2xl">…</Tilt> pointer 3D tilt (mouse/trackpad only)
 *   <TiltLayer depth={16}>…</TiltLayer>                  a layer inside <Tilt> that separates in depth
 *   <Marquee label="Interests">…items…</Marquee>         endless slow horizontal drift (ambient rows)
 *
 * HOOKS
 *   const phase = useViewportPhase(ref);                 "before" | "inside" | "after" (changes only on transitions)
 *   const { label, reduced, active } = useReveal(ref);   build a custom reveal: animate={label} with revealVariants()
 *   const progress = useSectionProgress(ref, "through"); MotionValue 0…1 (ranges: through | enter | cover | exit | center)
 *   const y = useParallax(ref, { speed: 0.2 });          MotionValue px, 0 under reduced motion
 *   const { x, y } = usePointer();                       window pointer, MotionValues -1…1 (smoothed; { smooth: false } = raw)
 *   const { x, y } = usePointerParallax(12);             px offsets toward the pointer (negative = away)
 *   const dir = useScrollDirection();                    "up" | "down" — re-renders only when it flips
 *   const scrolled = useScrolled();                      page left the very top (also html[data-scrolled])
 *   const reduced = useReducedMotionSafe();              hydration-safe reduced-motion flag
 *   const fine = useFinePointer();                       mouse/trackpad that can hover
 *   const hydrated = useHydrated();                      false in prerender + hydration render
 *   const depth = useDepthEnabled();                     parallax/depth allowed for this visitor
 *
 * LOW LEVEL
 *   observeViewport(el, (phase) => …, amount)            imperative phase listener (no React)
 *   subscribeScrollDirection(({ direction, scrolled }) => …)
 *   revealVariants("scale", { delay, reduced })          Framer variants: "below" | "visible" | "above"
 *   revealLabel(phase)                                   phase → variant label
 *   transition={{ duration: DUR.base, ease: EASE.enter }} / useSpring(v, SPRING.tilt)
 *
 * CSS (src/styles/motion.css — Tailwind utilities, so md:/hover:/group-hover: work)
 *   perspective-600 / -800 / -1000 / -1400, preserve-3d, depth-1 … depth-3 (sit 12/28/56px
 *   in front inside a preserve-3d stage), depth-shadow-sm / -md / -lg, depth-lift (hover lift)
 *   var(--motion-ease-enter | -standard | -cinematic | -exit | -snappy), var(--motion-dur-fast …)
 *   Hooks for CSS: html[data-scroll-dir="up"|"down"], html[data-scrolled="true"|"false"],
 *   [data-reveal="below"|"visible"|"above"] on every reveal
 */

export { EASE, DUR, SPRING, motionSettings, type MotionSettings } from "./tokens";

export {
  isBrowser,
  prefersReducedMotion,
  hasFinePointer,
  useReducedMotionSafe,
  useFinePointer,
  useCoarsePointer,
  useHydrated,
} from "./env";

export {
  startScrollDirection,
  getScrollDirection,
  getScrollState,
  subscribeScrollDirection,
  useScrollDirection,
  useScrolled,
  type ScrollDirection,
  type ScrollState,
} from "./scrollDirection";

export {
  observeViewport,
  useViewportState,
  useViewportPhase,
  type ViewportPhase,
  type ViewportState,
  type ViewportOptions,
} from "./viewport";

export {
  revealVariants,
  groupVariants,
  maskedTextVariants,
  maskRevealVariants,
  revealLabel,
  entranceDelay,
  type RevealVariant,
  type RevealLabel,
  type RevealTiming,
  type MaskDirection,
  type MaskedTextTiming,
  type MaskRevealTiming,
} from "./variants";

export { useReveal, type RevealState } from "./useReveal";
export { Reveal, type RevealProps } from "./Reveal";
export { Stagger, StaggerItem, type StaggerProps, type StaggerItemProps } from "./Stagger";
export { TextReveal, type TextRevealProps } from "./TextReveal";
export { MaskReveal, type MaskRevealProps } from "./MaskReveal";

export {
  useSectionProgress,
  useParallax,
  useDepthEnabled,
  SCROLL_RANGES,
  type ScrollRange,
  type ParallaxOptions,
} from "./scroll";
export { Parallax, Drift, type ParallaxProps, type DriftProps } from "./Parallax";

export { usePointer, usePointerParallax, usePointerEnabled, type PointerValues, type PointerOptions } from "./pointer";
export { Tilt, TiltLayer, type TiltProps, type TiltLayerProps } from "./Tilt";
export { Marquee, type MarqueeProps } from "./Marquee";

export { MOTION_TAGS, type MotionTagName } from "./tags";
