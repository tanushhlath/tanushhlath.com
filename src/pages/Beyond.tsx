import { Meta } from "@/lib/Meta";
import { pageMeta } from "@/pageMeta";
import { PageHero } from "@/components/ui/PageHero";
import { BeyondView } from "@/components/beyond/BeyondView";
import { byYearDesc, labIdeas } from "@/lib/content";

export default function BeyondPage() {
  return (
    <>
      <Meta title={pageMeta.beyond.title} description={pageMeta.beyond.description} />
      <PageHero
        kicker="Beyond"
        title="What's alive, and what's next"
        intro="Not a repeat of Work — this is the living, forward-looking side of things."
      />
      <div className="px-5 sm:px-8 pb-32">
        <div className="mx-auto max-w-4xl">
          <BeyondView labIdeas={byYearDesc(labIdeas)} />
        </div>
      </div>
    </>
  );
}
