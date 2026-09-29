import { useId, type ChangeEvent, type KeyboardEvent, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DUR, EASE } from "@/animations";
import { FilterBar } from "@/components/ui";
import { archiveCopy, projectCategories, workLenses } from "@/lib/content";
import {
  ARCHIVE_SORTS,
  ARCHIVE_TYPES,
  IMPORTANCE_VALUES,
  UNDATED,
  activeFilterKeys,
  categoryValues,
  countLabel,
  importanceLabel,
  sortLabel,
  typeHint,
  typeLabel,
  yearLabel,
  yearValues,
  type ArchiveFilters,
  type FacetCounts,
} from "./archiveModel";
import { ARCHIVE_UI } from "./ui";

export interface ArchiveControlsProps {
  filters: ArchiveFilters;
  counts: FacetCounts;
  query: string;
  onQuery: (value: string) => void;
  onChange: (patch: Partial<ArchiveFilters>) => void;
  onClear: () => void;
  resultCount: number;
  total: number;
  searchRef: RefObject<HTMLInputElement | null>;
  /** Phones: whether the secondary filters are expanded. */
  moreOpen: boolean;
  onToggleMore: () => void;
  reduced: boolean;
}

/**
 * The archive's console: search first (it's the fastest way in), then
 * the facets — type, a year histogram that doubles as the year filter,
 * category, importance and sort. Every count is faceted: it says how many
 * results you'd get by choosing that option, given everything else.
 * On phones the secondary facets fold behind a "Filters" toggle so the
 * list starts on the first screen.
 */
export function ArchiveControls({
  filters,
  counts,
  query,
  onQuery,
  onChange,
  onClear,
  resultCount,
  total,
  searchRef,
  moreOpen,
  onToggleMore,
  reduced,
}: ArchiveControlsProps) {
  const uid = useId();
  const searchId = `${uid}-search`;
  const moreId = `${uid}-more`;
  const categoryId = `${uid}-category`;
  const active = activeFilterKeys(filters);
  const secondaryActive = active.filter((k) => k === "year" || k === "category" || k === "importance").length;

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && query) {
      event.preventDefault();
      onQuery("");
    }
  };

  const categories = categoryValues();
  const projectCats = categories.filter((c) => c.id in projectCategories);
  const storyCats = categories.filter((c) => c.id === "story");
  const eventCats = categories.filter((c) => !(c.id in projectCategories) && c.id !== "story");
  const catOption = (c: { id: string; label: string }) => {
    const n = counts.category[c.id] ?? 0;
    return (
      <option key={c.id} value={c.id} disabled={n === 0 && filters.category !== c.id}>
        {c.label} · {n}
      </option>
    );
  };

  return (
    <div className="ar-console">
      <div className="ar-console__search">
        <label htmlFor={searchId} className="sr-only">
          {archiveCopy.searchLabel}
        </label>
        <span className="ar-search">
          <svg className="ar-search__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <input
            ref={searchRef}
            id={searchId}
            className="ar-search__input"
            type="search"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onQuery(event.target.value)}
            onKeyDown={onSearchKey}
            placeholder={archiveCopy.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            aria-describedby={`${uid}-count`}
          />
          {query ? (
            <button type="button" className="ar-search__clear" onClick={() => onQuery("")} aria-label={ARCHIVE_UI.clearSearch}>
              <span aria-hidden="true">×</span>
            </button>
          ) : (
            <kbd className="ar-search__kbd" title={ARCHIVE_UI.searchShortcut} aria-hidden="true">
              /
            </kbd>
          )}
        </span>
        <p id={`${uid}-count`} className="ar-count" aria-live="polite" aria-atomic="true">
          <span className="ar-count__num">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={resultCount}
                className="ar-count__digits"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: "60%" }}
                animate={{ opacity: 1, y: "0%", transition: { duration: DUR.fast, ease: EASE.enter } }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: "-60%", transition: { duration: DUR.micro, ease: EASE.exit } }}
              >
                {resultCount}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="ar-count__word">
            {resultCount === 1 ? archiveCopy.count.one : archiveCopy.count.many}
          </span>
          {resultCount !== total && (
            <span className="ar-count__total">
              {ARCHIVE_UI.of} {total}
            </span>
          )}
        </p>
      </div>

      <div className="ar-console__row ar-console__row--type">
        <p className="ar-console__label" aria-hidden="true">
          {archiveCopy.filters.type}
        </p>
        <FilterBar
          label={archiveCopy.filters.type}
          layout="scroll"
          active={filters.type}
          onChange={(value) => onChange({ type: value as ArchiveFilters["type"] })}
          options={ARCHIVE_TYPES.map((type) => ({
            value: type,
            label: typeLabel(type),
            count: counts.type[type],
            title: typeHint(type),
          }))}
        />
      </div>

      <div className="ar-console__toggle-row">
        <button
          type="button"
          className="ar-console__toggle"
          aria-expanded={moreOpen}
          aria-controls={moreId}
          onClick={onToggleMore}
        >
          <span className="ar-console__toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {ARCHIVE_UI.filters}
          {secondaryActive > 0 && <span className="ar-console__badge">{secondaryActive}</span>}
        </button>
        {active.length > 0 && (
          <button type="button" className="ar-console__clear ar-console__clear--inline" onClick={onClear}>
            {ARCHIVE_UI.clearAll}
          </button>
        )}
      </div>

      <div id={moreId} className="ar-console__more" data-open={moreOpen ? "true" : "false"}>
        <div className="ar-console__more-inner">
          <div className="ar-console__row ar-console__row--years">
            <p className="ar-console__label" aria-hidden="true">
              {archiveCopy.filters.year}
            </p>
            <YearBars value={filters.year} counts={counts.year} onChange={(year) => onChange({ year })} />
          </div>

          <div className="ar-console__split">
            <div className="ar-console__row ar-console__row--category">
              <label className="ar-console__label" htmlFor={categoryId}>
                {archiveCopy.filters.category}
              </label>
              <span className="ar-select" data-active={filters.category !== "all" ? "true" : undefined}>
                <select
                  id={categoryId}
                  value={filters.category}
                  onChange={(event) => onChange({ category: event.target.value })}
                >
                  <option value="all">
                    {archiveCopy.allCategories} · {counts.category.all}
                  </option>
                  {projectCats.length > 0 && <optgroup label={workLenses.built.label}>{projectCats.map(catOption)}</optgroup>}
                  {eventCats.length > 0 && <optgroup label={workLenses.did.label}>{eventCats.map(catOption)}</optgroup>}
                  {storyCats.map(catOption)}
                </select>
                <span className="ar-select__chevron" aria-hidden="true" />
              </span>
            </div>

            <div className="ar-console__row ar-console__row--importance">
              <p className="ar-console__label" aria-hidden="true">
                {archiveCopy.filters.importance}
              </p>
              <FilterBar
                label={archiveCopy.filters.importance}
                layout="scroll"
                size="sm"
                active={filters.importance}
                onChange={(value) => onChange({ importance: value as ArchiveFilters["importance"] })}
                options={(["all", ...IMPORTANCE_VALUES] as const).map((value) => ({
                  value,
                  label: importanceLabel(value),
                  count: counts.importance[value],
                }))}
              />
            </div>
          </div>

          <div className="ar-console__row ar-console__row--sort">
            <p className="ar-console__label" aria-hidden="true">
              {archiveCopy.filters.sort}
            </p>
            <FilterBar
              label={archiveCopy.filters.sort}
              layout="scroll"
              size="sm"
              active={filters.sort}
              onChange={(value) => onChange({ sort: value as ArchiveFilters["sort"] })}
              options={ARCHIVE_SORTS.map((value) => ({ value, label: sortLabel(value) }))}
            />
            {active.length > 0 && (
              <button type="button" className="ar-console__clear" onClick={onClear}>
                {ARCHIVE_UI.clearAll}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Year filter as a histogram: each bar's height is how many entries that
 * year would show under the other filters, so the chart reshapes itself
 * as you narrow things down. Oldest on the left, like a timeline.
 */
function YearBars({
  value,
  counts,
  onChange,
}: {
  value: string;
  counts: Record<string, number>;
  onChange: (year: string) => void;
}) {
  const years = yearValues();
  const dated = years.filter((y) => y !== UNDATED).reverse();
  const list = years.includes(UNDATED) ? [...dated, UNDATED] : dated;
  const max = Math.max(1, ...list.map((y) => counts[y] ?? 0));

  return (
    <div className="ar-years" role="group" aria-label={archiveCopy.filters.year}>
      <button
        type="button"
        className="ar-years__all"
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
        data-cursor="view"
        data-cursor-label={ARCHIVE_UI.filters}
      >
        {archiveCopy.allYears}
        <span className="ar-years__all-count">{counts.all ?? 0}</span>
      </button>
      <div className="ar-years__bars" title={ARCHIVE_UI.yearChart}>
        {list.map((year) => {
          const n = counts[year] ?? 0;
          const isActive = value === year;
          return (
            <button
              key={year}
              type="button"
              className="ar-years__bar"
              aria-pressed={isActive}
              aria-label={`${yearLabel(year)}, ${countLabel(n)}`}
              disabled={n === 0 && !isActive}
              data-undated={year === UNDATED ? "true" : undefined}
              onClick={() => onChange(isActive ? "all" : year)}
              data-cursor="view"
              data-cursor-label={yearLabel(year)}
            >
              <span className="ar-years__count" aria-hidden="true">
                {n}
              </span>
              <span className="ar-years__track" aria-hidden="true">
                <span className="ar-years__fill" style={{ transform: `scaleY(${n / max})` }} />
              </span>
              <span className="ar-years__label" aria-hidden="true">
                {yearLabel(year)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
