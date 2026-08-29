import Link from "@/lib/Link";
import { currently } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";

const labelText: Record<string, string> = {
  building: "Currently building",
  learning: "Currently learning",
  reading: "Currently reading",
  exploring: "Currently exploring",
  goal: "Currently aiming for",
  challenge: "Currently wrestling with",
};

export function CurrentStatus() {
  const featured = currently.slice(0, 3);
  return (
    <section className="border-t border-ink-line bg-ink-raised/40 px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <Kicker>Right now</Kicker>
        </Reveal>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-ink-line sm:grid-cols-3">
          {featured.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.06} className="bg-ink p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.18em] text-azure-soft">
                {labelText[item.label]}
              </p>
              <p className="mt-3 font-display text-xl sm:text-2xl text-paper">{item.value}</p>
              {item.note && <p className="mt-2 text-sm text-paper-dim">{item.note}</p>}
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2} className="mt-8">
          <Link
            href="/beyond?tab=now"
            className="inline-flex items-center gap-2 text-sm text-paper-dim hover:text-azure-soft transition-colors duration-200"
          >
            See everything that&rsquo;s alive right now →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
