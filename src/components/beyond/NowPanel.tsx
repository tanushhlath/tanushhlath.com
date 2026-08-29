import Link from "@/lib/Link";
import { Reveal } from "@/components/motion/Reveal";
import { currently, resolveProjects } from "@/lib/content";

const labelText: Record<string, string> = {
  building: "Building",
  learning: "Learning",
  reading: "Reading",
  exploring: "Exploring",
  goal: "Aiming for",
  challenge: "Wrestling with",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** NOW — clean and alive. A live-feeling list, not a card grid. */
export function NowPanel() {
  const freshestId = [...currently].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id;

  return (
    <div>
      <div className="mb-8 flex items-center gap-2 text-sm text-paper-dim">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-azure opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-azure" />
        </span>
        Live — updated as things change, not on a schedule
      </div>

      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {currently.map((item, i) => {
          const projects = resolveProjects(item.relatedProjects);
          const isFreshest = item.id === freshestId;
          return (
            <Reveal key={item.id} delay={i * 0.04} className="grid gap-2 py-8 sm:grid-cols-[10rem_1fr]">
              <p className="text-sm uppercase tracking-[0.15em] text-azure-soft">
                {labelText[item.label]}
              </p>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xl sm:text-2xl text-paper">{item.value}</p>
                  {isFreshest && (
                    <span className="rounded-full bg-azure-dim px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-azure-soft">
                      Freshest
                    </span>
                  )}
                </div>
                {item.note && <p className="mt-2 text-paper-dim">{item.note}</p>}
                <p className="mt-3 text-xs text-paper-faint">Updated {formatDate(item.updatedAt)}</p>
                {projects.length > 0 && (
                  <div className="mt-2 flex gap-3 text-sm">
                    {projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/work/${p.slug}`}
                        className="text-azure-soft hover:text-azure transition-colors"
                      >
                        {p.title} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
