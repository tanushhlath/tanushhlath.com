import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE, Stagger, StaggerItem, useReducedMotionSafe } from "@/animations";
import { MediaCover } from "@/components/media";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import {
  detailCopy,
  getSkillEvidence,
  getStoryImage,
  meCopy,
  skillCategories,
  type SkillEvidence,
} from "@/lib/content";
import { paths } from "@/routing/paths";
import type { ResolvedImage, Skill } from "@/types/content";
import { workLink } from "@/components/me/meModel";
import { useHashChoice } from "@/components/me/useHashChoice";

/**
 * SKILLS — "Proof, not percentages". No bars, no numbers out of 100:
 * every skill opens onto the actual work behind it (getSkillEvidence —
 * projects, experiences, recognitions and story moments, each linking to
 * its canonical page).
 *
 * Layout: each row is a two-column grid. The first column is a dedicated
 * rail (a faint spine, a node at the name's first line, and the accent
 * line that draws down when the row opens); the second holds all text.
 * The line lives only in its own column with a fixed gutter, so it can't
 * touch the text — collapsed, expanded, or with a name that wraps.
 * Opening a row draws the line down, branches reach from it to each
 * evidence group, and the evidence cascades in with a little depth;
 * hovering an item lights its branch.
 *
 * Rows are disclosures (button + region), all closed at first so a deep
 * link lands exactly: row ids are `skill-<id>`, and /me/#skill-writing
 * scrolls to Writing and opens it after mount.
 */
export function SkillsView({ skills }: { skills: Skill[] }) {
  const [openId, choose] = useHashChoice<string | null>(
    "skill-",
    (id) => skills.some((s) => s.id === id),
    null
  );

  return (
    <Stagger as="ul" gap={0.07} className="me-skills">
      {skills.map((skill) => {
        const open = openId === skill.id;
        return <SkillRow key={skill.id} skill={skill} open={open} onToggle={() => choose(open ? null : skill.id)} />;
      })}
    </Stagger>
  );
}

interface ProofItem {
  id: string;
  title: string;
  href: string;
  meta?: string;
  result?: string;
  cover?: ResolvedImage;
}

interface ProofGroup {
  key: "projects" | "events" | "recognitions" | "story";
  label: string;
  items: ProofItem[];
}

function proofGroups(evidence: SkillEvidence): ProofGroup[] {
  const groups: ProofGroup[] = [
    {
      key: "projects",
      label: detailCopy.related.projects,
      items: evidence.projects.flatMap((p) => workLink(p.id) ?? []),
    },
    {
      key: "recognitions",
      label: detailCopy.event.recognition,
      items: evidence.recognitions.map((r) => ({
        id: r.event.id,
        title: r.event.title,
        href: r.href,
        result: r.recognition.result,
        meta: r.event.dateLabel ?? (r.year !== undefined ? String(r.year) : undefined),
        cover: r.cover,
      })),
    },
    {
      key: "events",
      label: detailCopy.related.events,
      items: evidence.events.flatMap((e) => workLink(e.id) ?? []),
    },
    {
      key: "story",
      label: detailCopy.related.story,
      items: evidence.story.map((m) => ({
        id: m.id,
        title: m.title,
        href: paths.story(m.id),
        meta: m.dateLabel ?? String(m.year),
        cover: getStoryImage(m),
      })),
    },
  ];
  return groups.filter((g) => g.items.length > 0);
}

function SkillRow({ skill, open, onToggle }: { skill: Skill; open: boolean; onToggle: () => void }) {
  const reduced = useReducedMotionSafe();
  const evidence = getSkillEvidence(skill);
  const groups = useMemo(() => proofGroups(evidence), [evidence]);
  const count = evidence.proofCount;
  const rowId = `skill-${skill.id}`;
  const toggleId = `${rowId}-toggle`;
  const panelId = `${rowId}-proof`;
  const categoryLabel = skillCategories[skill.category]?.label ?? skill.category;
  const repeatsName = categoryLabel.trim().toLowerCase() === skill.name.trim().toLowerCase();
  // A few real covers from the evidence, stacked, as a hint of what's inside.
  const preview = groups
    .filter((g) => g.key !== "story")
    .flatMap((g) => g.items)
    .flatMap((item) => (item.cover ? [item] : []))
    .slice(0, 4);

  const drawTransition = { duration: reduced ? 0 : DUR.slow, ease: EASE.cinematic };

  return (
    <StaggerItem as="li" id={rowId} className={cn("me-skill", open && "me-skill--open")}>
      <span className="me-skill__rail" aria-hidden="true">
        <span className="me-skill__spine" />
        <motion.span
          className="me-skill__line"
          initial={false}
          animate={{ scaleY: open ? 1 : 0 }}
          transition={drawTransition}
        />
        <span className="me-skill__node" />
      </span>

      <h3 className="me-skill__heading">
        <button
          type="button"
          id={toggleId}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={onToggle}
          className="me-skill__toggle"
          data-cursor="view"
          data-cursor-label={open ? "Close" : meCopy.skills.open}
        >
          {/* A category named like the skill itself ("Leadership") would just repeat
              it: the label keeps its space (rows stay aligned) but isn't shown. */}
          <span className="me-skill__cat" data-repeats={repeatsName || undefined} aria-hidden={repeatsName || undefined}>
            {categoryLabel}
          </span>
          <span className="me-skill__name font-display">{skill.name}</span>
          <span className="me-skill__meta">
            {preview.length > 1 && (
              <span className="me-skill__stack" aria-hidden="true">
                {preview.map((item) => (
                  <span key={item.id} className="me-skill__stack-item">
                    <MediaCover image={item.cover} title={item.title} interactive={false} />
                  </span>
                ))}
              </span>
            )}
            {count > 0 && (
              <span className="me-skill__count">
                {count} {count === 1 ? meCopy.skills.proofPoint.one : meCopy.skills.proofPoint.many}
              </span>
            )}
            <span className="me-skill__icon" aria-hidden="true" />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="proof"
            id={panelId}
            role="region"
            aria-labelledby={toggleId}
            className="me-skill__panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : DUR.base, ease: EASE.standard }}
          >
            <div className="me-skill__panel-inner">
              <p className="me-skill__blurb">{skill.blurb}</p>
              {groups.length === 0 ? (
                <p className="me-skill__empty">{meCopy.skills.empty}</p>
              ) : (
                <Stagger gap={0.045} className="me-proofs">
                  {groups.map((group) => (
                    <div key={group.key} className="me-proof" data-kind={group.key}>
                      <StaggerItem as="h4" variant="fade" className="me-proof__label">
                        <span>{group.label}</span>
                        <span className="me-proof__n">{group.items.length}</span>
                      </StaggerItem>
                      <ul className="me-proof__list">
                        {group.items.map((item) => (
                          <StaggerItem as="li" key={item.id} variant="tilt" className="me-proof__item">
                            <Link
                              href={item.href}
                              className="me-proof__link"
                              data-cursor="view"
                              data-cursor-label="Open"
                            >
                              <span className="me-proof__cover">
                                <MediaCover image={item.cover} title={item.title} />
                              </span>
                              <span className="me-proof__text">
                                {item.result && (
                                  <span className="me-proof__result font-display">{item.result}</span>
                                )}
                                <span className="me-proof__title">{item.title}</span>
                                {item.meta && <span className="me-proof__meta">{item.meta}</span>}
                              </span>
                            </Link>
                          </StaggerItem>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Stagger>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StaggerItem>
  );
}
