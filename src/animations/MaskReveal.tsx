import { useMemo, useRef, type ReactNode } from "react";
import { motion, type MotionStyle } from "framer-motion";
import { cn } from "@/lib/cn";
import { MOTION_TAGS, type MotionPassThrough, type MotionTagName } from "./tags";
import { useReveal } from "./useReveal";
import { entranceDelay, maskRevealVariants, type MaskDirection } from "./variants";

export interface MaskRevealProps extends MotionPassThrough {
  children?: ReactNode;
  /**
   * "vertical" (default): wipes up from the bottom edge scrolling down, down
   * from the top scrolling up. "horizontal": left → right, reversed going
   * up. "center": opens outward from the middle.
   */
  direction?: MaskDirection;
  /** Seconds before the wipe (shortened automatically when already on screen at load). */
  delay?: number;
  /** Wipe duration (s). Default `DUR.slow`. */
  duration?: number;
  /** Starting zoom of the content inside the mask; 1 for none. Default `motionSettings.maskZoom`. */
  zoom?: number;
  /** Reveal line; default `motionSettings.revealOffset`. */
  amount?: number;
  as?: MotionTagName;
  id?: string;
  /** Classes for the frame (size it, round it). The inner layer always fills it. */
  className?: string;
  /** Classes for the inner layer that holds the children. */
  contentClassName?: string;
  style?: MotionStyle;
  /** Render visible and still. */
  disabled?: boolean;
}

/**
 * Clip-path image reveal, reversible: a wipe uncovers the content while it
 * settles from a slight zoom, closes again (downward) when you scroll back
 * up past it, and wipes in from the top when it re-enters from above. The
 * outer frame is what gets observed and never changes shape; the wipe and
 * zoom run on the inner layer, and the frame crops them. Built for images
 * and media blocks:
 *
 *   <MaskReveal className="aspect-[4/3] rounded-2xl">
 *     <ProtectedImage image={cover} className="h-full w-full" />
 *   </MaskReveal>
 *
 * Only clip-path, transform and opacity animate. Reduced motion → a short fade.
 */
export function MaskReveal({
  children,
  direction = "vertical",
  delay = 0,
  duration,
  zoom,
  amount,
  as = "div",
  disabled = false,
  className,
  contentClassName,
  ...rest
}: MaskRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { state, label, reduced, active } = useReveal(ref, { amount, disabled });
  const effectiveDelay = entranceDelay(delay, state);
  const { frame, content } = useMemo(
    () => maskRevealVariants(direction, { delay: effectiveDelay, duration, zoom, reduced }),
    [direction, effectiveDelay, duration, zoom, reduced]
  );
  const initial = active ? "below" : false;
  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      {...rest}
      ref={ref}
      className={cn("mask-reveal", className)}
      data-reveal={label}
      initial={initial}
      animate={label}
      variants={frame}
    >
      <motion.div
        className={cn("mask-reveal__content", contentClassName)}
        data-reveal=""
        initial={initial}
        animate={label}
        variants={content}
      >
        {children}
      </motion.div>
    </Tag>
  );
}
