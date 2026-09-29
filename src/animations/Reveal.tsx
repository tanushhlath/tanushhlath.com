import { useMemo, useRef, type ReactNode } from "react";
import type { MotionStyle } from "framer-motion";
import { MOTION_TAGS, type MotionPassThrough, type MotionTagName } from "./tags";
import { useReveal } from "./useReveal";
import { entranceDelay, revealVariants, type RevealVariant } from "./variants";

export interface RevealProps extends MotionPassThrough {
  children?: ReactNode;
  /** How it arrives. Default "rise". */
  variant?: RevealVariant;
  /** Seconds before the entrance (shortened automatically when already on screen at load). */
  delay?: number;
  /** Entrance duration (s); defaults per variant. */
  duration?: number;
  /** Travel distance (px); default `motionSettings.revealDistance`. */
  distance?: number;
  /** Reveal line as a fraction of screen height from the bottom; default `motionSettings.revealOffset`. */
  amount?: number;
  as?: MotionTagName;
  id?: string;
  className?: string;
  style?: MotionStyle;
  /** Render visible and still. */
  disabled?: boolean;
}

/**
 * Reversible, direction-aware scroll reveal. Scrolling down it arrives from
 * below; scrolling back up past it, it leaves downward the way it came;
 * re-entering from the top (scrolling up) it drops in from above; every
 * entrance replays. Reduced motion → a short opacity fade only.
 */
export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  duration,
  distance,
  amount,
  as = "div",
  disabled = false,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, label, reduced, active } = useReveal(ref, { amount, disabled });
  const effectiveDelay = entranceDelay(delay, state);
  const variants = useMemo(
    () => revealVariants(variant, { delay: effectiveDelay, duration, distance, reduced }),
    [variant, effectiveDelay, duration, distance, reduced]
  );
  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      {...rest}
      ref={ref}
      data-reveal={label}
      initial={active ? "below" : false}
      animate={label}
      variants={variants}
    >
      {children}
    </Tag>
  );
}
