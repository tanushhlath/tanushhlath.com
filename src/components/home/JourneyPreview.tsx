import Link from "next/link";
import { timeline } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";

export function JourneyPreview() {
  const turningPoints = timeline.filter((t) => t.isTurningPoint);

  return (
    <section className="border-t border-ink-line bg-ink-raised/40 px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <Kicker>My story</Kicker>
          <h2 className="mt-4 font-display text-balance text-[clamp(1.8rem,4vw,3rem)] text-paper">
            A short version of a longer story
          </h2>
        </Reveal>

        <div className="mt-12 space-y-10 border-l border-ink-line pl-8">
          {turningPoints.map((event, i) => (
            <Reveal key={event.id} delay={i * 0.1} className="relative">
              <span className="absolute -left-[2.35rem] top-1.5 h-3 w-3 rounded-full bg-azure" />
              <p className="text-sm text-azure-soft">{event.year}</p>
              <p className="mt-1 font-display text-xl sm:text-2xl text-paper">{event.title}</p>
              {event.quote && (
                <p className="mt-2 text-paper-dim italic">&ldquo;{event.quote}&rdquo;</p>
              )}
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10">
          <Link
            href="/story"
            className="inline-flex items-center gap-2 rounded-full border border-ink-line px-6 py-3 text-sm text-paper transition-colors duration-200 hover:border-azure-soft hover:text-azure-soft"
          >
            Read the full story →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
