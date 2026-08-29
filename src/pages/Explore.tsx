import { Meta } from "@/lib/Meta";
import { pageMeta } from "@/pageMeta";
import { PageHero } from "@/components/ui/PageHero";
import { ExploreView } from "@/components/explore/ExploreView";

export default function ExplorePage() {
  return (
    <>
      <Meta title={pageMeta.explore.title} description={pageMeta.explore.description} />
      <PageHero
        kicker="Explore"
        title="A different way in"
        intro="Instead of a menu, pick a lens. The site pulls together whatever's relevant from projects, experiences, achievements, and everywhere else."
      />
      <div className="px-5 sm:px-8 pb-32">
        <div className="mx-auto max-w-5xl">
          <ExploreView />
        </div>
      </div>
    </>
  );
}
