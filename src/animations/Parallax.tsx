import { useRef, type ReactNode } from "react";
import type { MotionStyle } from "framer-motion";
import { useParallax, type ParallaxOptions } from "./scroll";
import { MOTION_TAGS, type MotionPassThrough, type MotionTagName } from "./tags";

export interface ParallaxProps extends ParallaxOptions, MotionPassThrough {
  children?: ReactNode;
  /** "y" (default) for depth, "x" for a sideways drift. */
  axis?: "x" | "y";
  as?: MotionTagName;
  id?: string;
  className?: string;
  style?: MotionStyle;
}

/**
 * Moves its content at a different rate from the page while it scrolls
 * through the screen. Static with reduced motion. Transform-only; the
 * measured position ignores transforms, so there's no feedback loop.
 *
 *   <Parallax speed={-0.15}><img …/></Parallax>   image lags inside its frame
 *   <Parallax speed={0.25}>…</Parallax>           caption floats up faster
 */
export function Parallax({
  children,
  speed,
  distance,
  disabled,
  axis = "y",
  as = "div",
  style,
  ...rest
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const offset = useParallax(ref, { speed, distance, disabled });
  const Tag = MOTION_TAGS[as];
  return (
    <Tag {...rest} ref={ref} style={axis === "x" ? { ...style, x: offset } : { ...style, y: offset }}>
      {children}
    </Tag>
  );
}

export interface DriftProps extends Omit<ParallaxProps, "axis" | "speed"> {
  /** Sideways travel (px) across the pass. Positive drifts left while scrolling down. Default 60. */
  distance?: number;
}

/** Horizontal drift tied to scroll — a slow sideways slide as a band passes. */
export function Drift({ distance = 60, ...props }: DriftProps) {
  return <Parallax {...props} axis="x" distance={distance} />;
}
