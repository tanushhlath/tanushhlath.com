import Image from "@/lib/Image";
import Link from "@/lib/Link";
import { Experience } from "@/types/content";
import { Tag, TierTag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { ContinueThread } from "@/components/ui/ContinueThread";
import { getSkillById, resolveAchievements, resolveProjects } from "@/lib/content";

export function ExperienceDetail({ experience }: { experience: Experience }) {
  const skills = (experience.relatedSkills ?? []).map(getSkillById).filter(Boolean);
  const relProjects = resolveProjects(experience.relatedProjects);
  const relAchievements = resolveAchievements(experience.relatedAchievements);
  const threads = [
    ...relProjects.slice(0, 1).map((p) => ({ lead: "It led to", title: p.title, href: `/work/${p.slug}` })),
    ...relAchievements.slice(0, 1).map((a) => ({ lead: "It was recognized with", title: a.title, href: `/work?tab=recognized#${a.slug}` })),
  ];

  return (
    <article>
      <header className="px-5 sm:px-8 pt-36 pb-12 sm:pt-44">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Link href="/work?tab=did" className="text-sm text-paper-faint hover:text-azure-soft transition-colors">
              ← Where I show up
            </Link>
          </Reveal>
          <Reveal delay={0.05} className="mt-6 flex flex-wrap items-center gap-2">
            <TierTag tier={experience.tier} />
            <Tag>{experience.category}</Tag>
            <Tag>{experience.dateLabel ?? experience.year}</Tag>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 font-display text-balance text-[clamp(2.2rem,6vw,4rem)] leading-[0.98] text-paper">
              {experience.title}
            </h1>
          </Reveal>
          {experience.organization && (
            <Reveal delay={0.12}>
              <p className="mt-3 text-paper-faint">{experience.organization}</p>
            </Reveal>
          )}
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-2xl text-xl text-paper-dim">{experience.summary}</p>
          </Reveal>
        </div>
      </header>

      {experience.images?.[0] && (
        <Reveal className="px-5 sm:px-8">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-ink-line">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={experience.images[0].src}
                alt={experience.images[0].alt}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      )}

      <div className="px-5 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {experience.description && (
            <Reveal className="border-t border-ink-line pt-8">
              <p className="text-xs uppercase tracking-[0.2em] text-azure-soft">The story</p>
              <p className="mt-3 max-w-2xl text-paper-dim leading-relaxed">
                {experience.description}
              </p>
            </Reveal>
          )}

          {experience.role && (
            <Reveal className="border-t border-ink-line py-8">
              <p className="text-xs uppercase tracking-[0.2em] text-azure-soft">My role</p>
              <p className="mt-3 text-paper-dim">{experience.role}</p>
            </Reveal>
          )}

          {experience.highlights && experience.highlights.length > 0 && (
            <Reveal className="border-t border-ink-line py-8">
              <p className="text-xs uppercase tracking-[0.2em] text-azure-soft">Highlights</p>
              <ul className="mt-3 space-y-2">
                {experience.highlights.map((h, i) => (
                  <li key={i} className="flex gap-3 text-paper-dim">
                    <span className="text-azure-soft">—</span>
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {(skills.length > 0 || relProjects.length > 0 || relAchievements.length > 0) && (
            <Reveal className="mt-8 rounded-2xl border border-ink-line p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-paper-dim">Connected</p>
              <div className="mt-4 grid gap-6 sm:grid-cols-3">
                {skills.length > 0 && (
                  <div>
                    <p className="text-sm text-paper-faint">Skills</p>
                    <ul className="mt-2 space-y-1">
                      {skills.map((s) => (
                        <li key={s!.id}>
                          <Link href="/me#skills" className="text-paper hover:text-azure-soft transition-colors">
                            {s!.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {relProjects.length > 0 && (
                  <div>
                    <p className="text-sm text-paper-faint">Related projects</p>
                    <ul className="mt-2 space-y-1">
                      {relProjects.map((p) => (
                        <li key={p.id}>
                          <Link href={`/work/${p.slug}`} className="text-paper hover:text-azure-soft transition-colors">
                            {p.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {relAchievements.length > 0 && (
                  <div>
                    <p className="text-sm text-paper-faint">Recognition</p>
                    <ul className="mt-2 space-y-1">
                      {relAchievements.map((a) => (
                        <li key={a.id}>
                          <Link href={`/work?tab=recognized#${a.slug}`} className="text-paper hover:text-azure-soft transition-colors">
                            {a.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>

      <ContinueThread threads={threads} />
    </article>
  );
}
