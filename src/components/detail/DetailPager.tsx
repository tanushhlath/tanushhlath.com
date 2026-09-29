import { Reveal } from "@/animations";
import { MediaCover } from "@/components/media";
import { ProjectArt } from "@/components/work";
import type { WorkEntry } from "@/lib/content";
import Link from "@/routing/Link";
import { DetailBack } from "./DetailBack";
import { DETAIL_UI, dateOf, type Neighbors } from "./model";
import type { ReturnTrail } from "./returnTrail";

export interface DetailPagerProps {
  neighbors: Neighbors;
  trail: ReturnTrail;
}

/**
 * The foot of every record: the previous and next record in the same
 * collection (projects step through projects, events through events —
 * in the order the Work lenses list them), and the explicit way back.
 * Stepping keeps the trail, so "Back" still returns to where the visitor
 * started, in one step.
 */
export function DetailPager({ neighbors, trail }: DetailPagerProps) {
  const { prev, next } = neighbors;
  return (
    <nav className="dt-pager" aria-label={DETAIL_UI.more}>
      <div className="dt-shell">
        {(prev || next) && (
          <div className="dt-pager__grid" data-count={prev && next ? 2 : 1}>
            {prev && (
              <Reveal variant="split-left" className="dt-pager__cell">
                <PagerLink entry={prev} dir="prev" state={trail.stepState} />
              </Reveal>
            )}
            {next && (
              <Reveal variant="split-right" delay={0.06} className="dt-pager__cell">
                <PagerLink entry={next} dir="next" state={trail.stepState} />
              </Reveal>
            )}
          </div>
        )}
        <Reveal variant="fade" delay={0.1} className="dt-pager__back">
          <DetailBack trail={trail} variant="end" />
        </Reveal>
      </div>
    </nav>
  );
}

function PagerLink({ entry, dir, state }: { entry: WorkEntry; dir: "prev" | "next"; state: unknown }) {
  const label = dir === "prev" ? DETAIL_UI.previous : DETAIL_UI.next;
  const meta = [entry.typeLabel, dateOf(entry)].filter(Boolean).join(" · ");
  return (
    <Link
      href={entry.href}
      state={state}
      className="dt-pager__link group"
      data-dir={dir}
      rel={dir}
      data-cursor="view"
      data-cursor-label={label}
    >
      <span className="dt-pager__cover" data-photo={entry.cover ? "" : undefined} aria-hidden="true">
        {entry.kind === "project" && !entry.cover ? (
          <ProjectArt category={entry.category} title={entry.title} variant="card" />
        ) : (
          // A photo here is a blurred wash of colour behind the title (styles/detail.css):
          // it fills the card whatever its size, from a small copy.
          <MediaCover
            image={entry.cover}
            title={entry.title}
            label={entry.categoryLabel}
            sizes="50vw"
            backdrop
            interactive={false}
          />
        )}
      </span>
      <span className="dt-pager__veil" aria-hidden="true" />
      <span className="dt-pager__body">
        <span className="dt-pager__dir">
          {dir === "prev" && <span aria-hidden="true">← </span>}
          {label}
          {dir === "next" && <span aria-hidden="true"> →</span>}
        </span>
        <span className="dt-pager__title font-display">{entry.title}</span>
        {meta && <span className="dt-pager__meta">{meta}</span>}
      </span>
    </Link>
  );
}
