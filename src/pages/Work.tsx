import { Meta } from "@/lib/Meta";
import { pageMeta } from "@/pageMeta";
import { PageHero } from "@/components/ui/PageHero";
import { WorkView } from "@/components/work/WorkView";
import { achievements, byYearDesc, experiences, projects } from "@/lib/content";

export default function WorkPage() {
  return (
    <>
      <Meta title={pageMeta.work.title} description={pageMeta.work.description} />
      <PageHero
        kicker="Work"
        title="What I build, do, and earn"
        intro="Three lenses on the same body of work — pick one, or read them all."
      />
      <div className="px-5 sm:px-8 pb-32">
        <div className="mx-auto max-w-6xl">
          <WorkView
            projects={projects}
            experiences={byYearDesc(experiences)}
            achievements={achievements}
          />
        </div>
      </div>
    </>
  );
}
