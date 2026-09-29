import type { CSSProperties } from "react";
import { MaskReveal, Reveal, Stagger, StaggerItem, TextReveal, Tilt } from "@/animations";
import { MediaCover, ProtectedImage } from "@/components/media";
import { eventTypes, getRecognitions, workCopy, type RecognitionEntry } from "@/lib/content";
import { WORK_UI, splitResult } from "./helpers";
import type { WorkState } from "./lensState";
import { OpenArrow, RecordLink } from "./shared";

/**
 * RECOGNIZED — outcomes, not events. Each result is set as huge type
 * ("1st RUNNER-UP", "4 GOLD MEDALS", "FINAL ROUND") with its context
 * underneath: what it was for, the event, the year. Major results from the
 * strongest stories get the largest treatment and a tilting photo print;
 * other major results carry their photo as a soft bleed behind the type;
 * minor results close the lens as a compact list. Every result opens the
 * event it came from.
 */
export function RecognizedLens({ state }: { state: WorkState }) {
  const entries = getRecognitions().filter((r) => !state.filter || r.recognition.category === state.filter);
  const major = entries.filter((r) => r.recognition.level === "major");
  const minor = entries.filter((r) => r.recognition.level === "minor");

  if (entries.length === 0) return <p className="wk-empty">{workCopy.emptyFilter}</p>;

  return (
    <div className="wk-rec">
      {major.length > 0 && (
        <ol className="wk-rec__list">
          {major.map((entry, i) => (
            <li key={entry.event.id} className="wk-rec__item">
              <ResultBlock
                entry={entry}
                size={entry.event.importance === "featured" ? "xl" : "l"}
                align={i % 2 === 0 ? "start" : "end"}
                from={state}
              />
            </li>
          ))}
        </ol>
      )}

      {minor.length > 0 && (
        <section className="wk-rec__more" aria-labelledby="wk-rec-more">
          <Reveal variant="clip" className="wk-rec__more-head">
            <h3 id="wk-rec-more" className="wk-rec__more-title">
              {workCopy.moreRecognition}
            </h3>
          </Reveal>
          <Stagger as="ul" className="wk-rec__minor" gap={0.07}>
            {minor.map((entry) => (
              <StaggerItem as="li" key={entry.event.id}>
                <RecordLink id={entry.event.id} href={entry.href} from={state} className="wk-minor">
                  <span className="wk-minor__result">{keepNumberWithUnit(entry.recognition.result)}</span>
                  <span className="wk-minor__event">{entry.event.title}</span>
                  <span className="wk-minor__meta">
                    <span className="wk-minor__meta-text">{[entry.categoryLabel, entry.year].filter(Boolean).join(" · ")}</span>
                    <OpenArrow className="wk-minor__open">
                      <span className="sr-only">{WORK_UI.open}</span>
                    </OpenArrow>
                  </span>
                </RecordLink>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}

const NO_BREAK_SPACE = String.fromCharCode(0xa0);

/** Joins a leading count to its unit with a no-break space ("5 Positions" stays on one line), so the number never ends a line alone. */
function keepNumberWithUnit(result: string): string {
  return result.replace(/^(\d+(?:st|nd|rd|th)?)\s+/i, `$1${NO_BREAK_SPACE}`);
}

/**
 * Characters in the longest unbreakable piece of a result ("NATIONAL" → 8;
 * the leading "1st" counts as one piece). work.css sizes the headline so
 * that piece always fits its column: the type is as large as the column
 * allows, never cut off at the edge.
 */
function longestPiece(result: string): number {
  return Math.max(1, ...result.split(/\s+/).map((piece) => piece.length));
}

interface ResultBlockProps {
  entry: RecognitionEntry;
  size: "xl" | "l";
  align: "start" | "end";
  from: WorkState;
}

function ResultBlock({ entry, size, align, from }: ResultBlockProps) {
  const { event, recognition, cover } = entry;
  const { num, suffix, rest } = splitResult(recognition.result);
  const headingId = `wk-rec-${event.id}`;
  const meta = [entry.year, entry.categoryLabel, eventTypes[event.type]?.label].filter(Boolean).join(" · ");
  const print = size === "xl" && cover;
  const bleed = size === "l" && cover;

  return (
    <article className="wk-result" data-size={size} data-align={align} data-print={print ? "" : undefined} aria-labelledby={headingId}>
      {bleed && (
        <span className="wk-result__bleed" aria-hidden="true">
          <ProtectedImage image={cover} fill fit="cover" sizes="50vw" />
        </span>
      )}

      <div className="wk-result__body">
        <Reveal variant="clip" className="wk-result__meta">
          <span>{meta}</span>
          <span className="wk-result__rule" aria-hidden="true" />
        </Reveal>

        <h3
          id={headingId}
          className="wk-result__title"
          aria-label={recognition.result}
          style={{ "--wk-fit": longestPiece(recognition.result) } as CSSProperties}
        >
          <span aria-hidden="true" className="wk-result__type">
            {num && (
              <Reveal as="span" variant="mask" className="wk-result__num">
                {num}
                {suffix && <span className="wk-result__suffix">{suffix}</span>}
              </Reveal>
            )}
            <TextReveal as="span" text={rest} delay={num ? 0.08 : 0} srText={false} className="wk-result__words" />
          </span>
        </h3>

        {recognition.detail && (
          <Reveal as="p" delay={0.12} className="wk-result__detail">
            {recognition.detail}
          </Reveal>
        )}

        <Reveal delay={0.18} className="wk-result__source">
          <RecordLink id={event.id} href={entry.href} from={from} className="wk-result__link">
            <span className="wk-result__event">{event.title}</span>
            <OpenArrow className="wk-result__open" />
          </RecordLink>
          {event.organization && event.organization !== event.title && (
            <span className="wk-result__org">{event.organization}</span>
          )}
        </Reveal>
      </div>

      {print && (
        <div className="wk-result__print-wrap">
          <Tilt className="wk-result__print" max={6} glare>
            <RecordLink id={event.id} href={entry.href} from={from} duplicate className="wk-result__print-link">
              <span className="wk-result__print-frame" data-work-cover={event.id}>
                <MaskReveal as="span" direction="vertical" className="wk-result__print-mask">
                  <MediaCover image={cover} title={event.title} aspect="4/3" sizes="(min-width: 1024px) 28vw, 60vw" />
                </MaskReveal>
              </span>
            </RecordLink>
          </Tilt>
        </div>
      )}
    </article>
  );
}
