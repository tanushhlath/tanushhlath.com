import Image from "next/image";
import Link from "next/link";
import { Project } from "@/types/content";
import { Tag, TierTag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { ContinueThread } from "@/components/ui/ContinueThread";
import {
  getSkillById,
  resolveAchievements,
  resolveExperiences,
} from "@/lib/content";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Reveal className="border-t border-ink-line py-8 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-[0.2em] text-azure-soft">{label}</p>
      <div className="mt-3 max-w-2xl text-paper-dim leading-relaxed">{children}</div>
    </Reveal>
  );
}

export function ProjectDetail({ project }: { project: Project }) {
  const skills = (project.relatedSkills ?? []).map(getSkillById).filter(Boolean);
  const relExperiences = resolveExperiences(project.relatedExperiences);
  const relAchievements = resolveAchievements(project.relatedAchievements);
  const hasConnections = skills.length + relExperiences.length + relAchievements.length > 0;

  const threads = [
    ...relExperiences.slice(0, 1).map((e) => ({
      lead: "This grew out of",
      title: e.title,
      href: `/work/${e.slug}`,
    })),
    ...relAchievements.slice(0, 1).map((a) => ({
      lead: "It led to",
      title: a.title,
      href: `/work?tab=recognized#${a.slug}`,
    })),
  ];

  return (
    <article>
      <header className="px-5 sm:px-8 pt-36 pb-12 sm:pt-44">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <Link
              href="/work"
              className="text-sm text-paper-faint hover:text-azure-soft transition-colors"
            >
              ← Work
            </Link>
          </Reveal>
          <Reveal delay={0.05} className="mt-6 flex flex-wrap items-center gap-2">
            <TierTag tier={project.tier} />
            <Tag>{project.category}</Tag>
            <Tag>{project.dateLabel ?? project.year}</Tag>
            <Tag>{project.status.replace("-", " ")}</Tag>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 font-display text-balance text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.98] text-paper">
              {project.title}
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-2xl text-xl text-paper-dim">{project.summary}</p>
          </Reveal>
        </div>
      </header>

      {project.images?.[0] && (
        <Reveal className="px-5 sm:px-8">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-ink-line">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={project.images[0].src}
                alt={project.images[0].alt}
                fill
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </Reveal>
      )}

      <div className="px-5 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {project.motivation && <Field label="Why I built it">{project.motivation}</Field>}
          {project.problem && <Field label="The problem">{project.problem}</Field>}
          {project.concept && <Field label="How I approached it">{project.concept}</Field>}
          {(project.role || (project.process && project.process.length > 0)) && (
            <Field label="What I actually did">
              {project.role && <p className="mb-3">{project.role}</p>}
              {project.process && project.process.length > 0 && (
                <ol className="space-y-3">
                  {project.process.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-azure-soft">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Field>
          )}
          {project.challenges && <Field label="What got in the way">{project.challenges}</Field>}
          {(project.outcome || project.impact || project.recognition) && (
            <Field label="What happened">
              {project.outcome && <p className="mb-3">{project.outcome}</p>}
              {project.impact && <p className="mb-3">{project.impact}</p>}
              {project.recognition && <p className="text-paper">{project.recognition}</p>}
            </Field>
          )}
          {project.lessons && <Field label="What I learned">{project.lessons}</Field>}

          {project.tools && project.tools.length > 0 && (
            <Field label="Tools">
              <div className="flex flex-wrap gap-2">
                {project.tools.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </Field>
          )}

          {project.links && project.links.length > 0 && (
            <Field label="Links">
              <div className="flex flex-wrap gap-4">
                {project.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    data-cursor="view"
                    data-cursor-label="Visit ↗"
                    className="inline-flex items-center gap-1 text-azure-soft hover:text-azure transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </Field>
          )}

          {hasConnections && (
            <Reveal className="mt-16 rounded-2xl border border-ink-line p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-paper-dim">
                How this connects
              </p>
              <div className="mt-4 space-y-3 text-paper-dim">
                {relExperiences.length > 0 && (
                  <p>
                    This grew out of{" "}
                    {relExperiences.map((e, i) => (
                      <span key={e.id}>
                        {i > 0 && ", "}
                        <Link href={`/work/${e.slug}`} className="text-paper underline decoration-ink-line-strong underline-offset-4 hover:text-azure-soft hover:decoration-azure-soft transition-colors">
                          {e.title}
                        </Link>
                      </span>
                    ))}
                    .
                  </p>
                )}
                {skills.length > 0 && (
                  <p>
                    It taught me{" "}
                    {skills.map((s, i) => (
                      <span key={s!.id}>
                        {i > 0 && ", "}
                        <Link href="/me#skills" className="text-paper underline decoration-ink-line-strong underline-offset-4 hover:text-azure-soft hover:decoration-azure-soft transition-colors">
                          {s!.name}
                        </Link>
                      </span>
                    ))}
                    .
                  </p>
                )}
                {relAchievements.length > 0 && (
                  <p>
                    It led to{" "}
                    {relAchievements.map((a, i) => (
                      <span key={a.id}>
                        {i > 0 && ", "}
                        <Link href={`/work?tab=recognized#${a.slug}`} className="text-paper underline decoration-ink-line-strong underline-offset-4 hover:text-azure-soft hover:decoration-azure-soft transition-colors">
                          {a.title}
                        </Link>
                      </span>
                    ))}
                    .
                  </p>
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
