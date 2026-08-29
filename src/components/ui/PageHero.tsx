import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";

export function PageHero({
  kicker,
  title,
  intro,
}: {
  kicker: string;
  title: string;
  intro?: string;
}) {
  return (
    <section className="px-5 sm:px-8 pt-36 pb-16 sm:pt-44 sm:pb-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <Kicker>{kicker}</Kicker>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mt-5 font-display text-balance text-[clamp(2.4rem,7vw,5rem)] leading-[0.98] text-paper">
            {title}
          </h1>
        </Reveal>
        {intro && (
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-2xl text-lg text-paper-dim">{intro}</p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
