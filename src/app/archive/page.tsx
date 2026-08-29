import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ArchiveView } from "@/components/archive/ArchiveView";
import { getArchive } from "@/lib/content";

export const metadata: Metadata = {
  title: "Archive",
  description: "Everything, organized — every project, experience, achievement, and story moment in one filterable list.",
};

export default function ArchivePage() {
  const entries = getArchive();
  return (
    <>
      <PageHero
        kicker="Archive"
        title="Everything, organized"
        intro="The featured pages show what matters most. This shows all of it — filter by type or year to find something specific."
      />
      <div className="px-5 sm:px-8 pb-32">
        <div className="mx-auto max-w-4xl">
          <ArchiveView entries={entries} />
        </div>
      </div>
    </>
  );
}
