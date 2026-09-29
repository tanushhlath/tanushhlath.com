import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { motionSettings } from "./tokens";
import { observeViewport } from "./viewport";

export interface MarqueeProps {
  children: ReactNode;
  /** Seconds for one full loop (longer = slower). Default `motionSettings.marqueeDuration`. */
  duration?: number;
  /** Which way the row travels. Default "left". */
  direction?: "left" | "right";
  /** Space between items and between the two copies, any CSS length. Default "2.5rem". */
  gap?: string;
  /** Pause while the pointer is over it or keyboard focus is inside. Default true. */
  pauseOnHover?: boolean;
  /** Accessible name for the row (it's rendered as a labelled group). */
  label?: string;
  className?: string;
  /** Classes for each of the two tracks (the flex rows holding the children). */
  trackClassName?: string;
  style?: CSSProperties;
}

/**
 * A slow, endless horizontal drift of a row of items — for ambient bands
 * (interests, tags, logos), never for anything the visitor has to read in
 * order. Pure CSS animation on a transform, so it runs on the compositor;
 * it only runs while on screen and pauses on hover/focus. The second copy
 * that makes the loop seamless is hidden from assistive tech and from
 * keyboard focus. Reduced motion: no movement — the row becomes a plain
 * horizontally scrollable strip.
 *
 * For a sideways slide tied to scroll position instead, use `<Drift>`.
 */
export function Marquee({
  children,
  duration = motionSettings.marqueeDuration,
  direction = "left",
  gap = "2.5rem",
  pauseOnHover = true,
  label,
  className,
  trackClassName,
  style,
}: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Run only while on screen. Written straight to the DOM: no re-renders.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeViewport(
      el,
      (phase) => {
        el.dataset.running = String(phase === "inside");
      },
      0
    );
  }, []);

  const vars = {
    ...style,
    "--marquee-duration": `${Math.max(1, duration)}s`,
    "--marquee-gap": gap,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn("marquee", pauseOnHover && "marquee--pausable", className)}
      data-direction={direction}
      data-running="false"
      style={vars}
    >
      <div className={cn("marquee__track", trackClassName)}>{children}</div>
      <div className={cn("marquee__track", trackClassName)} aria-hidden="true" inert>
        {children}
      </div>
    </div>
  );
}
