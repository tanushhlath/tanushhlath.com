import { createElement, useContext, useMemo, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { StaggerContext, createStaggerGroup, type StaggerSettings } from "./staggerGroup";
import { plainStyle, type ElementPassThrough, type MotionTagName, type RevealStyle } from "./tags";
import { motionSettings } from "./tokens";
import { useClipExitFromRest, useReveal, useRevealSettled } from "./useReveal";
import { entranceDelay, revealOpenClip, revealSettleMs, revealStyle, type RevealVariant } from "./variants";

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

export interface StaggerItemProps extends ElementPassThrough {
  children?: ReactNode;
  as?: MotionTagName;
  /** Override the group's variant for this item. */
  variant?: RevealVariant;
  id?: string;
  className?: string;
  /** CSS for the element (plain values; its opacity and transform belong to the reveal). */
  style?: RevealStyle;
  /** Render visible and still. */
  disabled?: boolean;
}

/** One item of a `<Stagger>`. Outside a group it behaves like `<Reveal>`. */
export function StaggerItem({ children, as = "div", variant, disabled = false, style, ...rest }: StaggerItemProps) {
  const settings = useContext(StaggerContext);
  const ref = useRef<HTMLDivElement>(null);
  const { state, label, reduced, active, pristine } = useReveal(ref, {
    amount: settings?.amount,
    disabled,
    group: settings?.group,
  });
  const resolvedVariant = variant ?? settings?.variant ?? "rise";
  const timing = {
    delay: entranceDelay((settings?.delay ?? 0) + state.staggerDelay, state),
    duration: settings?.duration,
    distance: settings?.distance,
    reduced,
    pristine,
  };
  const settled = useRevealSettled(state, label, revealSettleMs(resolvedVariant, timing), active);
  useClipExitFromRest(ref, label, settled, active ? revealOpenClip(resolvedVariant, reduced) : null);
  // Every allowed tag takes the same attributes; typed as one of them.
  const Tag = as as "div";

  return (
    <Tag
      {...rest}
      ref={ref}
      data-reveal={label}
      style={active ? { ...plainStyle(style), ...revealStyle(resolvedVariant, label, { ...timing, settled }) } : plainStyle(style)}
    >
      {children}
    </Tag>
  );
}
