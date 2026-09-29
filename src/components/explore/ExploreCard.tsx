import { MediaCover } from "@/components/media";
import Link from "@/routing/Link";
import type { WorkEntry } from "@/lib/content";
import { workTransitionName } from "@/routing/transitions";
import { EXPLORE_UI } from "./exploreModel";

/**
 * A record on an Explore path. Size follows importance — featured records
 * get a wide cover, significant ones a card, smaller things a compact
 * tile — so a lens reads as a composition, not a wall of equal boxes.
 * The cover carries the record's shared-element name, so opening it
 * morphs into the detail page's hero.
 */
export function ExploreCard({ entry }: { entry: WorkEntry }) {
  const date = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : undefined);
  const compact = entry.importance === "archive";

  if (compact) {
    return (
      <Link
        href={entry.href}
        className="ex-tile group"
        data-kind={entry.kind}
        data-cursor="view"
        data-cursor-label={EXPLORE_UI.open}
      >
        <span className="ex-tile__marker" aria-hidden="true" />
        <span className="ex-tile__meta">
          {entry.typeLabel}
          {date && <span> · {date}</span>}
        </span>
        <span className="ex-tile__title">{entry.title}</span>
        {entry.recognition && (
          <span className="ex-result ex-result--sm">
            <span className="ex-result__ribbon" aria-hidden="true" />
            {entry.recognition.result}
          </span>
        )}
        <span className="ex-tile__arrow" aria-hidden="true">
          →
        </span>
      </Link>
    );
  }

  const featured = entry.importance === "featured";
  return (
    <Link
      href={entry.href}
      className="ex-card group"
      data-kind={entry.kind}
      data-size={entry.importance}
      data-cover-host=""
      data-cursor="view"
      data-cursor-label={EXPLORE_UI.open}
    >
      <span className="ex-card__cover" aria-hidden="true">
        <MediaCover
          image={entry.cover}
          title={entry.title}
          label={entry.categoryLabel}
          vtName={workTransitionName(entry.id)}
          sizes={featured ? "(min-width: 1024px) 46vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"}
        />
      </span>
      <span className="ex-card__body">
        <span className="ex-card__meta">
          <span className="ex-card__kind">{entry.typeLabel}</span>
          {date && <span>{date}</span>}
        </span>
        <span className="ex-card__title font-display">{entry.title}</span>
        <span className="ex-card__summary">{entry.summary}</span>
        {entry.recognition && (
          <span className="ex-result">
            <span className="ex-result__ribbon" aria-hidden="true" />
            {entry.recognition.result}
          </span>
        )}
      </span>
    </Link>
  );
}
