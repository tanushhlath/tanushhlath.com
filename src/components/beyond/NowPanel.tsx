import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Reveal, Stagger, StaggerItem, usePointerParallax, type RevealVariant } from "@/animations";
import { MediaCover } from "@/components/media";
import { Kicker, Tag } from "@/components/ui";
import { ProjectVisual } from "@/components/work";
import Link from "@/routing/Link";
import {
  beyondCopy,
  formatMonthYear,
  getLatestNowUpdate,
  getNowItems,
  getWorkEntry,
  navigation,
  nowLabels,
  type WorkEntry,
} from "@/lib/content";
import { pathOf, paths } from "@/routing/paths";
import type { NowItem } from "@/types/content";
import { NowGlyph, NowSignal } from "./glyphs";
import { pad2 } from "./modeState";

/**
 * Where each item sits on the board (desktop: a 12-column grid).
 *  hero  — the first item: 7 columns, two rows tall
 *  side  — the two items beside it: 5 columns each
 *  then pairs that alternate 5 + 7 / 7 + 5, and a lone last item spans the width.
 * Derived from the item count only, so it is identical on server and client.
 */
type Slot = "hero" | "side" | "narrow" | "broad" | "wide";

function boardSlots(count: number): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) slots.push(count === 1 ? "wide" : "hero");
    else if (i <= 2) slots.push("side");
    else {
      const k = i - 3;
      const isLastAlone = i === count - 1 && k % 2 === 0;
      if (isLastAlone) slots.push("wide");
      else slots.push((Math.floor(k / 2) % 2 === 0) === (k % 2 === 0) ? "narrow" : "broad");
    }
  }
  return slots;
}

/** Pointer depth per card (px, negative = away from the pointer) and its entrance. */
const DEPTH = [-7, 12, -10, 9, -13, 11];
const ENTRANCES: RevealVariant[] = ["scale", "rise", "drift", "rise", "scale", "drift"];

/** The records an item points at, as cards (dangling ids are skipped). */
function relatedEntries(item: NowItem): WorkEntry[] {
  const ids = [...(item.relatedProjects ?? []), ...(item.relatedEvents ?? [])];
  return ids.map(getWorkEntry).filter((entry): entry is WorkEntry => Boolean(entry));
}

/** Every record the board points at, once each, in board order. */
function boardThreads(items: NowItem[]): WorkEntry[] {
  const seen = new Map<string, WorkEntry>();
  for (const item of items) for (const entry of relatedEntries(item)) if (!seen.has(entry.id)) seen.set(entry.id, entry);
  return [...seen.values()];
}

interface NowCardProps {
  item: NowItem;
  index: number;
  slot: Slot;
  freshest: boolean;
  latest?: string;
  /** Records already named on the board (a card's own title, or an earlier link): link to them compactly. */
  named: ReadonlySet<string>;
}

const sameTitle = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * For each card, which of its links can be compact ("Project →") because
 * the record's title is already on the board — as that card's own heading
 * or as a full link on an earlier card. Computed in board order.
 */
function namedBefore(items: NowItem[]): ReadonlySet<string>[] {
  const named = new Set<string>();
  return items.map((item) => {
    const entries = relatedEntries(item);
    for (const entry of entries) if (sameTitle(entry.title, item.value)) named.add(entry.id);
    const snapshot = new Set(named);
    for (const entry of entries) named.add(entry.id);
    return snapshot;
  });
}

function NowCard({ item, index, slot, freshest, latest, named }: NowCardProps) {
  const { x, y } = usePointerParallax(DEPTH[index % DEPTH.length]);
  const label = nowLabels[item.label];
  const links = relatedEntries(item);
  const stale = Boolean(latest && item.updatedAt !== latest);
  const float = { "--by-float-i": index } as CSSProperties;

  return (
    <StaggerItem as="li" className="by-now__cell" data-slot={slot} variant={ENTRANCES[index % ENTRANCES.length]}>
      <motion.div className="by-now__depth" style={{ x, y }}>
        <div className="by-now__float" style={float}>
          <article className="by-now-card" data-label={item.label} data-slot={slot} data-stale={stale || undefined}>
            <span className="by-now-card__wire" aria-hidden="true" />
            {slot === "hero" && <NowSignal className="by-now-card__signal" />}
            <p className="by-now-card__state">
              <span className="by-now-card__glyph">
                <NowGlyph label={item.label} />
              </span>
              <span className="by-now-card__label">{label.label}</span>
              {freshest && (
                <Tag tone="accent" dot className="by-now-card__fresh">
                  {beyondCopy.freshest}
                </Tag>
              )}
              <span className="by-now-card__count" aria-hidden="true">
                {pad2(index + 1)}
              </span>
            </p>
            <h3 className="by-now-card__value font-display">{item.value}</h3>
            {item.note && <p className="by-now-card__note">{item.note}</p>}
            {(links.length > 0 || stale) && (
              <div className="by-now-card__foot">
                {links.map((entry) => {
                  const compact = named.has(entry.id);
                  return (
                    <Link
                      key={entry.id}
                      href={entry.href}
                      className="by-now-card__link"
                      data-compact={compact || undefined}
                      aria-label={compact ? `${entry.typeLabel}: ${entry.title}` : undefined}
                      title={compact ? entry.title : undefined}
                      data-cursor="view"
                      data-cursor-label={entry.typeLabel}
                    >
                      <span className="by-now-card__link-kind">{entry.typeLabel}</span>
                      {!compact && <span className="by-now-card__link-title">{entry.title}</span>}
                      <span className="by-now-card__link-arrow" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  );
                })}
                {stale && (
                  <p className="by-now-card__date">
                    {beyondCopy.updatedPrefix} <time dateTime={item.updatedAt}>{formatMonthYear(item.updatedAt)}</time>
                  </p>
                )}
              </div>
            )}
          </article>
        </div>
      </motion.div>
    </StaggerItem>
  );
}

/** The work this board points into — each record once, with its visual. */
function NowThreads({ entries }: { entries: WorkEntry[] }) {
  const work = navigation.primary.find((item) => pathOf(item.href) === paths.work());
  const position = work ? navigation.primary.indexOf(work) : -1;
  return (
    <div className="by-threads">
      {work && (
        <Reveal variant="fade" className="by-threads__head">
          <Kicker index={position >= 0 ? pad2(position + 1) : undefined} tone="quiet">
            {work.label}
          </Kicker>
          <span className="by-threads__desc">{work.description}</span>
        </Reveal>
      )}
      <Stagger as="ul" className="by-threads__list" gap={0.1} variant="split-left">
        {entries.map((entry) => (
          <StaggerItem as="li" key={entry.id} className="by-threads__item">
            <Link
              href={entry.href}
              className="by-thread"
              data-cover-host=""
              data-cursor="view"
              data-cursor-label={entry.typeLabel}
            >
              <span className="by-thread__visual">
                {entry.kind === "project" ? (
                  <ProjectVisual entry={entry} variant="thumb" sizes="(min-width: 64rem) 16rem, 40vw" />
                ) : (
                  <MediaCover image={entry.cover} title={entry.title} label={entry.categoryLabel} sizes="(min-width: 64rem) 16rem, 40vw" />
                )}
              </span>
              <span className="by-thread__body">
                <span className="by-thread__meta">
                  {entry.typeLabel}
                  {entry.categoryLabel && <> · {entry.categoryLabel}</>}
                </span>
                <span className="by-thread__title font-display">{entry.title}</span>
                <span className="by-thread__summary">{entry.summary}</span>
              </span>
              <span className="by-thread__arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

/**
 * NOW — a living current-state board, not a list of past work: what I'm
 * building, learning, exploring, aiming for and wrestling with right now.
 * Cards float gently at slightly different depths (pointer parallax on a
 * mouse, a slow drift everywhere, still under reduced motion); the
 * freshest item is marked when one is newer than the rest, and anything
 * older than the latest update shows its own date. On phones the board
 * becomes a single live feed along a wire.
 */
export function NowPanel() {
  const items = getNowItems();
  const latest = getLatestNowUpdate();
  const latestCount = items.filter((item) => item.updatedAt === latest).length;
  const slots = boardSlots(items.length);
  const threads = boardThreads(items);
  const named = namedBefore(items);

  return (
    <div className="by-now by-shell">
      <Stagger as="ol" className="by-now__board" gap={0.08} id="now-board">
        {items.map((item, index) => (
          <NowCard
            key={item.id}
            item={item}
            index={index}
            slot={slots[index]}
            latest={latest}
            named={named[index]}
            freshest={items.length > 1 && latestCount === 1 && item.updatedAt === latest}
          />
        ))}
      </Stagger>
      {threads.length > 0 && <NowThreads entries={threads} />}
    </div>
  );
}
