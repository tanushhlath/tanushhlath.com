import { Fragment, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, type Transition } from "framer-motion";
import { DUR, EASE, Reveal, Stagger, StaggerItem } from "@/animations";
import { MediaCover } from "@/components/media";
import Link from "@/routing/Link";
import { archiveCopy, type ArchiveEntry } from "@/lib/content";
import { workTransitionName } from "@/routing/transitions";
import { UNDATED, countLabel, shortCategory, type ArchiveGroup, type ArchiveSort } from "./archiveModel";
import { ARCHIVE_UI } from "./ui";

export interface ArchiveListProps {
  groups: ArchiveGroup[];
  sort: ArchiveSort;
  /** Lower-cased search terms, highlighted in titles. */
  terms: string[];
  /** false until just after hydration: state arriving from the URL applies instantly. */
  animate: boolean;
  reduced: boolean;
}

/**
 * The record itself: rows grouped by year (or by letter for A → Z), each
 * a link to exactly that entry's page. Filtering is a fast, functional
 * layout transition — rows that no longer match fade out in place, the
 * rest close ranks, new ones fade in where they belong. Changing the sort
 * crossfades the whole list instead of sending 70 rows flying. Scrolling
 * reveals rows reversibly (down: they rise in; back up: they sink away).
 */
export function ArchiveList({ groups, sort, terms, animate, reduced }: ArchiveListProps) {
  const still = !animate;
  const layout: Transition = still || reduced ? { duration: 0 } : { duration: 0.34, ease: EASE.standard };
  const fadeIn: Transition = still ? { duration: 0 } : { duration: reduced ? DUR.fast : 0.26, ease: EASE.standard };
  const fadeOut: Transition = still ? { duration: 0 } : { duration: 0.14, ease: EASE.exit };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={sort}
        className="ar-list__sort"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: fadeIn }}
        exit={{ opacity: 0, transition: fadeOut }}
      >
        <LayoutGroup id="archive-rows">
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <motion.section
                key={group.key}
                layout="position"
                transition={{ layout }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: fadeIn }}
                exit={{ opacity: 0, transition: fadeOut }}
                className="ar-group"
                data-sort={sort}
                aria-labelledby={`ar-group-${group.key}`}
              >
                <div className="ar-group__head">
                  <Reveal variant="split-left" distance={16} className="ar-group__head-inner">
                    <h2
                      id={`ar-group-${group.key}`}
                      className="ar-group__label font-display"
                      data-undated={group.key === UNDATED ? "" : undefined}
                    >
                      {group.label}
                    </h2>
                    <span className="ar-group__count">{countLabel(group.entries.length)}</span>
                  </Reveal>
                </div>
                <Stagger as="ol" className="ar-group__rows" variant="rise" distance={14} duration={0.42} gap={0.035}>
                  <AnimatePresence initial={false}>
                    {group.entries.map((entry) => (
                      <motion.li
                        key={`${entry.kind}:${entry.id}`}
                        layout="position"
                        transition={{ layout }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: fadeIn }}
                        exit={{ opacity: 0, transition: fadeOut }}
                        className="ar-group__item"
                      >
                        <StaggerItem className="ar-group__reveal">
                          <ArchiveRow entry={entry} terms={terms} />
                        </StaggerItem>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </Stagger>
              </motion.section>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </motion.div>
    </AnimatePresence>
  );
}

function ArchiveRow({ entry, terms }: { entry: ArchiveEntry; terms: string[] }) {
  const date = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : archiveCopy.undated);
  const isStory = entry.kind === "story";
  return (
    <Link
      href={entry.href}
      className="ar-row group"
      data-kind={entry.kind}
      data-cover-host=""
      data-cursor="view"
      data-cursor-label={isStory ? ARCHIVE_UI.read : ARCHIVE_UI.open}
    >
      <span className="ar-row__thumb" aria-hidden="true">
        <MediaCover
          image={entry.cover}
          title={entry.title}
          aspect="1/1"
          sizes="80px"
          vtName={isStory ? undefined : workTransitionName(entry.id)}
        />
      </span>
      <span className="ar-row__main">
        <span className="ar-row__title">
          <Highlight text={entry.title} terms={terms} />
        </span>
        <span className="ar-row__summary">{entry.summary}</span>
        <span className="ar-row__meta-sm">
          {entry.typeLabel} · {shortCategory(entry)} · {date}
        </span>
        {entry.recognition && (
          <span className="ar-row__result">
            <span className="ar-row__ribbon" aria-hidden="true" />
            {entry.recognition.result}
          </span>
        )}
      </span>
      <span className="ar-row__type">
        <span className="ar-row__dot" aria-hidden="true" />
        {entry.typeLabel}
      </span>
      <span className="ar-row__cat">{shortCategory(entry)}</span>
      <span className="ar-row__date">{date}</span>
      <span className="ar-row__arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Marks the parts of a title that match the search. */
function Highlight({ text, terms }: { text: string; terms: string[] }): ReactNode {
  if (terms.length === 0) return text;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="ar-mark">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}
