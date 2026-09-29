import { useId, type KeyboardEvent } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { SPRING, useReducedMotionSafe } from "@/animations";
import { cn } from "@/lib/cn";
import { moveRovingFocus } from "./rovingFocus";

export interface TabOption {
  value: string;
  label: string;
  /** Short description shown next to (pill) or under (editorial) the label. */
  hint?: string;
  /** Number of items behind the tab. */
  count?: number;
  /** Small index before the label, e.g. "01". */
  index?: string;
}

export interface SegmentedTabsProps {
  options: TabOption[];
  active: string;
  onChange: (value: string) => void;
  /** Accessible name of the tab list, e.g. "Work lenses". */
  label?: string;
  /**
   * Links each tab to its panel: tab ids become `${idPrefix}-tab-${value}`
   * and the selected tab's `aria-controls` points at `${idPrefix}-panel-${value}` (only the
   * selected panel is rendered). Give the
   * panel the matching attributes with `tabPanelProps(idPrefix, value)` (./tabPanelProps).
   */
  idPrefix?: string;
  /**
   * "pill" (default) — compact segmented control, the indicator is a filled pill.
   * "editorial" — large serif labels with hints underneath, the indicator is a rule.
   */
  variant?: "pill" | "editorial";
  className?: string;
}

/**
 * The lens switcher used by /work (Built/Did/Recognized/All) and /beyond
 * (Now/Next/Lab) — one shared control so the *mechanism* of switching
 * feels consistent, even though what each tab reveals looks nothing
 * alike. Larger and more editorial than FilterBar: this is choosing a
 * lens, not filtering a list.
 *
 * A real WAI-ARIA tab list: one Tab stop, ←/→/Home/End move between tabs
 * and select them (automatic activation), the indicator glides to the
 * selected tab.
 */
export function SegmentedTabs({
  options,
  active,
  onChange,
  label,
  idPrefix,
  variant = "pill",
  className,
}: SegmentedTabsProps) {
  const groupId = useId();
  const reduced = useReducedMotionSafe();
  // The tab in the Tab order: the selected one (or the first, if none matches).
  const focusIndex = Math.max(
    0,
    options.findIndex((o) => o.value === active)
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = moveRovingFocus(event, '[role="tab"]');
    const value = target?.dataset.value;
    if (value && value !== active) onChange(value);
  };

  return (
    <LayoutGroup id={groupId}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className={cn("seg-tabs", `seg-tabs--${variant}`, className)}
      >
        {options.map((option, index) => {
          const isActive = option.value === active;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              id={idPrefix ? `${idPrefix}-tab-${option.value}` : undefined}
              aria-controls={idPrefix && isActive ? `${idPrefix}-panel-${option.value}` : undefined}
              aria-selected={isActive}
              tabIndex={index === focusIndex ? 0 : -1}
              data-value={option.value}
              onClick={() => {
                if (!isActive) onChange(option.value);
              }}
              className="seg-tabs__tab"
              data-cursor="view"
              data-cursor-label="Switch"
            >
              {isActive && (
                <motion.span
                  layoutId="seg-indicator"
                  className="seg-tabs__indicator"
                  aria-hidden="true"
                  transition={reduced ? { duration: 0 } : { type: "spring", ...SPRING.snappy }}
                />
              )}
              <span className="seg-tabs__main">
                {option.index && (
                  <span className="seg-tabs__index" aria-hidden="true">
                    {option.index}
                  </span>
                )}
                <span className="seg-tabs__label font-display">{option.label}</span>
                {option.count !== undefined && (
                  <span className="seg-tabs__count">
                    <span className="sr-only">, </span>
                    {option.count}
                  </span>
                )}
              </span>
              {option.hint && (
                <span className="seg-tabs__hint">
                  <span className="sr-only">: </span>
                  {option.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
