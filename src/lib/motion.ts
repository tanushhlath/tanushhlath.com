import type { Transition, Variants } from "framer-motion";

/**
 * MOTION LANGUAGE
 *
 * One shared vocabulary so every section animates consistently instead of
 * each component inventing its own timing. Framer Motion already respects
 * `prefers-reduced-motion` for whileInView/animate transforms when paired
 * with the `useReducedMotion` hook — components that need to branch
 * manually should use that hook rather than hard-coding motion.
 */

export const EASE_ENTER: Transition["ease"] = [0.16, 1, 0.3, 1];
export const EASE_STANDARD: Transition["ease"] = [0.22, 1, 0.36, 1];
/** Reserved for Tier 4 — cinematic, memorable, never more than one at once. */
export const EASE_CINEMATIC: Transition["ease"] = [0.6, 0.02, 0.15, 1];

export const DUR = {
  fast: 0.18,
  base: 0.42,
  slow: 0.72,
  cinematic: 1.1,
};

/** Enter: content gently reveals into view. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE_ENTER },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.base, ease: EASE_STANDARD } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.base, ease: EASE_ENTER },
  },
};

/** Stagger container for lists of reveals. */
export function staggerContainer(stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

export const viewportOnce = { once: true, margin: "-80px 0px -80px 0px" };
