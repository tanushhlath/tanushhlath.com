import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, type UseScrollOptions } from "framer-motion";
import { DUR, EASE, Reveal, Stagger, StaggerItem, useReducedMotionSafe, useSectionProgress } from "@/animations";
import { MediaCover, fitFor } from "@/components/media";
import {
  detailCopy,
  eventCategories,
  getDidEvents,
  groupEventsByYear,
  toWorkEntry,
  workCopy,
} from "@/lib/content";
import type { WorkEvent } from "@/types/content";
import { WORK_UI, countLabel } from "./helpers";
import type { WorkState } from "./lensState";
import { CategoryMarker, OpenArrow, RecordLink, RibbonGlyph } from "./shared";

/** The spine fills as a line 62% down the screen travels through the timeline. */
const SPINE_RANGE: NonNullable<UseScrollOptions["offset"]> = ["start 62%", "end 62%"];

/** Row covers: a 4:3 print beside the text (work.css widens it into a strip on phones). */
const THUMB_RATIO = 4 / 3;
const THUMB_SIZES = "(max-width: 640px) calc(100vw - 5rem), 184px";

/**
 * DID — chronological, not a card grid. Years are sticky markers beside a
 * timeline spine that fills as you scroll (and empties as you scroll back).
 * Each event is a row on the spine: date, type, category marker, title,
 * organisation and role, a recognition badge, a small cover when there are
 * photos — and it opens inline (summary → what it was / what I learned)
 * with an explicit link to its own page.
 */
export function DidLens({ state }: { state: WorkState }) {
  const events = getDidEvents().filter((e) => !state.filter || e.category === state.filter);
  const groups = groupEventsByYear(events);
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());
  const ref = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(ref, SPINE_RANGE);
  const reduced = useReducedMotionSafe();

  const toggle = useCallback((id: string) => {
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (events.length === 0) return <p className="wk-empty">{workCopy.emptyFilter}</p>;

  return (
    <div className="wk-did" ref={ref}>
      <div className="wk-did__spine" aria-hidden="true">
        <motion.span className="wk-did__spine-fill" style={{ scaleY: reduced ? 1 : progress }} />
      </div>
      {groups.map((group) => {
        const key = group.year === null ? "undated" : String(group.year);
        const headingId = `wk-did-${key}`;
        return (
          <section
            key={key}
            className="wk-did__year"
            data-undated={group.year === null ? "" : undefined}
            aria-labelledby={headingId}
          >
            <div className="wk-did__marker">
              <Reveal variant="clip" className="wk-did__marker-inner">
                <h3 id={headingId} className="wk-did__year-label">
                  {group.label}
                </h3>
                <p className="wk-did__year-count">{countLabel(group.events.length)}</p>
              </Reveal>
            </div>
            <Stagger as="ol" className="wk-did__rows" gap={0.06}>
              {group.events.map((event) => (
                <StaggerItem as="li" key={event.id} className="wk-did__item">
                  <DidRow event={event} open={openIds.has(event.id)} onToggle={toggle} from={state} />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        );
      })}
    </div>
  );
}

interface DidRowProps {
  event: WorkEvent;
  open: boolean;
  onToggle: (id: string) => void;
  from: WorkState;
}

function DidRow({ event, open, onToggle, from }: DidRowProps) {
  const reduced = useReducedMotionSafe();
  const entry = toWorkEntry({ kind: "event", item: event });
  const category = eventCategories[event.category];
  const regionId = `wk-row-${event.id}`;
  const date = event.dateLabel ?? (event.year !== undefined ? String(event.year) : undefined);
  const context = [event.organization, event.role].filter(Boolean).join(" · ");
  const hasDetails = Boolean(event.description || event.learning || event.outcome);

  return (
    <article className="wk-row" data-importance={event.importance} data-open={open ? "" : undefined}>
      <span className="wk-row__node" aria-hidden="true">
        <CategoryMarker category={event.category} />
      </span>

      <div className="wk-row__main">
        <p className="wk-row__meta">
          {date && <span className="wk-row__date">{date}</span>}
          <span className="wk-row__type">{entry.typeLabel}</span>
          <span className="wk-row__cat">{category.short ?? category.label}</span>
        </p>

        <h4 className="wk-row__heading">
          <button
            type="button"
            className="wk-row__toggle"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => onToggle(event.id)}
            data-cursor="read"
            data-cursor-label={open ? WORK_UI.less : WORK_UI.more}
          >
            <span className="wk-row__title">{event.title}</span>
            <span className="wk-row__plus" aria-hidden="true" />
          </button>
        </h4>

        {context && <p className="wk-row__context">{context}</p>}

        {event.recognition && (
          <p className="wk-row__badge">
            <RibbonGlyph />
            <span>{event.recognition.result}</span>
          </p>
        )}

        <p className="wk-row__summary">{event.summary}</p>

        <div id={regionId} className="wk-row__region">
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="panel"
                className="wk-row__panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={
                  reduced ? { duration: 0 } : { height: { duration: DUR.base, ease: EASE.enter }, opacity: { duration: DUR.fast } }
                }
              >
                <div className="wk-row__panel-inner">
                  {hasDetails && (
                    <dl className="wk-row__details">
                      {event.description && (
                        <div>
                          <dt>{detailCopy.event.description}</dt>
                          <dd>{event.description}</dd>
                        </div>
                      )}
                      {event.learning && (
                        <div className="wk-row__learning">
                          <dt>{detailCopy.event.learning}</dt>
                          <dd>{event.learning}</dd>
                        </div>
                      )}
                      {event.outcome && (
                        <div>
                          <dt>{detailCopy.event.outcome}</dt>
                          <dd>{event.outcome}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  <RecordLink id={event.id} href={entry.href} from={from} className="wk-row__open">
                    <OpenArrow>{WORK_UI.openRecord}</OpenArrow>
                  </RecordLink>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="wk-row__aside">
        {entry.cover && (
          <RecordLink id={event.id} href={entry.href} from={from} duplicate className="wk-row__thumb">
            {/* The frame sets the shape (a 4:3 print beside the row; a wide
                strip across it on phones); the fit is chosen for the print. */}
            <span className="wk-row__thumb-frame" data-work-cover={event.id}>
              <MediaCover image={entry.cover} title={event.title} fit={fitFor(entry.cover, THUMB_RATIO)} sizes={THUMB_SIZES} />
            </span>
          </RecordLink>
        )}
        <RecordLink id={event.id} href={entry.href} from={from} className="wk-row__go">
          <OpenArrow>
            {WORK_UI.open}
            <span className="sr-only">: {event.title}</span>
          </OpenArrow>
        </RecordLink>
      </div>
    </article>
  );
}
