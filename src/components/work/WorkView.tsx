"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Achievement, Experience, Project } from "@/types/content";
import { ProjectsGrid } from "@/components/work/ProjectsGrid";
import { ExperiencesView } from "@/components/do/ExperiencesView";
import { AchievementsView } from "@/components/achievements/AchievementsView";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";

type Lens = "built" | "did" | "recognized";

const lenses: { value: Lens; label: string; hint: string }[] = [
  { value: "built", label: "Built", hint: "things I made" },
  { value: "did", label: "Did", hint: "where I showed up" },
  { value: "recognized", label: "Recognized", hint: "what it earned" },
];

export function WorkView({
  projects,
  experiences,
  achievements,
}: {
  projects: Project[];
  experiences: Experience[];
  achievements: Achievement[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab");
  const [lens, setLens] = useState<Lens>(
    initial === "did" || initial === "recognized" ? initial : "built"
  );

  function selectLens(value: string) {
    setLens(value as Lens);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <SegmentedTabs options={lenses} active={lens} onChange={selectLens} />

      <motion.div
        key={lens}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={lens === "built" ? "mt-14" : lens === "did" ? "mt-14" : "mt-12"}
      >
        {lens === "built" && (
          <div>
            <p className="max-w-lg font-display text-2xl text-paper-dim">
              Things I&rsquo;ve made — from a shipped AI product to research projects and websites.
            </p>
            <div className="mt-8">
              <ProjectsGrid projects={projects} />
            </div>
          </div>
        )}

        {lens === "did" && (
          <div>
            <p className="max-w-lg font-display text-2xl text-paper-dim">
              Places I showed up — led, competed, performed, volunteered, contributed.
            </p>
            <div className="mt-8">
              <ExperiencesView experiences={experiences} />
            </div>
          </div>
        )}

        {lens === "recognized" && (
          <div>
            <p className="max-w-lg font-display text-2xl text-paper-dim">
              Recognition and results — each tied back to the work behind it.
            </p>
            <div className="mt-8">
              <AchievementsView achievements={achievements} />
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-20 border-t border-ink-line pt-8 text-center">
        <Link
          href="/archive"
          data-cursor="view"
          data-cursor-label="Open"
          className="text-sm text-paper-dim hover:text-azure-soft transition-colors"
        >
          See the complete, unfiltered record in the archive →
        </Link>
      </div>
    </div>
  );
}
