import { useRef, type ReactNode } from "react";
import { plainStyle, type ElementPassThrough, type MotionTagName, type RevealStyle } from "./tags";
import { useClipExitFromRest, useReveal, useRevealSettled } from "./useReveal";
import { entranceDelay, revealOpenClip, revealSettleMs, revealStyle, type RevealVariant } from "./variants";

export interface RevealProps extends ElementPassThrough {
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
  /** CSS for the element (plain values; its opacity and transform belong to the reveal). */
  style?: RevealStyle;
  /** Render visible and still. */
  disabled?: boolean;
}

/**
 * Reversible, direction-aware scroll reveal. Scrolling down it arrives from
 * below; scrolling back up past it, it leaves downward the way it came;
 * re-entering from the top (scrolling up) it drops in from above; every
 * entrance replays. Reduced motion → a short opacity fade only.
 *
 * Renders a plain element: the poses are inline styles and CSS transitions
 * move between them on the compositor (see variants.ts), so a page full of
 * reveals costs no animation work on the main thread.
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
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, label, reduced, active, pristine } = useReveal(ref, { amount, disabled });
  const timing = { delay: entranceDelay(delay, state), duration, distance, reduced, pristine };
  const settled = useRevealSettled(state, label, revealSettleMs(variant, timing), active);
  useClipExitFromRest(ref, label, settled, active ? revealOpenClip(variant, reduced) : null);
  // Every allowed tag takes the same attributes; typed as one of them.
  const Tag = as as "div";

  return (
    <Tag
      {...rest}
      ref={ref}
      data-reveal={label}
      style={active ? { ...plainStyle(style), ...revealStyle(variant, label, { ...timing, settled }) } : plainStyle(style)}
    >
      {children}
    </Tag>
  );
}
