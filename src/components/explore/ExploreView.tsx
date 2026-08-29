"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ExploreLensKey, getLens, getRandomArchiveEntry } from "@/lib/content";
import { ProjectCard } from "@/components/work/ProjectCard";
import { ExperienceRow } from "@/components/do/ExperienceCard";
import { Magnetic } from "@/components/ui/Magnetic";
import { cn } from "@/lib/cn";

const lenses: { key: ExploreLensKey; label: string }[] = [
  { key: "built", label: "Show me what I've built" },
  { key: "grown", label: "Show me how I've grown" },
  { key: "tried", label: "Show me what I've tried" },
  { key: "care", label: "Show me what I care about" },
  { key: "proud", label: "Show me what I'm proud of" },
];

export function ExploreView() {
  const [active, setActive] = useState<ExploreLensKey>("built");
  const router = useRouter();
  const result = getLens(active);

  function surpriseMe() {
    const entry = getRandomArchiveEntry();
    if (entry?.href) router.push(entry.href);
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {lenses.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setActive(l.key)}
            data-cursor="view"
            data-cursor-label="Show"
            className={cn(
              "group flex items-center gap-4 border-b py-3 text-left transition-colors duration-150 cursor-pointer",
              active === l.key ? "border-azure-soft" : "border-ink-line hover:border-ink-line-strong"
            )}
          >
            <span
              className={cn(
                "font-display text-xl sm:text-2xl transition-colors duration-150",
                active === l.key ? "text-azure-soft" : "text-paper group-hover:text-paper"
              )}
            >
              {l.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <Magnetic>
          <button
            type="button"
            onClick={surpriseMe}
            data-cursor="view"
            data-cursor-label="Go"
            className="rounded-full border border-ember/40 px-5 py-2.5 text-sm text-ember transition-colors duration-150 hover:bg-ember/10 cursor-pointer"
          >
            Surprise me ↗
          </button>
        </Magnetic>
      </div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-12"
        >
          <p className="max-w-lg font-display text-2xl text-paper-dim">{result.headline}</p>

          {result.projects && result.projects.length > 0 && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.18em] text-paper-faint">Projects</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          )}

          {result.timelineEvents && result.timelineEvents.length > 0 && (
            <div className="mt-12">
              <p className="text-xs uppercase tracking-[0.18em] text-paper-faint">Turning points</p>
              <div className="mt-4 space-y-4">
                {result.timelineEvents.map((t) => (
                  <Link
                    key={t.id}
                    href={`/story#${t.id}`}
                    data-cursor="view"
                    data-cursor-label="Read"
                    className="group block border-b border-ink-line py-4"
                  >
                    <span className="text-sm text-azure-soft">{t.year}</span>
                    <p className="font-display text-xl text-paper group-hover:text-azure-soft transition-colors">
                      {t.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {result.experiences && result.experiences.length > 0 && (
            <div className="mt-12">
              <p className="text-xs uppercase tracking-[0.18em] text-paper-faint">Experiences</p>
              <div className="mt-2">
                {result.experiences.map((e) => (
                  <ExperienceRow key={e.id} experience={e} />
                ))}
              </div>
            </div>
          )}

          {result.achievements && result.achievements.length > 0 && (
            <div className="mt-12">
              <p className="text-xs uppercase tracking-[0.18em] text-paper-faint">Achievements</p>
              <div className="mt-4 space-y-4">
                {result.achievements.map((a) => (
                  <Link
                    key={a.id}
                    href={`/work?tab=recognized#${a.slug}`}
                    data-cursor="view"
                    data-cursor-label="Read"
                    className="group block border-b border-ink-line py-4"
                  >
                    <span className="text-sm text-azure-soft">{a.dateLabel ?? a.year}</span>
                    <p className="font-display text-xl text-paper group-hover:text-azure-soft transition-colors">
                      {a.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {result.interests && result.interests.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {result.interests.map((i) => (
                <Link
                  key={i.id}
                  href="/me#care-about"
                  data-cursor="view"
                  data-cursor-label="See"
                  className="rounded-full border border-ink-line px-5 py-2.5 text-paper transition-colors duration-150 hover:border-azure-soft hover:text-azure-soft"
                >
                  {i.title}
                </Link>
              ))}
            </div>
          )}

          {result.labIdeas && result.labIdeas.length > 0 && (
            <div className="mt-12">
              <p className="text-xs uppercase tracking-[0.18em] text-paper-faint">Lab</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {result.labIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    href="/beyond?tab=lab"
                    data-cursor="view"
                    data-cursor-label="See"
                    className="block rounded-2xl border border-dashed border-ink-line p-5 hover:border-azure-soft/50 transition-colors"
                  >
                    <p className="font-display text-lg text-paper">{idea.title}</p>
                    <p className="mt-1 text-sm text-paper-dim">{idea.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
    </div>
  );
}
