import { useState, type CSSProperties } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { DUR, EASE, Reveal, useReducedMotionSafe } from "@/animations";
import { FilterBar } from "@/components/ui";
import Link from "@/routing/Link";
import {
  beyondCopy,
  beyondModes,
  getLabFilters,
  getLabIdeas,
  getStoryMoment,
  getWorkEntry,
  labStatusLabels,
  navigation,
} from "@/lib/content";
import { pathOf, splitHref } from "@/routing/paths";
import type { LabIdea } from "@/types/content";
import { LabMargins, LabSketch } from "./sketches";

/** djb2 — the same id always gives the same small tilt (server and client agree). */
function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return h;
}

/** A card's resting angle (−1.8…1.8°) and its tape's angle, from its id. */
function restingAngles(id: string): { card: string; tape: string } {
  const h = hashId(id);
  const card = ((h % 37) / 36) * 3.6 - 1.8;
  const tape = (((h >>> 6) % 25) / 24) * 10 - 5;
  return { card: `${card.toFixed(2)}deg`, tape: `${tape.toFixed(2)}deg` };
}

/**
 * What an idea's link points at, in words: the record's own title and its
 * type ("Project", "Competition"…), or the story moment's title under
 * "Story". Unknown targets fall back to the menu label of that page.
 */
function describeTarget(href: string): { title: string; kind?: string } | undefined {
  const path = pathOf(href);
  const { hash } = splitHref(href);
  const work = /^\/work\/([^/]+)\/$/.exec(path);
  if (work) {
    const entry = getWorkEntry(work[1]);
    if (entry) return { title: entry.title, kind: entry.typeLabel };
  }
  const page = [navigation.home, ...navigation.primary, ...navigation.secondary].find((item) => pathOf(item.href) === path);
  if (hash) {
    const moment = getStoryMoment(hash);
    if (moment) return { title: moment.title, kind: page?.label };
  }
  return page ? { title: page.label, kind: page.description } : undefined;
}

/** "Wizmo" and "Wizmo — AI Parent Assistant" name the same thing. */
function sameName(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x === y || x.startsWith(y) || y.startsWith(x);
}

function LabCard({ idea }: { idea: LabIdea }) {
  const status = labStatusLabels[idea.status];
  const target = idea.href ? describeTarget(idea.href) : undefined;
  const angles = restingAngles(idea.id);
  const style = { "--by-tilt": angles.card, "--by-tape-tilt": angles.tape } as CSSProperties;
  // When the link leads to the idea's own page (same name), the card title already says where: keep the link short.
  const compact = Boolean(target && sameName(target.title, idea.title));

  return (
    <Reveal variant="rise" className="by-lab-card__reveal">
      <article className="by-lab-card" data-status={idea.status} style={style}>
        <span className="by-lab-card__tape" aria-hidden="true" />
        <div className="by-lab-card__top">
          <span className="by-lab-card__year">{idea.year}</span>
          <span className="by-stamp" data-status={idea.status}>
            <span className="by-stamp__label">{status.label}</span>
          </span>
        </div>
        <div className="by-lab-card__sketch">
          <LabSketch status={idea.status} />
        </div>
        <h3 className="by-lab-card__title font-display">{idea.title}</h3>
        <p className="by-lab-card__summary">{idea.summary}</p>
        {status.description && <p className="by-lab-card__note">{status.description}</p>}
        {idea.href && (
          <Link
            href={idea.href}
            className="by-lab-card__link"
            data-compact={compact || undefined}
            aria-label={compact && target ? [target.kind, target.title].filter(Boolean).join(": ") : undefined}
            title={compact ? target?.title : undefined}
            data-cursor="view"
            data-cursor-label={target?.kind ?? target?.title}
          >
            {target?.kind && <span className="by-lab-card__link-kind">{target.kind}</span>}
            {!(compact && target?.kind) && <span className="by-lab-card__link-title">{target?.title ?? idea.title}</span>}
            <span className="by-lab-card__link-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        )}
      </article>
    </Reveal>
  );
}

/**
 * LAB — "Half-formed ideas, on purpose": a creative workspace, not a
 * terminal. A faint cutting-mat grid with a ruler edge, pencil line-work
 * in the margins, and each idea as a taped-down sketch card: a doodle for
 * its state, a rubber status stamp that presses in as the card arrives,
 * a margin note saying what that status means, and a link to wherever the
 * idea went (idea.href). Filter chips narrow the board by status; cards
 * make room for each other instead of snapping.
 */
export function LabView() {
  const ideas = getLabIdeas();
  const filters = getLabFilters();
  const [filter, setFilter] = useState("all");
  const reduced = useReducedMotionSafe();
  const visible = filter === "all" ? ideas : ideas.filter((idea) => idea.status === filter);

  return (
    <div className="by-lab by-shell">
      {filters.length > 1 && (
        <Reveal variant="fade" className="by-lab__tools">
          <FilterBar
            label={beyondModes.lab.label}
            layout="scroll"
            size="sm"
            options={[{ value: "all", label: beyondCopy.allStatuses, count: ideas.length }, ...filters]}
            active={filter}
            onChange={setFilter}
          />
        </Reveal>
      )}
      <Reveal variant="fade" className="by-lab__mat" id="lab-board">
        <span className="by-lab__ruler" aria-hidden="true" />
        <LabMargins />
        <LayoutGroup>
          <motion.ul className="by-lab__board" layout={!reduced}>
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((idea) => (
                <motion.li
                  key={idea.id}
                  className="by-lab__item"
                  data-status={idea.status}
                  layout={!reduced}
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.94 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: reduced ? DUR.fast : DUR.base, ease: EASE.enter } }}
                  exit={{ opacity: 0, scale: reduced ? 1 : 0.92, transition: { duration: DUR.fast, ease: EASE.exit } }}
                  transition={{ layout: { duration: DUR.base, ease: EASE.standard } }}
                >
                  <LabCard idea={idea} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>
      </Reveal>
    </div>
  );
}
