import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { WorkView } from "@/components/work/WorkView";
import { achievements, byYearDesc, experiences, projects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "What I've built, where I've shown up, and what it's earned — one place instead of three.",
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        kicker="Work"
        title="What I build, do, and earn"
        intro="Three lenses on the same body of work — pick one, or read them all."
      />
      <div className="px-5 sm:px-8 pb-32">
        <div className="mx-auto max-w-6xl">
          <Suspense>
            <WorkView
              projects={projects}
              experiences={byYearDesc(experiences)}
              achievements={achievements}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
