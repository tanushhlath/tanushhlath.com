import { motion, type MotionProps } from "framer-motion";
import type { HTMLAttributes } from "react";

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
