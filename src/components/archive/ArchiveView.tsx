import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArchiveEntry } from "@/lib/content";
import { FilterBar } from "@/components/ui/FilterBar";
import { ArchiveRow } from "@/components/work/ProjectCard";

const kindLabel: Record<string, string> = {
  project: "Project",
  experience: "Experience",
  achievement: "Achievement",
  timeline: "Story moment",
};

type Sort = "newest" | "oldest" | "az";

export function ArchiveView({ entries }: { entries: ArchiveEntry[] }) {
  const [kind, setKind] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<Sort>("newest");

  const years = useMemo(
    () => Array.from(new Set(entries.map((e) => e.year))).sort((a, b) => b - a),
    [entries]
  );
  const kinds = useMemo(() => Array.from(new Set(entries.map((e) => e.kind))), [entries]);

  const filtered = entries
    .filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (year !== "all" && String(e.year) !== year) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      return sort === "newest" ? b.year - a.year : a.year - b.year;
    });

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-paper-faint">Type</p>
          <FilterBar
            active={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "Everything" },
              ...kinds.map((k) => ({ value: k, label: kindLabel[k] })),
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-paper-faint">Year</p>
          <FilterBar
            active={year}
            onChange={setYear}
            options={[
              { value: "all", label: "All years" },
              ...years.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-paper-faint">Sort</p>
          <FilterBar
            active={sort}
            onChange={(v) => setSort(v as Sort)}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "az", label: "A → Z" },
            ]}
          />
        </div>
      </div>

      <p className="mt-8 text-sm text-paper-faint">
        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
      </p>

      <div className="mt-2">
        {filtered.map((entry) => (
          <motion.div
            key={`${entry.kind}-${entry.id}`}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ArchiveRow
              href={entry.href}
              title={entry.title}
              meta={`${kindLabel[entry.kind]} · ${entry.year}`}
            />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-paper-faint">Nothing matches those filters yet.</p>
        )}
      </div>
    </div>
  );
}
