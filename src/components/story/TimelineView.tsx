import { useState } from "react";
import Link from "@/lib/Link";
import { motion } from "framer-motion";
import { TimelineEvent } from "@/types/content";
import { Reveal } from "@/components/motion/Reveal";
import { resolveTimelineLinks } from "@/lib/content";
import { EASE_ENTER } from "@/lib/motion";

function Moment({ event }: { event: TimelineEvent }) {
  const [open, setOpen] = useState(Boolean(event.isTurningPoint));
  const links = resolveTimelineLinks(event);
  const hasLinks =
    links.projects.length + links.experiences.length + links.achievements.length > 0;
  const hasMore = Boolean(event.narrative || event.quote || hasLinks);

  return (
    <Reveal id={event.id} className="relative scroll-mt-28">
      <span
        className={
          event.isTurningPoint
            ? "absolute -left-[2.65rem] sm:-left-[3.15rem] top-1.5 h-4 w-4 rounded-full bg-azure ring-4 ring-azure/20"
            : "absolute -left-[2.5rem] sm:-left-[3rem] top-2 h-2.5 w-2.5 rounded-full bg-ink-line-strong"
        }
        aria-hidden
      />
      <button
        type="button"
        onClick={() => hasMore && setOpen((v) => !v)}
        data-cursor={hasMore ? "view" : undefined}
        data-cursor-label={open ? "Collapse" : "Expand"}
        className={`block text-left ${hasMore ? "cursor-pointer" : "cursor-default"}`}
      >
        <p className="text-sm text-azure-soft">{event.dateLabel ?? event.year}</p>
        <h3
          className={
            event.isTurningPoint
              ? "mt-2 font-display text-2xl sm:text-4xl text-paper"
              : "mt-2 font-display text-xl sm:text-2xl text-paper"
          }
        >
          {event.title}
        </h3>
        <p className="mt-3 max-w-2xl text-paper-dim">{event.summary}</p>
        {hasMore && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-paper-faint">
            {open ? "Less" : "More"}
            <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}>
              +
            </motion.span>
          </span>
        )}
      </button>

      {open && hasMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE_ENTER }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {event.narrative && (
                <p className="max-w-2xl text-paper-dim leading-relaxed">{event.narrative}</p>
              )}
              {event.quote && (
                <p className="mt-4 max-w-xl border-l-2 border-azure-soft pl-4 italic text-paper">
                  &ldquo;{event.quote}&rdquo;
                </p>
              )}
              {hasLinks && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {links.projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/work/${p.slug}`}
                      className="text-paper-faint hover:text-azure-soft transition-colors"
                    >
                      {p.title} →
                    </Link>
                  ))}
                  {links.experiences.map((e) => (
                    <Link
                      key={e.id}
                      href={`/work/${e.slug}`}
                      className="text-paper-faint hover:text-azure-soft transition-colors"
                    >
                      {e.title} →
                    </Link>
                  ))}
                  {links.achievements.map((a) => (
                    <Link
                      key={a.id}
                      href={`/work?tab=recognized#${a.slug}`}
                      className="text-paper-faint hover:text-azure-soft transition-colors"
                    >
                      {a.title} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
    </Reveal>
  );
}

export function TimelineView({ events }: { events: TimelineEvent[] }) {
  const eras = Array.from(new Set(events.map((e) => e.era)));

  return (
    <div>
      <nav
        aria-label="Jump to chapter"
        className="mb-16 flex flex-wrap gap-x-6 gap-y-2 border-b border-ink-line pb-8"
      >
        {eras.map((era, i) => (
          <a
            key={era}
            href={`#era-${i}`}
            className="text-sm text-paper-faint hover:text-azure-soft transition-colors"
          >
            <span className="font-mono text-xs text-paper-faint">{String(i + 1).padStart(2, "0")}</span>{" "}
            {era}
          </a>
        ))}
      </nav>

      {eras.map((era, ei) => {
        const eraEvents = events.filter((e) => e.era === era);
        return (
          <section key={era} id={`era-${ei}`} className="mb-24 scroll-mt-24">
            <Reveal>
              <p className="mb-10 font-display text-3xl sm:text-5xl text-paper-dim">{era}</p>
            </Reveal>
            <div className="relative space-y-14 border-l border-ink-line pl-8 sm:pl-10">
              {eraEvents.map((event) => (
                <Moment key={event.id} event={event} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
