import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE, Reveal, observeViewport, useHydrated, useReducedMotionSafe } from "@/animations";
import { ArrowLink } from "@/components/ui";
import { archiveCopy, pages, workCopy } from "@/lib/content";
import { useHashState } from "@/routing/useHashState";
import { paths } from "@/routing/paths";
import { ArchiveControls } from "./ArchiveControls";
import { ArchiveList } from "./ArchiveList";
import {
  DEFAULT_FILTERS,
  activeFilterKeys,
  activeFilterLabel,
  archiveTotal,
  facetCounts,
  filterArchive,
  groupEntries,
  normalizeQuery,
  parseFilters,
  searchTerms,
  serializeFilters,
  type ArchiveFilters,
} from "./archiveModel";
import { ARCHIVE_UI } from "./ui";

/** Waits this long after the last keystroke before writing the search into the URL. */
const SEARCH_COMMIT_MS = 280;

/**
 * Becomes true one frame after hydration. Until then state changes apply
 * instantly — that's the URL fragment arriving after the static (unfiltered)
 * HTML hydrates, which should look like a page load, not a filter change.
 */
function useSettled(): boolean {
  const hydrated = useHydrated();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [hydrated]);
  return settled;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/**
 * ARCHIVE — the complete record, derived from the content files: every
 * project, event and story moment. Functional first: search, facets with
 * live counts, three sorts, and a list that rearranges quickly and
 * legibly. Filter state lives in the fragment (/archive/#type=built&year=2024),
 * so Back from a record returns to exactly the same view.
 */
export function ArchiveView() {
  const [stored, setStored] = useHashState(parseFilters, serializeFilters, DEFAULT_FILTERS);
  const hydrated = useHydrated();
  const settled = useSettled();
  const reduced = useReducedMotionSafe();

  // The search box is local for instant feedback; the URL catches up after a pause.
  const [query, setQuery] = useState(stored.q);
  const [seenQuery, setSeenQuery] = useState(stored.q);
  if (seenQuery !== stored.q) {
    setSeenQuery(stored.q);
    if (normalizeQuery(query) !== stored.q) setQuery(stored.q);
  }
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  useEffect(() => {
    if (!hydrated) return;
    const next = normalizeQuery(query);
    if (next === stored.q) return;
    const id = window.setTimeout(() => setStored((prev) => ({ ...prev, q: next })), SEARCH_COMMIT_MS);
    return () => window.clearTimeout(id);
  }, [query, stored.q, hydrated, setStored]);

  const filters: ArchiveFilters = useMemo(() => ({ ...stored, q: query }), [stored, query]);
  const results = useMemo(() => filterArchive(filters), [filters]);
  const counts = useMemo(() => facetCounts(filters), [filters]);
  const groups = useMemo(() => groupEntries(results, filters.sort), [results, filters.sort]);
  const terms = useMemo(() => searchTerms(query), [query]);
  const total = archiveTotal();

  const consoleRef = useRef<HTMLDivElement>(null);
  const codaRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [consoleAway, setConsoleAway] = useState(false);

  /** After a change made far down the page, bring the top of the results back into view. */
  const revealResults = useCallback(() => {
    requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      const chrome = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--chrome-h")) || 68;
      if (el.getBoundingClientRect().top < chrome) {
        el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      }
    });
  }, [reduced]);

  const update = useCallback(
    (patch: Partial<ArchiveFilters>) => {
      setStored((prev) => ({ ...prev, ...patch, q: patch.q ?? normalizeQuery(queryRef.current) }));
      if ("q" in patch) setQuery(patch.q ?? "");
      revealResults();
    },
    [setStored, revealResults]
  );

  const clearAll = useCallback(() => {
    setQuery("");
    setStored((prev) => ({ ...DEFAULT_FILTERS, sort: prev.sort }));
    revealResults();
  }, [setStored, revealResults]);

  const removeFilter = (key: keyof ArchiveFilters) => {
    update({ [key]: key === "q" ? "" : DEFAULT_FILTERS[key] } as Partial<ArchiveFilters>);
  };

  const jumpToConsole = () => {
    const el = consoleRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    if (window.matchMedia("(pointer: fine)").matches) searchRef.current?.focus({ preventScroll: true });
  };

  // "/" focuses the search, as in most catalogues.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The floating status pill (bottom of the screen, like Work's lens dock,
  // so it never covers the row being read) appears once the console has
  // scrolled away above, and steps aside again when the page's ending
  // comes into view.
  useEffect(() => {
    const el = consoleRef.current;
    const end = codaRef.current;
    if (!el || !end || typeof IntersectionObserver === "undefined") return;
    let away = false;
    let atEnd = false;
    const update = () => setConsoleAway(away && !atEnd);
    const observer = new IntersectionObserver(
      ([entry]) => {
        away = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        update();
      },
      { threshold: 0 }
    );
    observer.observe(el);
    const stopEnd = observeViewport(end, (phase) => {
      atEnd = phase !== "before";
      update();
    });
    return () => {
      observer.disconnect();
      stopEnd();
    };
  }, []);

  const active = activeFilterKeys(filters);

  return (
    <div className="ar-view">
      <Reveal variant="fade" className="ar-shell">
        {/* Console and list follow the filters in the URL: hidden on a deep
            link (/archive/#type=built) until they have applied — see App.tsx. */}
        <div ref={consoleRef} id="archive-filters" className="ar-console-wrap" data-hash-panel="">
          <ArchiveControls
            filters={filters}
            counts={counts}
            query={query}
            onQuery={setQuery}
            onChange={update}
            onClear={clearAll}
            resultCount={results.length}
            total={total}
            searchRef={searchRef}
            moreOpen={moreOpen}
            onToggleMore={() => setMoreOpen((open) => !open)}
            reduced={reduced}
          />
        </div>
      </Reveal>

      <section
        ref={resultsRef}
        id="archive-results"
        className="ar-shell ar-results"
        aria-label={pages.archive.title}
        data-hash-panel=""
      >
        {results.length > 0 ? (
          <ArchiveList groups={groups} sort={filters.sort} terms={terms} animate={settled} reduced={reduced} />
        ) : (
          <motion.div
            className="ar-empty"
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE.enter } }}
          >
            <p className="ar-empty__text font-display">{archiveCopy.empty}</p>
            <div className="ar-empty__actions">
              <button type="button" className="arrow-link arrow-link--pill" onClick={clearAll}>
                <span className="arrow-link__label">{ARCHIVE_UI.clearAll}</span>
              </button>
              <ArrowLink href={paths.explore()} cursorLabel={pages.explore.title}>
                {pages.explore.heading ?? pages.explore.title}
              </ArrowLink>
            </div>
          </motion.div>
        )}
      </section>

      <footer ref={codaRef} className="ar-shell ar-coda">
        <Reveal variant="clip" className="ar-coda__rule" aria-hidden="true" />
        <Reveal className="ar-coda__links">
          <ArrowLink href={paths.explore()} variant="pill" cursorLabel={pages.explore.title}>
            {pages.explore.heading ?? pages.explore.title}
          </ArrowLink>
          <ArrowLink href={paths.work("all")} cursorLabel={pages.work.title}>
            {pages.work.title} · {workCopy.allFilter}
          </ArrowLink>
        </Reveal>
      </footer>

      <AnimatePresence>
        {consoleAway && (
          <div className="ar-status-wrap" key="status">
            <motion.div
              className="ar-status"
              role="region"
              aria-label={ARCHIVE_UI.filters}
              initial={{ opacity: 0, y: reduced ? 0 : 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE.enter } }}
              exit={{ opacity: 0, y: reduced ? 0 : 14, transition: { duration: DUR.micro, ease: EASE.exit } }}
            >
              <span className="ar-status__count">
                <strong>{results.length}</strong>
                <span className="ar-status__of">
                  {" "}
                  {ARCHIVE_UI.of} {total}
                </span>
              </span>
              {active.length > 0 && (
                <span className="ar-status__chips">
                  {active.map((key) => {
                    const label = activeFilterLabel(filters, key);
                    return (
                      <button
                        key={key}
                        type="button"
                        className="ar-status__chip"
                        onClick={() => removeFilter(key)}
                        aria-label={`${ARCHIVE_UI.removeFilter}: ${label}`}
                      >
                        <span className="ar-status__chip-label">{label}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    );
                  })}
                </span>
              )}
              <button type="button" className="ar-status__edit" onClick={jumpToConsole}>
                {ARCHIVE_UI.editFilters}
                <span aria-hidden="true">↑</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
