import { createElement, useContext, useMemo, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import type { MotionStyle } from "framer-motion";
import { StaggerContext, createStaggerGroup, type StaggerSettings } from "./staggerGroup";
import { MOTION_TAGS, type MotionPassThrough, type MotionTagName } from "./tags";
import { motionSettings } from "./tokens";
import { useReveal } from "./useReveal";
import { entranceDelay, revealVariants, type RevealVariant } from "./variants";

export interface StaggerProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "className" | "style" | "id"> {
  children?: ReactNode;
  as?: MotionTagName;
  /** Seconds between items entering together. Default `motionSettings.staggerGap`. */
  gap?: number;
  /** Variant for every item (an item can override it). Default "rise". */
  variant?: RevealVariant;
  /** Seconds before the first item of each batch. */
  delay?: number;
  /** Reveal line for the items; default `motionSettings.revealOffset`. */
  amount?: number;
  duration?: number;
  distance?: number;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * A reversible, staggered group. The container itself doesn't animate — each
 * `<StaggerItem>` inside reveals when it reaches the reveal line, and items
 * arriving together (a row, the first screen) cascade in document order.
 */
export function Stagger({
  children,
  as = "div",
  gap = motionSettings.staggerGap,
  variant = "rise",
  delay = 0,
  amount,
  duration,
  distance,
  ...rest
}: StaggerProps) {
  const group = useMemo(() => createStaggerGroup(gap), [gap]);
  const settings = useMemo<StaggerSettings>(
    () => ({ group, variant, delay, amount, duration, distance }),
    [group, variant, delay, amount, duration, distance]
  );
  return (
    <StaggerContext.Provider value={settings}>
      {createElement(as, { ...rest, "data-stagger": "" }, children)}
    </StaggerContext.Provider>
  );
}

export interface StaggerItemProps extends MotionPassThrough {
  children?: ReactNode;
  as?: MotionTagName;
  /** Override the group's variant for this item. */
  variant?: RevealVariant;
  id?: string;
  className?: string;
  style?: MotionStyle;
  /** Render visible and still. */
  disabled?: boolean;
}

/** One item of a `<Stagger>`. Outside a group it behaves like `<Reveal>`. */
export function StaggerItem({ children, as = "div", variant, disabled = false, ...rest }: StaggerItemProps) {
  const settings = useContext(StaggerContext);
  const ref = useRef<HTMLDivElement>(null);
  const { state, label, reduced, active } = useReveal(ref, {
    amount: settings?.amount,
    disabled,
    group: settings?.group,
  });
  const delay = entranceDelay((settings?.delay ?? 0) + state.staggerDelay, state);
  const resolvedVariant = variant ?? settings?.variant ?? "rise";
  const duration = settings?.duration;
  const distance = settings?.distance;
  const variants = useMemo(
    () => revealVariants(resolvedVariant, { delay, duration, distance, reduced }),
    [resolvedVariant, delay, duration, distance, reduced]
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
