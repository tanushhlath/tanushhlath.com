"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LabIdea, LabStatus } from "@/types/content";
import { FilterBar } from "@/components/ui/FilterBar";
import { cn } from "@/lib/cn";

const statusStyle: Record<LabStatus, string> = {
  idea: "text-paper-faint border-ink-line",
  exploring: "text-azure-soft border-azure-soft/40",
  building: "text-azure-soft border-azure-soft/40",
  testing: "text-ember border-ember/40",
  paused: "text-paper-faint border-ink-line",
  done: "text-paper-dim border-ink-line-strong",
};

export function LabView({ ideas }: { ideas: LabIdea[] }) {
  const [filter, setFilter] = useState<"all" | LabStatus>("all");
  const statuses = Array.from(new Set(ideas.map((i) => i.status))) as LabStatus[];
  const filtered = filter === "all" ? ideas : ideas.filter((i) => i.status === filter);

  return (
    <div>
      <FilterBar
        active={filter}
        onChange={(v) => setFilter(v as "all" | LabStatus)}
        options={[
          { value: "all", label: "All" },
          ...statuses.map((s) => ({ value: s, label: s })),
        ]}
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {filtered.map((idea, i) => (
          <motion.div
            layout
            key={idea.id}
            initial={{ opacity: 0, y: 10, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
            whileHover={{ rotate: 0, y: -2 }}
            transition={{ duration: 0.25 }}
            className="relative rounded-lg border border-dashed border-ink-line-strong bg-ink-raised/30 p-6"
          >
            <span className="absolute -top-1.5 left-6 h-3 w-3 rounded-full bg-ember/70" aria-hidden />
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs capitalize",
                  statusStyle[idea.status]
                )}
              >
                {idea.status}
              </span>
              <span className="text-xs text-paper-faint">{idea.year}</span>
            </div>
            <p className="mt-4 font-display italic text-xl text-paper">{idea.title}</p>
            <p className="mt-2 text-sm text-paper-dim">{idea.summary}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
