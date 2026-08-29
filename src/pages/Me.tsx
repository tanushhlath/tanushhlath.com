import Image from "@/lib/Image";
import Link from "@/lib/Link";
import { Meta } from "@/lib/Meta";
import { pageMeta } from "@/pageMeta";
import { Reveal } from "@/components/motion/Reveal";
import { Kicker } from "@/components/ui/Kicker";
import { PersonalCollage } from "@/components/me/PersonalCollage";
import { InterestsGrid } from "@/components/care/InterestsGrid";
import { SkillsView } from "@/components/skills/SkillsView";
import { site, personalDetails, interests, skills } from "@/lib/content";

export default function MePage() {
  return (
    <>
      <Meta title={pageMeta.me.title} description={pageMeta.me.description} />
      <section className="px-5 sm:px-8 pt-36 pb-16 sm:pt-44">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-end">
          <Reveal>
            <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-ink-line">
              {site.photo && (
                <Image
                  src={site.photo.src}
                  alt={site.photo.alt}
                  fill
                  sizes="(min-width: 1024px) 400px, 80vw"
                  className="object-cover"
                />
              )}
            </div>
          </Reveal>
          <div>
            <Reveal>
              <Kicker>Who I am</Kicker>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mt-4 font-display text-balance text-[clamp(2.2rem,6vw,4rem)] leading-[0.98] text-paper">
                {site.tagline}
              </h1>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8 py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          {site.bioLong.map((p, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <p className="text-lg leading-relaxed text-paper-dim">{p}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-line px-5 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Kicker>Defining things</Kicker>
          </Reveal>
          <ul className="mt-8 flex flex-wrap gap-3">
            {site.definingThings.map((t, i) => (
              <Reveal key={t} delay={i * 0.04} as="li">
                <span className="inline-block rounded-full border border-ink-line px-5 py-2.5 font-display text-lg text-paper">
                  {t}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="care-about" className="scroll-mt-24 border-t border-ink-line px-5 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Kicker>What I care about</Kicker>
            <p className="mt-4 max-w-xl text-paper-dim">
              Not a generic interests list — click anything below for why it actually holds my attention.
            </p>
          </Reveal>
          <div className="mt-10">
            <InterestsGrid interests={interests} />
          </div>
        </div>
      </section>

      <section className="border-t border-ink-line px-5 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Kicker>A few things about me</Kicker>
          </Reveal>
          <div className="mt-8">
            <PersonalCollage details={personalDetails} />
          </div>
        </div>
      </section>

      <section id="skills" className="scroll-mt-24 border-t border-ink-line px-5 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Kicker>Skills</Kicker>
            <p className="mt-4 max-w-xl text-paper-dim">
              Proof, not percentages. Open a skill and see exactly where it came from.
            </p>
          </Reveal>
          <div className="mt-10">
            <SkillsView skills={skills} />
          </div>
        </div>
      </section>

      <section className="border-t border-ink-line px-5 sm:px-8 py-20 text-center">
        <Reveal>
          <p className="font-display text-2xl sm:text-3xl text-paper">
            Want the longer version?
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/story"
              className="inline-flex items-center gap-2 rounded-full bg-azure px-6 py-3 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-azure-soft"
            >
              Read my story →
            </Link>
            <Link
              href="/beyond"
              className="inline-flex items-center gap-2 rounded-full border border-ink-line px-6 py-3 text-sm text-paper transition-colors duration-200 hover:border-azure-soft hover:text-azure-soft"
            >
              See what&rsquo;s happening now →
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
