import Link from "@/lib/Link";
import { projects } from "@/lib/content";
import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";
import { FeaturedProjectCard } from "@/components/work/ProjectCard";

export function FeaturedWork() {
  const featured = projects.filter((p) => p.tier === "featured").slice(0, 2);
  return (
    <section className="border-t border-ink-line px-5 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <Kicker>Work</Kicker>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,3rem)] text-paper">
              A few things worth your time
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-sm text-paper-dim hover:text-azure-soft transition-colors duration-200"
            >
              See all the work →
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {featured.map((project, i) => (
            <Reveal key={project.id} delay={i * 0.1}>
              <FeaturedProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
