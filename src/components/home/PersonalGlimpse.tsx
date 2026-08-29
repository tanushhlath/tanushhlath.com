import Link from "@/lib/Link";
import { interests, personalDetails } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";

export function PersonalGlimpse() {
  const picks = personalDetails.slice(0, 3);
  const curiosities = interests.slice(0, 3);

  return (
    <section className="border-t border-ink-line px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
        <div>
          <Reveal>
            <Kicker>Beyond the work</Kicker>
            <h2 className="mt-4 font-display text-[clamp(1.6rem,3.5vw,2.5rem)] text-paper">
              A few things about me
            </h2>
          </Reveal>
          <dl className="mt-8 space-y-6">
            {picks.map((d, i) => (
              <Reveal key={d.id} delay={i * 0.08}>
                <dt className="text-sm text-paper-faint">{d.prompt}</dt>
                <dd className="mt-1 font-display text-lg text-paper">{d.answer}</dd>
              </Reveal>
            ))}
          </dl>
          <Reveal delay={0.3} className="mt-6">
            <Link
              href="/me"
              className="inline-flex items-center gap-2 text-sm text-paper-dim hover:text-azure-soft transition-colors duration-200"
            >
              More about me →
            </Link>
          </Reveal>
        </div>

        <div>
          <Reveal>
            <Kicker>What I care about</Kicker>
            <h2 className="mt-4 font-display text-[clamp(1.6rem,3.5vw,2.5rem)] text-paper">
              Curiosities I keep returning to
            </h2>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {curiosities.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.08}>
                <li className="rounded-xl border border-ink-line p-4">
                  <p className="font-display text-lg text-paper">{c.title}</p>
                  <p className="mt-1 text-sm text-paper-dim">{c.note}</p>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.3} className="mt-6">
            <Link
              href="/me#care-about"
              className="inline-flex items-center gap-2 text-sm text-paper-dim hover:text-azure-soft transition-colors duration-200"
            >
              Everything I care about →
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
