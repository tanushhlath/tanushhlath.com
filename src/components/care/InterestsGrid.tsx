import { useState } from "react";
import Link from "@/lib/Link";
import { motion } from "framer-motion";
import { Interest } from "@/types/content";
import { resolveExperiences, resolveProjects } from "@/lib/content";

export function InterestsGrid({ interests }: { interests: Interest[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = interests.find((i) => i.id === activeId);
  const evidence = active
    ? {
        projects: resolveProjects(active.relatedProjects),
        experiences: resolveExperiences(active.relatedExperiences),
      }
    : null;

  const categories = Array.from(new Set(interests.map((i) => i.category)));

  return (
    <div>
      {categories.map((category) => (
        <div key={category} className="mb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-paper-dim">{category}</p>
          <div className="flex flex-wrap gap-3">
            {interests
              .filter((i) => i.category === category)
              .map((interest) => (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => setActiveId(interest.id)}
                  className="rounded-full border border-ink-line px-5 py-2.5 text-paper transition-colors duration-150 hover:border-azure-soft hover:text-azure-soft cursor-pointer"
                >
                  {interest.title}
                </button>
              ))}
          </div>
        </div>
      ))}

      {active && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setActiveId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl border border-ink-line bg-ink-raised p-8"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-azure-soft">
                {active.category}
              </p>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl text-paper">{active.title}</h3>
              <p className="mt-4 text-paper-dim">{active.note}</p>

              {evidence && (evidence.projects.length > 0 || evidence.experiences.length > 0) && (
                <div className="mt-6 flex flex-wrap gap-4 border-t border-ink-line pt-4 text-sm">
                  {evidence.projects.map((p) => (
                    <Link key={p.id} href={`/work/${p.slug}`} className="text-azure-soft hover:text-azure">
                      See: {p.title} →
                    </Link>
                  ))}
                  {evidence.experiences.map((e) => (
                    <Link key={e.id} href={`/work/${e.slug}`} className="text-azure-soft hover:text-azure">
                      See: {e.title} →
                    </Link>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="mt-6 text-sm text-paper-faint hover:text-paper transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
    </div>
  );
}
