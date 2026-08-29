import { site } from "@/content/site";
import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";

export function Snapshot() {
  return (
    <section id="snapshot" className="relative z-10 border-t border-ink-line bg-ink px-5 sm:px-8 py-24 sm:py-32 scroll-mt-24">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <Kicker>Who I am</Kicker>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 font-display text-balance text-[clamp(1.6rem,4vw,2.75rem)] leading-tight text-paper">
            {site.bioShort}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
