import { isMotionValue, motion, type MotionProps, type MotionStyle } from "framer-motion";
import type { CSSProperties, HTMLAttributes } from "react";

/** Elements the motion components can render as (`as` prop). */
export type MotionTagName =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "nav"
  | "main"
  | "figure"
  | "figcaption"
  | "blockquote"
  | "ul"
  | "ol"
  | "li"
  | "dl"
  | "dt"
  | "dd"
  | "p"
  | "span"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

/**
 * Ordinary HTML attributes (aria-*, role, title, event handlers, tabIndex…)
 * forwarded to the rendered element. Names Framer Motion reserves for
 * itself (onAnimationStart, onDrag…) are left out.
 */
export type MotionPassThrough = Omit<HTMLAttributes<HTMLElement>, keyof MotionProps | "children" | "className" | "id">;

/**
 * Ordinary HTML attributes (aria-*, role, title, event handlers, tabIndex…)
 * forwarded to the element of a CSS-driven reveal (`<Reveal>`,
 * `<StaggerItem>`, `<MaskReveal>`), which renders a plain element.
 */
export type ElementPassThrough = Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "id" | "style">;

/**
 * `style` of a CSS-driven reveal: plain CSS. A MotionStyle is accepted too,
 * so call sites written for the earlier Framer-based reveals keep
 * type-checking, but motion values in it are left out — a reveal renders a
 * plain element and can't bind them (put those on a motion element inside).
 */
export type RevealStyle = CSSProperties | MotionStyle;

/** The plain CSS of a RevealStyle (motion values removed). */
export function plainStyle(style: RevealStyle | undefined): CSSProperties | undefined {
  if (!style) return undefined;
  let plain: Record<string, unknown> | undefined;
  for (const [key, value] of Object.entries(style)) {
    if (!isMotionValue(value)) continue;
    plain ??= { ...style };
    delete plain[key];
  }
  return (plain ?? style) as CSSProperties;
}

type MotionDiv = typeof motion.div;

/**
 * One motion component per tag name, created once at module load, so
 * `MOTION_TAGS[as]` is the same component on every render (switching `as`
 * remounts, as it should). Typed as `motion.div` so all tags share one prop
 * shape.
 */
export const MOTION_TAGS: Readonly<Record<MotionTagName, MotionDiv>> = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  aside: motion.aside,
  header: motion.header,
  footer: motion.footer,
  nav: motion.nav,
  main: motion.main,
  figure: motion.figure,
  figcaption: motion.figcaption,
  blockquote: motion.blockquote,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
  dl: motion.dl,
  dt: motion.dt,
  dd: motion.dd,
  p: motion.p,
  span: motion.span,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  h5: motion.h5,
  h6: motion.h6,
} as unknown as Record<MotionTagName, MotionDiv>;
