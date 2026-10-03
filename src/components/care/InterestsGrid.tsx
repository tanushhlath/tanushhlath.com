import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { DUR, EASE, Reveal, Stagger, StaggerItem, useHydrated, useReducedMotionSafe } from "@/animations";
import { MediaCover } from "@/components/media";
import { ArrowLink } from "@/components/ui";
import { moveRovingFocus } from "@/components/ui/rovingFocus";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { detailCopy } from "@/lib/content";
import { normalizeHref } from "@/routing/paths";
import type { Interest } from "@/types/content";
import { interestLinks, pad2 } from "@/components/me/meModel";
import { useHashChoice } from "@/components/me/useHashChoice";

/**
 * WHAT I CARE ABOUT — an index, not a tag cloud.
 *
 * Left: every interest as a numbered line, grouped under its category
 * (a vertical tab list: click, or ↑/↓/Home/End). Right (below on phones):
 * one reading panel for the selected interest — why it holds his
 * attention, the work it connects to (its `relatedProjects` /
 * `relatedEvents`), and its explicit `link` (Horse Riding → the
 * Inter-House Horse Riding event, as content requires).
 *
 * The panel's content is displaced in the direction you moved through the
 * list (down the list → the new note rises from below; up → it drops in).
 * The active line draws a lead toward the panel. Deep links:
 * /me/#interest-<id> selects that interest after mount. Until it has, the
 * prerendered selection may be the wrong one, so on such loads the panel
 * stays hidden ([data-hash-panel]) and no line looks selected (me.css,
 * html[data-hash-pending]); the swap itself happens without animation.
 */
export function InterestsGrid({ interests }: { interests: Interest[] }) {
  const baseId = useId();
  const reduced = useReducedMotionSafe();
  const panelRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const [direction, setDirection] = useState(1);
  const [activeId, choose] = useHashChoice(
    "interest-",
    (id) => interests.some((i) => i.id === id),
    interests[0]?.id ?? ""
  );

  if (interests.length === 0) return null;
  const activeIndex = Math.max(
    0,
    interests.findIndex((i) => i.id === activeId)
  );
  const active = interests[activeIndex];

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  const select = (interest: Interest, index: number, fromPointer: boolean) => {
    // Direction of travel through the list, for the panel's displacement.
    setDirection(index >= activeIndex ? 1 : -1);
    choose(interest.id);
    // Phones: the panel sits under the list — bring it into view after a tap.
    if (fromPointer && typeof window !== "undefined" && window.matchMedia("(max-width: 63.99rem)").matches) {
      window.requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" })
      );
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = moveRovingFocus(event, "[role='tab']");
    if (!target) return;
    const id = target.dataset.interest;
    const index = interests.findIndex((i) => i.id === id);
    if (index >= 0) select(interests[index], index, false);
  };

  const links = interestLinks({ projects: active.relatedProjects, events: active.relatedEvents });
  const primaryHref = active.link ? normalizeHref(active.link.href) : undefined;
  // The explicit link is the main way on; don't repeat it as a chip.
  const connected = links.filter((l) => l.href !== primaryHref);

  const variants: Variants = {
    enter: (dir: number) => ({ opacity: 0, y: reduced ? 0 : dir * 28 }),
    center: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.enter } },
    exit: (dir: number) => ({
      opacity: 0,
      y: reduced ? 0 : dir * -20,
      transition: { duration: DUR.fast, ease: EASE.exit },
    }),
  };

  return (
    <div className="me-care__layout">
      <Stagger
        as="ol"
        variant="split-left"
        gap={0.05}
        className="me-care__index"
        role="tablist"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
      >
        {interests.map((interest, i) => {
          const selected = interest.id === active.id;
          const firstOfGroup = i === 0 || interests[i - 1].category !== interest.category;
          return (
            <StaggerItem
              as="li"
              key={interest.id}
              id={`interest-${interest.id}`}
              role="presentation"
              className={cn("me-care__entry", firstOfGroup && "me-care__entry--first")}
            >
              <span className="me-care__group" aria-hidden={!firstOfGroup}>
                {firstOfGroup ? interest.category : ""}
              </span>
              <button
                type="button"
                role="tab"
                id={tabId(interest.id)}
                data-interest={interest.id}
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(interest, i, true)}
                className="me-care__tab"
                data-cursor="read"
                data-cursor-label="Why"
              >
                <span className="me-care__num" aria-hidden="true">
                  {pad2(i)}
                </span>
                <span className="me-care__title font-display">{interest.title}</span>
                <span className="me-care__lead" aria-hidden="true" />
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal variant="split-right" delay={0.1} className="me-care__stage">
        <div
          ref={panelRef}
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId(active.id)}
          tabIndex={0}
          className="me-care__panel"
          data-hash-panel=""
        >
          <span className="me-care__panel-num font-display" aria-hidden="true">
            {pad2(activeIndex)}
          </span>
          {/* Remounted once, right after hydration: that render is where a
              deep link's interest replaces the prerendered one, and the
              visitor should land on it, not watch the default leave. */}
          <AnimatePresence key={hydrated ? "live" : "prerender"} mode="wait" initial={false} custom={direction}>
            <motion.div
              key={active.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="me-care__panel-body"
            >
              <p className="me-care__panel-kicker">{active.category}</p>
              <h3 className="me-care__panel-title font-display">{active.title}</h3>
              <p className="me-care__note">{active.note}</p>

              {connected.length > 0 && (
                <div className="me-care__connected">
                  <p className="me-care__connected-label">{detailCopy.related.heading}</p>
                  <ul className="me-care__chips">
                    {connected.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="me-care__chip" data-cursor="view">
                          <span className="me-care__chip-cover" aria-hidden="true">
                            <MediaCover image={item.cover} title={item.title} interactive={false} />
                          </span>
                          <span className="me-care__chip-title">{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {active.link && (
                <ArrowLink href={active.link.href} variant="pill" cursorLabel="Open" className="me-care__more">
                  {active.link.label}
                </ArrowLink>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </div>
  );
}
