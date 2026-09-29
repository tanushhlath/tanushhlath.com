import {
  archiveCopy,
  eventCategories,
  getArchive,
  getArchiveCategories,
  getArchiveYears,
  getDidEvents,
  importanceLabels,
  projectCategories,
  workCopy,
  workLenses,
  type ArchiveEntry,
  type TaxonomyLabel,
} from "@/lib/content";
import type { Importance } from "@/types/content";

/**
 * ARCHIVE MODEL — pure filtering, sorting, grouping and counting over
 * getArchive() (projects, events and story moments, derived from the
 * content files — the archive has no data of its own).
 *
 * Filter state lives in the page fragment so a filtered view survives
 * Back/Forward, refresh and sharing, without ever becoming a ?query URL:
 *   /archive/#type=recognized&year=2024&cat=sports&imp=featured&sort=az&q=horse
 * Defaults are left out, so the unfiltered archive is plain /archive/.
 */

export const ARCHIVE_TYPES = ["all", "built", "did", "recognized", "story"] as const;
export type ArchiveType = (typeof ARCHIVE_TYPES)[number];

export const ARCHIVE_SORTS = ["newest", "oldest", "az"] as const;
export type ArchiveSort = (typeof ARCHIVE_SORTS)[number];

export const IMPORTANCE_VALUES = ["featured", "significant", "archive"] as const satisfies readonly Importance[];
export type ImportanceFilter = "all" | Importance;

/** "all", "undated" or a year ("2024"). */
export type YearFilter = string;

export interface ArchiveFilters {
  type: ArchiveType;
  year: YearFilter;
  /** "all" or a category id (project category, event category or "story"). */
  category: string;
  importance: ImportanceFilter;
  sort: ArchiveSort;
  /** Free-text search, as typed. */
  q: string;
}

export const DEFAULT_FILTERS: ArchiveFilters = {
  type: "all",
  year: "all",
  category: "all",
  importance: "all",
  sort: "newest",
  q: "",
};

export const UNDATED = "undated";

/* ------------------------------------------------------------------ */
/* Data (computed once)                                                */
/* ------------------------------------------------------------------ */

let cache: {
  entries: ArchiveEntry[];
  did: Set<string>;
  years: number[];
  hasUndated: boolean;
  categories: { id: string; label: string; short?: string }[];
} | null = null;

function data() {
  if (cache) return cache;
  const entries = getArchive();
  const labels: Record<string, TaxonomyLabel> = { ...projectCategories, ...eventCategories };
  cache = {
    entries,
    did: new Set(getDidEvents().map((e) => e.id)),
    years: getArchiveYears(),
    hasUndated: entries.some((e) => e.year === undefined),
    categories: getArchiveCategories().map((c) => ({ ...c, short: labels[c.id]?.short })),
  };
  return cache;
}

export const archiveTotal = (): number => data().entries.length;

/** Years newest first, then "undated" when some entries have no year. */
export function yearValues(): YearFilter[] {
  const { years, hasUndated } = data();
  return [...years.map(String), ...(hasUndated ? [UNDATED] : [])];
}

export const categoryValues = () => data().categories;

/* ------------------------------------------------------------------ */
/* Labels (all words come from the content files)                      */
/* ------------------------------------------------------------------ */

const storyLabel = (): string =>
  data().categories.find((c) => c.id === "story")?.label ?? archiveCopy.kindLabels.story;

export function typeLabel(type: ArchiveType): string {
  switch (type) {
    case "all":
      return archiveCopy.all;
    case "story":
      return storyLabel();
    default:
      return workLenses[type].label;
  }
}

export function typeHint(type: ArchiveType): string | undefined {
  return type === "built" || type === "did" || type === "recognized" ? workLenses[type].hint : undefined;
}

export function yearLabel(year: YearFilter): string {
  if (year === "all") return archiveCopy.allYears;
  if (year === UNDATED) return archiveCopy.undated;
  return year;
}

export function importanceLabel(value: ImportanceFilter): string {
  return value === "all" ? workCopy.allFilter : importanceLabels[value].label;
}

export function categoryLabel(id: string): string {
  if (id === "all") return archiveCopy.allCategories;
  return data().categories.find((c) => c.id === id)?.label ?? id;
}

/** Short category name for compact rows ("Leadership", "AI"); story rows show their chapter. */
export function shortCategory(entry: ArchiveEntry): string {
  if (entry.kind === "story") return entry.era ?? entry.categoryLabel;
  return data().categories.find((c) => c.id === entry.category)?.short ?? entry.categoryLabel;
}

export function sortLabel(sort: ArchiveSort): string {
  return archiveCopy.sortLabels[sort];
}

export const countLabel = (n: number): string => `${n} ${n === 1 ? archiveCopy.count.one : archiveCopy.count.many}`;

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

export function matchesType(entry: ArchiveEntry, type: ArchiveType): boolean {
  switch (type) {
    case "all":
      return true;
    case "built":
      return entry.kind === "project";
    case "did":
      return entry.kind === "event" && data().did.has(entry.id);
    case "recognized":
      return entry.kind === "event" && Boolean(entry.recognition);
    case "story":
      return entry.kind === "story";
  }
}

const yearKey = (entry: ArchiveEntry): string => (entry.year === undefined ? UNDATED : String(entry.year));

/** Search terms: lower-case words; every one must appear somewhere in the entry. */
export function searchTerms(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function matches(entry: ArchiveEntry, f: ArchiveFilters, terms: string[]): boolean {
  if (!matchesType(entry, f.type)) return false;
  if (f.year !== "all" && yearKey(entry) !== f.year) return false;
  if (f.category !== "all" && entry.category !== f.category) return false;
  if (f.importance !== "all" && entry.importance !== f.importance) return false;
  return terms.every((term) => entry.searchText.includes(term));
}

const KIND_RANK = { project: 0, event: 1, story: 2 } as const;

function compareTitle(a: ArchiveEntry, b: ArchiveEntry): number {
  return a.title.localeCompare(b.title, "en", { sensitivity: "base" });
}

function sortEntries(list: ArchiveEntry[], sort: ArchiveSort): ArchiveEntry[] {
  // getArchive() is already newest-first (undated last, then kind, then title).
  if (sort === "newest") return list;
  if (sort === "az") return [...list].sort(compareTitle);
  return [...list].sort((a, b) => {
    if (a.year === undefined && b.year === undefined) return compareTitle(a, b);
    if (a.year === undefined) return 1;
    if (b.year === undefined) return -1;
    return a.year - b.year || KIND_RANK[a.kind] - KIND_RANK[b.kind] || compareTitle(a, b);
  });
}

export function filterArchive(f: ArchiveFilters): ArchiveEntry[] {
  const terms = searchTerms(f.q);
  return sortEntries(
    data().entries.filter((entry) => matches(entry, f, terms)),
    f.sort
  );
}

/* ------------------------------------------------------------------ */
/* Faceted counts: how many results each option WOULD give             */
/* ------------------------------------------------------------------ */

export interface FacetCounts {
  type: Record<ArchiveType, number>;
  year: Record<string, number>;
  category: Record<string, number>;
  importance: Record<ImportanceFilter, number>;
}

export function facetCounts(f: ArchiveFilters): FacetCounts {
  const terms = searchTerms(f.q);
  const { entries, categories } = data();
  const count = (patch: Partial<ArchiveFilters>) => {
    const next = { ...f, ...patch };
    let n = 0;
    for (const entry of entries) if (matches(entry, next, terms)) n++;
    return n;
  };
  const type = {} as Record<ArchiveType, number>;
  for (const t of ARCHIVE_TYPES) type[t] = count({ type: t });
  const year: Record<string, number> = { all: count({ year: "all" }) };
  for (const y of yearValues()) year[y] = count({ year: y });
  const category: Record<string, number> = { all: count({ category: "all" }) };
  for (const c of categories) category[c.id] = count({ category: c.id });
  const importance = { all: count({ importance: "all" }) } as Record<ImportanceFilter, number>;
  for (const i of IMPORTANCE_VALUES) importance[i] = count({ importance: i });
  return { type, year, category, importance };
}

/* ------------------------------------------------------------------ */
/* Grouping for the list                                               */
/* ------------------------------------------------------------------ */

export interface ArchiveGroup {
  /** Stable key: a year, "undated", or a letter. */
  key: string;
  label: string;
  entries: ArchiveEntry[];
}

function letterOf(title: string): string {
  const first = title.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

/** Consecutive runs of the sorted list: by year for date sorts, by first letter for A → Z. */
export function groupEntries(list: ArchiveEntry[], sort: ArchiveSort): ArchiveGroup[] {
  const groups: ArchiveGroup[] = [];
  for (const entry of list) {
    const key = sort === "az" ? letterOf(entry.title) : yearKey(entry);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, label: sort === "az" ? key : yearLabel(key), entries: [entry] });
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/* Fragment state                                                      */
/* ------------------------------------------------------------------ */

const KEYS = { type: "type", year: "year", category: "cat", importance: "imp", sort: "sort", q: "q" } as const;

/** Characters that would break the fragment's own separators. */
const cleanQuery = (q: string) => q.replace(/[&=#]/g, " ");

/** The search text as it is stored in the fragment. */
export const normalizeQuery = (q: string): string => cleanQuery(q).trim();

export function serializeFilters(f: ArchiveFilters): string {
  const parts: string[] = [];
  if (f.type !== DEFAULT_FILTERS.type) parts.push(`${KEYS.type}=${f.type}`);
  if (f.year !== DEFAULT_FILTERS.year) parts.push(`${KEYS.year}=${f.year}`);
  if (f.category !== DEFAULT_FILTERS.category) parts.push(`${KEYS.category}=${f.category}`);
  if (f.importance !== DEFAULT_FILTERS.importance) parts.push(`${KEYS.importance}=${f.importance}`);
  if (f.sort !== DEFAULT_FILTERS.sort) parts.push(`${KEYS.sort}=${f.sort}`);
  const q = normalizeQuery(f.q);
  if (q) parts.push(`${KEYS.q}=${q}`);
  return parts.join("&");
}

const isOneOf = <T extends string>(list: readonly T[], value: string): value is T =>
  (list as readonly string[]).includes(value);

/** Fragment → filters; null when the fragment isn't archive state at all. */
export function parseFilters(fragment: string): ArchiveFilters | null {
  if (!fragment) return null;
  const f: ArchiveFilters = { ...DEFAULT_FILTERS };
  let recognised = false;
  for (const part of fragment.split("&")) {
    const at = part.indexOf("=");
    if (at < 0) continue;
    const key = part.slice(0, at);
    const value = part.slice(at + 1);
    if (key === KEYS.type && isOneOf(ARCHIVE_TYPES, value)) f.type = value;
    else if (key === KEYS.year && yearValues().includes(value)) f.year = value;
    else if (key === KEYS.category && categoryValues().some((c) => c.id === value)) f.category = value;
    else if (key === KEYS.importance && isOneOf(IMPORTANCE_VALUES, value)) f.importance = value;
    else if (key === KEYS.sort && isOneOf(ARCHIVE_SORTS, value)) f.sort = value;
    else if (key === KEYS.q) f.q = value;
    else continue;
    recognised = true;
  }
  return recognised ? f : null;
}

/** Filters other than sort that narrow the list (for "clear" and the status pill). */
export function activeFilterKeys(f: ArchiveFilters): (keyof ArchiveFilters)[] {
  const keys: (keyof ArchiveFilters)[] = [];
  if (f.type !== "all") keys.push("type");
  if (f.year !== "all") keys.push("year");
  if (f.category !== "all") keys.push("category");
  if (f.importance !== "all") keys.push("importance");
  if (f.q.trim()) keys.push("q");
  return keys;
}

/** The chip text for an active filter. */
export function activeFilterLabel(f: ArchiveFilters, key: keyof ArchiveFilters): string {
  switch (key) {
    case "type":
      return typeLabel(f.type);
    case "year":
      return yearLabel(f.year);
    case "category":
      return categoryLabel(f.category);
    case "importance":
      return importanceLabel(f.importance);
    case "q":
      return `“${f.q.trim()}”`;
    default:
      return sortLabel(f.sort);
  }
}
