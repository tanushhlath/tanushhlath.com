import { Hero } from "@/components/home/Hero";
import { Snapshot } from "@/components/home/Snapshot";
import { DefiningThings } from "@/components/home/DefiningThings";
import { CurrentStatus } from "@/components/home/CurrentStatus";
import { FeaturedWork } from "@/components/home/FeaturedWork";
import { PersonalGlimpse } from "@/components/home/PersonalGlimpse";
import { JourneyPreview } from "@/components/home/JourneyPreview";
import { FinalInvitation } from "@/components/home/FinalInvitation";

export default function Home() {
  return (
    <>
      <Hero />
      <Snapshot />
      <DefiningThings />
      <CurrentStatus />
      <FeaturedWork />
      <PersonalGlimpse />
      <JourneyPreview />
      <FinalInvitation />
    </>
  );
}
