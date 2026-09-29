import type { RefObject } from "react";
import { useScroll, useTransform, type MotionValue, type UseScrollOptions } from "framer-motion";
import { useCoarsePointer, useHydrated, useReducedMotionSafe } from "./env";
import { motionSettings } from "./tokens";

/**
 * SCROLL-LINKED VALUES
 *
 * Continuous motion tied to scroll position. Framer Motion drives these
 * MotionValues from its own frame loop, so nothing here re-renders React
 * while scrolling.
 */

type ScrollOffset = NonNullable<UseScrollOptions["offset"]>;

/** Named progress ranges for `useSectionProgress`. */
export const SCROLL_RANGES = {
  /** 0 as the section's top enters at the bottom → 1 as its bottom leaves at the top. */
  through: ["start end", "end start"],
  /** 0 as it enters at the bottom → 1 when its top reaches the top of the screen. */
  enter: ["start end", "start start"],
  /** 0 when its top reaches the top → 1 when its bottom reaches the bottom (tall/sticky scenes). */
  cover: ["start start", "end end"],
  /** 0 when its bottom reaches the bottom → 1 as it leaves at the top. */
  exit: ["end end", "end start"],
  /** 0 as it enters → 1 when its centre reaches the centre of the screen. */
  center: ["start end", "center center"],
} satisfies Record<string, ScrollOffset>;

export type ScrollRange = keyof typeof SCROLL_RANGES;

/**
 * Scroll progress (0 → 1) of a section through the screen, as a MotionValue.
 * Pass a named range or a Framer offset array (keep custom arrays stable —
 * define them outside the component).
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  range: ScrollRange | ScrollOffset = "through"
): MotionValue<number> {
  const offset = typeof range === "string" ? SCROLL_RANGES[range] : range;
  return useScroll({ target: ref, offset }).scrollYProgress;
}

export interface ParallaxOptions {
  /**
   * Fraction of `motionSettings.parallaxStrength`. Positive moves the
   * element up faster than the page (it feels closer); negative makes it lag
   * behind (it feels further away — right for an image inside its frame).
   */
  speed?: number;
  /** Exact travel in px, instead of `speed`. Same sign convention. */
  distance?: number;
  disabled?: boolean;
}

/**
 * Whether depth effects (parallax, drift) should run for this visitor.
 * Always false in the prerendered HTML and the hydration render — the
 * scroll position isn't known there, so offsets start at 0 and take over
 * in the browser's first frame.
 */
export function useDepthEnabled(disabled = false): boolean {
  const reduced = useReducedMotionSafe();
  const hydrated = useHydrated();
  return motionSettings.depthEnabled && hydrated && !reduced && !disabled;
}

/**
 * A px offset that moves from +travel to −travel as the element passes
 * through the screen (0 at the moment it's centred). Stays 0 with reduced
 * motion; scaled by `touchParallaxScale` on touch screens.
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  { speed = 0.2, distance, disabled = false }: ParallaxOptions = {}
): MotionValue<number> {
  const enabled = useDepthEnabled(disabled);
  const coarse = useCoarsePointer();
  const progress = useSectionProgress(ref, "through");
  const base = distance ?? speed * motionSettings.parallaxStrength;
  const travel = enabled ? base * (coarse ? motionSettings.touchParallaxScale : 1) : 0;
  return useTransform(progress, (p) => (0.5 - p) * 2 * travel);
}
