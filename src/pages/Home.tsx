import { Hero } from "@/components/home/Hero";
import { Snapshot } from "@/components/home/Snapshot";
import { DefiningThings } from "@/components/home/DefiningThings";
import { CurrentStatus } from "@/components/home/CurrentStatus";
import { FeaturedWork } from "@/components/home/FeaturedWork";
import { PersonalGlimpse } from "@/components/home/PersonalGlimpse";
import { Curiosities } from "@/components/home/Curiosities";
import { JourneyPreview } from "@/components/home/JourneyPreview";
import { FinalInvitation } from "@/components/home/FinalInvitation";

/**
 * HOME — the entrance. Identity first, then teasers that each open a
 * door deeper into the site; every section has its own transition (see
 * the component files) and all of them reverse when scrolling back up.
 *
 *   hero → who I am → five defining things → right now → work
 *   → a few things about me → curiosities → story → finale
 *
 * All copy: src/content/home.ts and src/content/site.ts.
 * All styles: src/styles/home.css.
 */
export default function Home() {
  return (
    <div className="home">
      <Hero />
      <Snapshot />
      <DefiningThings />
      <CurrentStatus />
      <FeaturedWork />
      <PersonalGlimpse />
      <Curiosities />
      <JourneyPreview />
      <FinalInvitation />
    </div>
  );
}
