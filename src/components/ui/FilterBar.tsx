"use client";

import { cn } from "@/lib/cn";

export function FilterBar({
  options,
  active,
  onChange,
}: {
  options: { value: string; label: string }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={active === opt.value}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition-colors duration-150 cursor-pointer",
            active === opt.value
              ? "border-azure bg-azure text-white"
              : "border-ink-line text-paper-dim hover:border-azure-soft hover:text-paper"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
