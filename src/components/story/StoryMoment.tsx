import { memo, useId, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { DUR, EASE, MaskReveal, Parallax, Reveal, TextReveal, useHydrated, useReducedMotionSafe } from "@/animations";
import { MediaCover } from "@/components/media";
import { Tag } from "@/components/ui";
import Link from "@/routing/Link";
import { storyCopy } from "@/lib/content";
import { cn } from "@/lib/cn";
import { workTransitionName } from "@/routing/transitions";
import type { StoryMomentView } from "./storyModel";

/** Where a moment sits relative to the one being read. */
export type MomentFocus = "past" | "active" | "next" | "future";

interface StoryMomentProps {
  view: StoryMomentView;
  focus: MomentFocus;
}

/**
 * One moment of the story: a milestone year, the title and summary, an
 * artifact from the event it's about (or, without one, the year itself
 * carries the composition), and a narrative that opens and closes.
 *
 * - `id` = the moment id, so /story/#<id> lands here (below the top bar);
 *   arriving that way also opens its narrative.
 * - Turning points get a badge, a larger title, a warm node on the
 *   timeline, and start open.
 * - Image and text arrive from opposite sides; the artifact's frame and
 *   the numeral behind it move at different rates while scrolling.
 * - `focus` (from the page's single observer) makes the moment being read
 *   dominant, the previous ones quieter and the next one wait nearby —
 *   pure CSS on `data-focus`, so it reverses with the scroll.
 */
function StoryMomentImpl({ view, focus }: StoryMomentProps) {
  const { moment, index, side, dateNote, artifact, links } = view;
  const reduced = useReducedMotionSafe();
  const hydrated = useHydrated();
  const { hash } = useLocation();
  const regionId = useId();

  // The visitor's own choice wins; otherwise turning points start open,
  // and so does the moment a link pointed at (#id — known only after mount).
  const [choice, setChoice] = useState<boolean | null>(null);
  const targeted = hydrated && hash.length > 1 && safeDecode(hash.slice(1)) === moment.id;
  const open = choice ?? (Boolean(moment.isTurningPoint) || targeted);
  const expandable = Boolean(moment.narrative) || links.length > 0;

  const titleId = `${moment.id}-title`;
  const turning = Boolean(moment.isTurningPoint);
  const textFrom = side === "right" ? "split-left" : "split-right";

  return (
    <article
      id={moment.id}
      className="story-moment"
      data-story-index={index}
      data-focus={focus}
      data-side={side}
      data-media={artifact ? "artifact" : "none"}
      data-turning={turning || undefined}
      aria-labelledby={titleId}
    >
      <span className="story-moment__node" aria-hidden="true" />

      <div className="story-moment__head">
        <Reveal variant="fade" className="story-moment__meta">
          <span className="story-moment__year font-display" aria-hidden="true">
            {moment.year}
          </span>
          <span className="story-moment__labels">
            <span className="sr-only">{moment.dateLabel ?? moment.year}. </span>
            {dateNote && (
              <span className="story-moment__date" aria-hidden="true">
                {dateNote}
              </span>
            )}
            {turning && (
              <Tag tone="ember" dot className="story-moment__turning">
                {storyCopy.turningPoint}
              </Tag>
            )}
          </span>
        </Reveal>

        <TextReveal as="h3" id={titleId} text={moment.title} className="story-moment__title font-display" />

        <Reveal variant={textFrom} delay={0.1} className="story-moment__summary">
          <p>{moment.summary}</p>
        </Reveal>
      </div>

      {artifact && (
        <div className="story-moment__media">
          <Parallax speed={-0.08} className="story-moment__frame-wrap">
            <MaskReveal
              direction="horizontal"
              className="story-artifact__mask"
              duration={DUR.slow}
              amount={0.15}
            >
              <Link
                href={artifact.href}
                className="story-artifact group"
                data-cursor="view"
                data-cursor-label="Open"
              >
                <MediaCover
                  image={artifact.image}
                  title={artifact.eventTitle}
                  aspect="4/3"
                  sizes="(min-width: 64rem) 22rem, 90vw"
                  vtName={workTransitionName(artifact.eventId)}
                  className="story-artifact__cover"
                />
                <span className="story-artifact__caption">
                  <span className="story-artifact__title">{artifact.eventTitle}</span>
                  {artifact.meta && <span className="story-artifact__meta">{artifact.meta}</span>}
                  <span className="story-artifact__arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            </MaskReveal>
          </Parallax>
        </div>
      )}

      {expandable && (
        <div className="story-moment__body">
          <Reveal variant="fade" delay={0.16}>
            <button
              type="button"
              className="story-moment__toggle"
              aria-expanded={open}
              aria-controls={regionId}
              onClick={() => setChoice(!open)}
              data-cursor="view"
              data-cursor-label={open ? storyCopy.collapse : storyCopy.expand}
            >
              <span className="story-moment__toggle-icon" aria-hidden="true" />
              <span>{open ? storyCopy.collapse : storyCopy.expand}</span>
              <span className="sr-only">: {moment.title}</span>
            </button>
          </Reveal>

          <motion.div
            id={regionId}
            className="story-moment__more"
            initial={false}
            animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduced ? 0 : DUR.base, ease: EASE.standard },
              opacity: { duration: reduced ? 0 : DUR.fast, ease: EASE.standard, delay: open && !reduced ? 0.08 : 0 },
            }}
            inert={!open}
          >
            <div className={cn("story-moment__more-inner", links.length > 0 && "has-links")}>
              {moment.narrative && <p className="story-moment__narrative">{moment.narrative}</p>}
              {links.length > 0 && (
                <div className="story-moment__links">
                  <p className="story-moment__links-label">{storyCopy.relatedLabel}</p>
                  <ul>
                    {links.map((link) => (
                      <li key={link.id}>
                        <Link href={link.href} className="story-link" data-cursor="view" data-cursor-label="Open">
                          <span className="story-link__title">{link.title}</span>
                          <span className="story-link__meta">
                            {link.meta}
                            {link.result && <span className="story-link__result">{link.result}</span>}
                          </span>
                          <span className="story-link__arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </article>
  );
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const StoryMoment = memo(StoryMomentImpl);
