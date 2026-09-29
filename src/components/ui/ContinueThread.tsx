import type { ResolvedImage } from "@/types/content";
import { Reveal, Stagger, StaggerItem } from "@/animations";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { isExternalHref, normalizeHref } from "@/routing/paths";
import { MediaCover } from "@/components/media/MediaCover";
import { Kicker } from "./Kicker";

export interface Thread {
  /** The connective sentence, e.g. "This project led me to…". */
  lead: string;
  /** Destination title. */
  title: string;
  /** A `paths.*` value. */
  href: string;
  /** Small context line, e.g. "Event · 2024". */
  meta?: string;
  /**
   * The destination's cover. When any thread has one, every thread shows
   * a thumbnail (a typographic one where the cover is missing).
   */
  cover?: ResolvedImage;
}

export interface ContinueThreadProps {
  /** 1–3 onward links; nothing renders when empty. */
  threads: Thread[];
  /** Small label above the list. Default "Keep going". */
  kicker?: string;
  /** Optional heading under the kicker. */
  heading?: string;
  id?: string;
  className?: string;
}

/**
 * Ends a page by pointing somewhere else rather than just stopping —
 * "This project led me to…" → the related record. Pass 1–3 threads built
 * from the record's relations (see `getRelated()` / `getConnections()` in
 * @/lib/content); pages with nothing to link onward pass an empty array
 * and nothing renders.
 */
export function ContinueThread({ threads, kicker = "Keep going", heading, id, className }: ContinueThreadProps) {
  if (threads.length === 0) return null;
  const withCovers = threads.some((t) => t.cover);

  return (
    <nav id={id} aria-label={heading ?? kicker} className={cn("continue-thread", className)}>
      <div className="continue-thread__inner">
        <Reveal variant="fade" className="continue-thread__head">
          <Kicker>{kicker}</Kicker>
          {heading && <p className="continue-thread__heading font-display">{heading}</p>}
        </Reveal>
        <Stagger as="ol" className="continue-thread__list" gap={0.08}>
          {threads.map((thread, i) => {
            const external = isExternalHref(thread.href);
            return (
              <StaggerItem as="li" key={thread.href}>
                <Link
                  href={external ? thread.href : normalizeHref(thread.href)}
                  className={cn("continue-thread__link group", withCovers && "continue-thread__link--cover")}
                  data-cursor="view"
                  data-cursor-label="Open"
                >
                  <span className="continue-thread__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {withCovers && (
                    <MediaCover
                      image={thread.cover}
                      title={thread.title}
                      aspect="4/3"
                      sizes="8rem"
                      className="continue-thread__cover"
                    />
                  )}
                  <span className="continue-thread__body">
                    <span className="continue-thread__lead">{thread.lead}</span>
                    <span className="continue-thread__title font-display">{thread.title}</span>
                    {thread.meta && <span className="continue-thread__meta">{thread.meta}</span>}
                  </span>
                  <span className="continue-thread__arrow" aria-hidden="true">
                    {external ? "↗" : "→"}
                  </span>
                  {external && <span className="sr-only"> (opens in a new tab)</span>}
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </nav>
  );
}
