import Link from "@/lib/Link";
import { Reveal } from "@/components/motion/Reveal";
import { Tag, TierTag } from "@/components/ui/Tag";
import { Achievement } from "@/types/content";
import { byYearDesc, getProjectById, getSkillById, resolveExperiences } from "@/lib/content";

/**
 * RECOGNIZED — the third Work lens. Deliberately not another card grid:
 * featured wins get the full story treatment, significant ones sit in a
 * plain two-up grid, and everything else is a dense scannable list. This
 * is what keeps "a collection of meaningful outcomes" from looking like
 * a repeat of BUILT or DID.
 */
export function AchievementsView({ achievements }: { achievements: Achievement[] }) {
  const sorted = byYearDesc(achievements);
  const featured = sorted.filter((a) => a.tier === "featured");
  const significant = sorted.filter((a) => a.tier === "significant");
  const archive = sorted.filter((a) => a.tier === "archive");

  return (
    <div className="space-y-8">
      {featured.map((a) => {
        const relProjects = (a.relatedProjects ?? []).map(getProjectById).filter(Boolean);
        const relExperiences = resolveExperiences(a.relatedExperiences);
        const relSkills = (a.relatedSkills ?? []).map(getSkillById).filter(Boolean);
        return (
          <Reveal
            key={a.id}
            id={a.slug}
            as="div"
            className="scroll-mt-28 rounded-3xl border border-ink-line bg-ink-raised p-6 sm:p-10"
          >
            <div className="flex flex-wrap items-center gap-2">
              <TierTag tier={a.tier} />
              <Tag>{a.dateLabel ?? a.year}</Tag>
              {a.issuer && <Tag>{a.issuer}</Tag>}
            </div>
            <h2 className="mt-5 font-display text-2xl sm:text-3xl text-paper">{a.title}</h2>
            <p className="mt-3 max-w-2xl text-paper-dim">{a.summary}</p>
            {a.context && <p className="mt-4 text-paper-dim">{a.context}</p>}
            {a.whyItMatters && (
              <p className="mt-4 border-l-2 border-azure-soft pl-4 text-paper italic">
                {a.whyItMatters}
              </p>
            )}
            {(relProjects.length > 0 || relExperiences.length > 0 || relSkills.length > 0) && (
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                {relProjects.map(
                  (p) =>
                    p && (
                      <Link
                        key={p.id}
                        href={`/work/${p.slug}`}
                        className="text-azure-soft hover:text-azure transition-colors"
                      >
                        From: {p.title} →
                      </Link>
                    )
                )}
                {relExperiences.map((e) => (
                  <Link
                    key={e.id}
                    href={`/work/${e.slug}`}
                    className="text-azure-soft hover:text-azure transition-colors"
                  >
                    From: {e.title} →
                  </Link>
                ))}
                {relSkills.map(
                  (s) =>
                    s && (
                      <Link
                        key={s.id}
                        href="/me#skills"
                        className="text-ember hover:text-ember/80 transition-colors"
                      >
                        Taught me: {s.name} →
                      </Link>
                    )
                )}
              </div>
            )}
          </Reveal>
        );
      })}

      {significant.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 pt-4">
          {significant.map((a) => (
            <Reveal
              key={a.id}
              id={a.slug}
              as="div"
              className="scroll-mt-28 rounded-2xl border border-ink-line p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag>{a.dateLabel ?? a.year}</Tag>
                {a.issuer && <Tag>{a.issuer}</Tag>}
              </div>
              <p className="mt-4 font-display text-xl text-paper">{a.title}</p>
              <p className="mt-2 text-sm text-paper-dim">{a.summary}</p>
              {a.whyItMatters && (
                <p className="mt-3 text-sm text-paper-faint italic">{a.whyItMatters}</p>
              )}
            </Reveal>
          ))}
        </div>
      )}

      {archive.length > 0 && (
        <div className="pt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-paper-dim">More recognition</p>
          <ul className="mt-4">
            {archive.map((a) => (
              <li
                key={a.id}
                id={a.slug}
                className="scroll-mt-28 flex flex-wrap items-center justify-between gap-2 border-b border-ink-line py-4"
              >
                <div>
                  <p className="text-paper">{a.title}</p>
                  {a.issuer && <p className="text-sm text-paper-faint">{a.issuer}</p>}
                </div>
                <Tag>{a.dateLabel ?? a.year}</Tag>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
