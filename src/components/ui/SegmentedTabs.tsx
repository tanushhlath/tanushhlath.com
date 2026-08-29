"use client";

import { cn } from "@/lib/cn";

export interface TabOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * The lens switcher used by /work (Built/Did/Recognized) and /beyond
 * (Now/Next/Lab) — one shared control so the *mechanism* of switching
 * feels consistent, even though what each tab reveals looks nothing
 * alike. Larger and more editorial than the archive's FilterBar; this is
 * choosing a lens, not filtering a list.
 */
export function SegmentedTabs({
  options,
  active,
  onChange,
}: {
  options: TabOption[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3" role="tablist">
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            data-cursor="view"
            data-cursor-label="Switch"
            className={cn(
              "group rounded-full border px-5 py-2.5 text-left transition-colors duration-200 cursor-pointer",
              isActive
                ? "border-azure bg-azure text-white"
                : "border-ink-line text-paper-dim hover:border-azure-soft hover:text-paper"
            )}
          >
            <span className="font-display text-base sm:text-lg">{opt.label}</span>
            {opt.hint && (
              <span
                className={cn(
                  "ml-2 hidden text-xs sm:inline",
                  isActive ? "text-white/70" : "text-paper-faint"
                )}
              >
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
