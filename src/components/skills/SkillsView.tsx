"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skill } from "@/types/content";
import { getSkillEvidence } from "@/lib/content";
import { cn } from "@/lib/cn";

const categoryLabel: Record<string, string> = {
  technical: "Technical",
  creative: "Creative",
  leadership: "Leadership",
  communication: "Communication",
  analytical: "Analytical",
};

export function SkillsView({ skills }: { skills: Skill[] }) {
  const [openId, setOpenId] = useState<string | null>(skills[0]?.id ?? null);

  return (
    <div className="divide-y divide-ink-line border-t border-ink-line">
      {skills.map((skill) => {
        const open = openId === skill.id;
        const evidence = getSkillEvidence(skill);
        const hasEvidence =
          evidence.projects.length + evidence.experiences.length + evidence.achievements.length >
          0;

        const evidenceCount =
          evidence.projects.length + evidence.experiences.length + evidence.achievements.length;

        return (
          <div key={skill.id} className="relative pl-6">
            <motion.span
              aria-hidden
              initial={false}
              animate={{ scaleY: open ? 1 : 0, opacity: open ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "top" }}
              className="absolute left-0 top-6 bottom-0 w-px bg-azure-soft"
            />
            <button
              type="button"
              onClick={() => setOpenId(open ? null : skill.id)}
              aria-expanded={open}
              data-cursor="view"
              data-cursor-label={open ? "Close" : "See proof"}
              className="flex w-full items-center justify-between gap-4 py-6 text-left cursor-pointer"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-paper-faint">
                  {categoryLabel[skill.category]}
                </p>
                <p
                  className={cn(
                    "mt-1 font-display text-2xl sm:text-3xl transition-colors duration-200",
                    open ? "text-azure-soft" : "text-paper"
                  )}
                >
                  {skill.name}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-3">
                {evidenceCount > 0 && (
                  <span className="text-xs text-paper-faint">
                    {evidenceCount} {evidenceCount === 1 ? "proof point" : "proof points"}
                  </span>
                )}
                <span
                  className={cn(
                    "text-2xl text-paper-dim transition-transform duration-300",
                    open && "rotate-45"
                  )}
                >
                  +
                </span>
              </span>
            </button>

            {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-8">
                    <p className="max-w-2xl text-paper-dim">{skill.blurb}</p>

                    {hasEvidence ? (
                      <div className="mt-6 grid gap-6 sm:grid-cols-3">
                        {evidence.projects.length > 0 && (
                          <div>
                            <p className="text-sm text-paper-faint">Projects</p>
                            <ul className="mt-2 space-y-1">
                              {evidence.projects.map((p, i) => (
                                <motion.li
                                  key={p.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 + i * 0.05 }}
                                >
                                  <Link
                                    href={`/work/${p.slug}`}
                                    className="text-azure-soft hover:text-azure transition-colors"
                                  >
                                    {p.title}
                                  </Link>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evidence.experiences.length > 0 && (
                          <div>
                            <p className="text-sm text-paper-faint">Experiences</p>
                            <ul className="mt-2 space-y-1">
                              {evidence.experiences.map((e, i) => (
                                <motion.li
                                  key={e.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 + i * 0.05 }}
                                >
                                  <Link
                                    href={`/work/${e.slug}`}
                                    className="text-azure-soft hover:text-azure transition-colors"
                                  >
                                    {e.title}
                                  </Link>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evidence.achievements.length > 0 && (
                          <div>
                            <p className="text-sm text-paper-faint">Achievements</p>
                            <ul className="mt-2 space-y-1">
                              {evidence.achievements.map((a, i) => (
                                <motion.li
                                  key={a.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.1 + i * 0.05 }}
                                >
                                  <Link
                                    href={`/work?tab=recognized#${a.slug}`}
                                    className="text-azure-soft hover:text-azure transition-colors"
                                  >
                                    {a.title}
                                  </Link>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-paper-faint">No evidence linked yet.</p>
                    )}
                  </div>
                </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
