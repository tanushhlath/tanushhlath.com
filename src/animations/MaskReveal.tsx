import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { plainStyle, type ElementPassThrough, type MotionTagName, type RevealStyle } from "./tags";
import { useClipExitFromRest, useReveal, useRevealSettled } from "./useReveal";
import { entranceDelay, maskOpenClip, maskRevealSettleMs, maskRevealStyles, type MaskDirection } from "./variants";

export interface MaskRevealProps extends ElementPassThrough {
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
  /** CSS for the frame (plain values). */
  style?: RevealStyle;
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
 * Only clip-path, transform and opacity change, as CSS transitions between
 * inline poses (see variants.ts). Reduced motion → a short fade.
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
  style,
  ...rest
}: MaskRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { state, label, reduced, active, pristine } = useReveal(ref, { amount, disabled });
  const timing = { delay: entranceDelay(delay, state), duration, zoom, reduced, pristine };
  const settled = useRevealSettled(state, label, maskRevealSettleMs(timing), active);
  useClipExitFromRest(contentRef, label, settled, active ? maskOpenClip(direction, reduced) : null);
  useLoadImagesAhead(ref, active);
  const { frame, content } = active ? maskRevealStyles(direction, label, { ...timing, settled }) : {};
  // Every allowed tag takes the same attributes; typed as one of them.
  const Tag = as as "div";

  return (
    <Tag
      {...rest}
      ref={ref}
      className={cn("mask-reveal", className)}
      data-reveal={label}
      style={frame ? { ...plainStyle(style), ...frame } : plainStyle(style)}
    >
      <div ref={contentRef} className={cn("mask-reveal__content", contentClassName)} data-reveal="" style={content}>
        {children}
      </div>
    </Tag>
  );
}

/**
 * The closed wipe clips the content to nothing, and the browser's lazy
 * loading treats clipped-away images as not visible — so a photo inside
 * would only start loading once the wipe had finished, and the card would
 * open empty. Start loading them as the frame (never clipped) comes within
 * a screen of the viewport instead.
 */
function useLoadImagesAhead(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
          img.loading = "eager";
        });
        io.disconnect();
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);
}
