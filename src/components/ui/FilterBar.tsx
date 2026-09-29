import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { SPRING, useReducedMotionSafe } from "@/animations";
import { cn } from "@/lib/cn";
import { moveRovingFocus } from "./rovingFocus";

/**
 * One filter. Give it a `value`, or pass the query API's filter options
 * straight through — they carry an `id` instead:
 *   options={[{ value: "all", label: "All", count: total }, ...getEventFilters()]}
 */
export type FilterBarOption = {
  label: string;
  /** Shorter label used on small screens (the taxonomy's `short`). */
  short?: string;
  /** Number of matching items, shown after the label. */
  count?: number;
  /** Tooltip / longer description. */
  title?: string;
} & ({ value: string; id?: never } | { id: string; value?: never });

export interface FilterBarProps {
  options: FilterBarOption[];
  /** The selected option's value (or id). */
  active: string;
  onChange: (value: string) => void;
  /** Accessible name for the group. Default "Filter". */
  label?: string;
  /**
   * "wrap" (default) flows onto several lines; "scroll" keeps one line
   * that scrolls sideways on narrow screens (the active chip is kept in
   * view).
   */
  layout?: "wrap" | "scroll";
  size?: "sm" | "md";
  id?: string;
  className?: string;
}

const optionValue = (option: FilterBarOption) => (option.value ?? option.id) as string;

/**
 * Single-choice filter chips. The active chip is marked by a pill that
 * glides between options (a shared layout animation), counts sit beside
 * the labels, and the row is one Tab stop: ←/→/Home/End move between
 * chips, Enter/Space choose. Each chip is a real toggle button
 * (aria-pressed), so assistive tech reads "Leadership, 6, pressed".
 */
export function FilterBar({
  options,
  active,
  onChange,
  label = "Filter",
  layout = "wrap",
  size = "md",
  id,
  className,
}: FilterBarProps) {
  const groupId = useId();
  const reduced = useReducedMotionSafe();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => optionValue(o) === active)
  );

  // Scroll layout: keep the active chip visible inside the strip (never scrolls the page).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (layout !== "scroll" || !scroller) return;
    const chip = scroller.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!chip) return;
    const left = chip.offsetLeft - scroller.clientWidth / 2 + chip.offsetWidth / 2;
    scroller.scrollTo({ left: Math.max(0, left), behavior: reduced ? "auto" : "smooth" });
  }, [active, layout, reduced]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    moveRovingFocus(event);
  };

  return (
    <LayoutGroup id={groupId}>
      <motion.div
        ref={scrollerRef}
        id={id}
        role="toolbar"
        aria-label={label}
        aria-orientation="horizontal"
        layoutScroll={layout === "scroll"}
        onKeyDown={onKeyDown}
        className={cn("filter-bar", `filter-bar--${layout}`, `filter-bar--${size}`, className)}
      >
        {options.map((option, index) => {
          const value = optionValue(option);
          const isActive = index === activeIndex;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              tabIndex={isActive ? 0 : -1}
              title={option.title}
              onClick={() => {
                if (!isActive) onChange(value);
              }}
              className="filter-bar__chip"
              data-cursor="view"
              data-cursor-label="Filter"
            >
              {isActive && (
                <motion.span
                  layoutId="filter-pill"
                  className="filter-bar__pill"
                  aria-hidden="true"
                  transition={reduced ? { duration: 0 } : { type: "spring", ...SPRING.snappy }}
                />
              )}
              <span className="filter-bar__text">
                {option.short ? (
                  <>
                    <span className="filter-bar__label filter-bar__label--full">{option.label}</span>
                    <span className="filter-bar__label filter-bar__label--short" aria-hidden="true">
                      {option.short}
                    </span>
                  </>
                ) : (
                  <span className="filter-bar__label">{option.label}</span>
                )}
                {option.count !== undefined && (
                  <span className="filter-bar__count">
                    <span className="sr-only">, </span>
                    {option.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
}
