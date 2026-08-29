import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { TimelineView } from "@/components/story/TimelineView";
import { ContinueThread } from "@/components/ui/ContinueThread";
import { getProjectById, timeline } from "@/lib/content";

export const metadata: Metadata = {
  title: "My Story",
  description: "How I got here — the stages, turning points, and moments that shaped who I am.",
};

export default function StoryPage() {
  const chronological = [...timeline].sort((a, b) => a.year - b.year);

  const latest = [...chronological].reverse().find((e) => e.relatedProjects?.length);
  const latestProject = latest?.relatedProjects?.[0]
    ? getProjectById(latest.relatedProjects[0])
    : undefined;

  return (
    <>
      <PageHero
        kicker="My story"
        title="How I got here"
        intro="Not a résumé timeline — the actual shape of it, including the parts that didn't look like progress at the time. Click any moment for the fuller version."
      />
      <div className="px-5 sm:px-8 pb-16">
        <div className="mx-auto max-w-3xl">
          <TimelineView events={chronological} />
        </div>
      </div>
      {latestProject && (
        <ContinueThread
          threads={[
            { lead: "This is where the story led", title: latestProject.title, href: `/work/${latestProject.slug}` },
          ]}
        />
      )}
    </>
  );
}
