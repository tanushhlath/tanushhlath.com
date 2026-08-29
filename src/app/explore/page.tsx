import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ExploreView } from "@/components/explore/ExploreView";

export const metadata: Metadata = {
  title: "Explore",
  description: "Pick a lens and let the site assemble what's relevant from across everything — or skip the choice entirely.",
};

export default function ExplorePage() {
  return (
    <>
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
