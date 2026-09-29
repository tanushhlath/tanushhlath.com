import { Reveal, Stagger, StaggerItem } from "@/animations";
import { MediaCover } from "@/components/media";
import Link from "@/routing/Link";
import { eventCategories, getAllWork, projectCategories, workCopy, type WorkEntry } from "@/lib/content";
import { WORK_UI, countLabel } from "./helpers";
import type { WorkState } from "./lensState";
import { ProjectArt } from "./ProjectArt";
import { CategoryMarker, OpenArrow, RecordLink, RibbonGlyph } from "./shared";

interface YearGroup {
  key: string;
  label: string;
  entries: WorkEntry[];
}

/** getAllWork() is already newest-first with undated entries last. */
function groupByYear(entries: readonly WorkEntry[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const entry of entries) {
    const key = entry.year === undefined ? "undated" : String(entry.year);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, label: entry.year === undefined ? workCopy.undatedGroup : String(entry.year), entries: [entry] });
  }
  return groups;
}

/** The short category name ("Leadership", "AI") for compact rows. */
function shortCategory(entry: WorkEntry): string {
  const labels = entry.kind === "project" ? projectCategories : eventCategories;
  const label = (labels as Record<string, { label: string; short?: string } | undefined>)[entry.category];
  return label?.short ?? entry.categoryLabel;
}

/**
 * ALL — one intelligent view over the same records: every project and
 * event, newest first, year by year. A ribbon on top shows where the
 * weight of the work sits and jumps to any year. Within a year, sizes
 * follow importance: featured records are wide tiles with large covers,
 * significant ones cover cards, and the smaller things a compact list —
 * so the view reads as a hierarchy, not a wall.
 */
export function AllLens({ state }: { state: WorkState }) {
  const groups = groupByYear(getAllWork());
  const max = Math.max(1, ...groups.map((g) => g.entries.length));

  return (
    <div className="wk-all">
      <Reveal as="nav" className="wk-all__ribbon" aria-label={WORK_UI.jumpToYear}>
        <ol className="wk-all__ribbon-list">
          {groups.map((group) => (
            <li key={group.key} className="wk-all__ribbon-item">
              <Link
                href={`#wk-all-${group.key}`}
                className="wk-all__ribbon-link"
                data-cursor="view"
                data-cursor-label={group.label}
              >
                <span className="wk-all__ribbon-bar" aria-hidden="true">
                  <span style={{ transform: `scaleY(${group.entries.length / max})` }} />
                </span>
                <span className="wk-all__ribbon-year">{group.label}</span>
                <span className="wk-all__ribbon-count">{countLabel(group.entries.length)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </Reveal>

      {groups.map((group) => {
        const rich = group.entries.filter((e) => e.importance !== "archive");
        const compact = group.entries.filter((e) => e.importance === "archive");
        const labelId = `wk-all-${group.key}-label`;
        return (
          <section key={group.key} id={`wk-all-${group.key}`} className="wk-all__year" aria-labelledby={labelId}>
            <Reveal variant="split-left" className="wk-all__year-head">
              <h3 id={labelId} className="wk-all__year-label">
                {group.label}
              </h3>
              <span className="wk-all__year-rule" aria-hidden="true" />
              <span className="wk-all__year-count">{countLabel(group.entries.length)}</span>
            </Reveal>

            {rich.length > 0 && (
              <Stagger as="ul" className="wk-all__grid" gap={0.06} variant="rise">
                {rich.map((entry) => (
                  <StaggerItem as="li" key={entry.id} className="wk-all__cell" data-size={entry.importance}>
                    <Tile entry={entry} from={state} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {compact.length > 0 && (
              <Stagger as="ul" className="wk-all__compact" gap={0.035} variant="fade">
                {compact.map((entry) => (
                  <StaggerItem as="li" key={entry.id} className="wk-all__compact-item">
                    <CompactRow entry={entry} from={state} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Tile({ entry, from }: { entry: WorkEntry; from: WorkState }) {
  const date = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : undefined);
  const featured = entry.importance === "featured";

  return (
    <RecordLink id={entry.id} href={entry.href} from={from} className="wk-tile" cursorLabel={WORK_UI.open}>
      <span className="wk-tile__cover" data-work-cover={entry.id}>
        {entry.kind === "project" && !entry.cover ? (
          <ProjectArt category={entry.category} title={entry.title} variant="card" />
        ) : (
          <MediaCover
            image={entry.cover}
            title={entry.title}
            label={entry.categoryLabel}
            sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 100vw"}
          />
        )}
      </span>
      <span className="wk-tile__body">
        <span className="wk-tile__meta">
          <span className="wk-tile__kind" data-kind={entry.kind}>
            {entry.typeLabel}
          </span>
          {date && <span>{date}</span>}
        </span>
        <h4 className="wk-tile__title">{entry.title}</h4>
        <span className="wk-tile__summary">{entry.summary}</span>
        <span className="wk-tile__foot">
          {entry.recognition ? (
            <span className="wk-tile__result">
              <RibbonGlyph />
              {entry.recognition.result}
            </span>
          ) : entry.statusLabel ? (
            <span className="wk-tile__status">{entry.statusLabel}</span>
          ) : (
            <span className="wk-tile__category">{shortCategory(entry)}</span>
          )}
          <OpenArrow className="wk-tile__open">
            <span className="sr-only">{WORK_UI.open}</span>
          </OpenArrow>
        </span>
      </span>
    </RecordLink>
  );
}

function CompactRow({ entry, from }: { entry: WorkEntry; from: WorkState }) {
  return (
    <RecordLink id={entry.id} href={entry.href} from={from} className="wk-mini" cursorLabel={WORK_UI.open}>
      <CategoryMarker category={entry.category} className="wk-mini__marker" />
      <span className="wk-mini__text">
        <span className="wk-mini__title">{entry.title}</span>
        <span className="wk-mini__meta">
          {entry.typeLabel} · {shortCategory(entry)}
          {entry.dateLabel && entry.dateLabel !== String(entry.year) ? ` · ${entry.dateLabel}` : ""}
        </span>
        {entry.recognition && (
          <span className="wk-mini__result">
            <RibbonGlyph />
            {entry.recognition.result}
          </span>
        )}
      </span>
      <span className="wk-mini__arrow" aria-hidden="true">
        →
      </span>
    </RecordLink>
  );
}
