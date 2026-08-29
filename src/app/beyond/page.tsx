import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { BeyondView } from "@/components/beyond/BeyondView";
import { byYearDesc, labIdeas } from "@/lib/content";

export const metadata: Metadata = {
  title: "Beyond",
  description: "What's happening now, where I'm headed next, and the half-formed ideas in between.",
};

export default function BeyondPage() {
  return (
    <>
      <PageHero
        kicker="Beyond"
        title="What's alive, and what's next"
        intro="Not a repeat of Work — this is the living, forward-looking side of things."
      />
      <div className="px-5 sm:px-8 pb-32">
        <div className="mx-auto max-w-4xl">
          <Suspense>
            <BeyondView labIdeas={byYearDesc(labIdeas)} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
