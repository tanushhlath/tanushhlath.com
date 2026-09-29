import {
  getEventFilters,
  getProjectFilters,
  getRecognitionFilters,
  workLenses,
  type FilterOption,
} from "@/lib/content";
import { WORK_LENSES, paths, type WorkLens } from "@/routing/paths";
import { useHashState } from "@/routing/useHashState";

/**
 * WORK LENS STATE — lives in the URL fragment, so click, refresh, share
 * and Back all land on the same view:
 *
 *   /work/                 Built (the default)
 *   /work/#did             Did
 *   /work/#did/leadership  Did, filtered to one category (taxonomy id)
 *   /work/#recognized/arts Recognized, filtered
 *   /work/#all             All
 *
 * Old `?tab=did` links are converted to `#did` centrally by App
 * (useLegacyTabRedirect), so this module only ever reads the fragment.
 */

export interface WorkState {
  lens: WorkLens;
  /** A category id from src/content/taxonomy.ts, valid for this lens. */
  filter?: string;
}

export const DEFAULT_WORK_STATE: WorkState = { lens: "built" };

const filterCache = new Map<WorkLens, FilterOption[]>();

/** The filter chips a lens offers (taxonomy order, empty categories left out). All has none. */
export function getLensFilters(lens: WorkLens): FilterOption[] {
  let filters = filterCache.get(lens);
  if (!filters) {
    filters =
      lens === "built"
        ? getProjectFilters()
        : lens === "did"
          ? getEventFilters()
          : lens === "recognized"
            ? getRecognitionFilters()
            : [];
    filterCache.set(lens, filters);
  }
  return filters;
}

const isLens = (value: string): value is WorkLens => (WORK_LENSES as readonly string[]).includes(value);

/** "did/leadership" → { lens: "did", filter: "leadership" }; unknown lens → null (default view). */
export function parseWorkState(fragment: string): WorkState | null {
  const [rawLens = "", rawFilter, ...rest] = fragment.trim().toLowerCase().split("/");
  if (!isLens(rawLens) || rest.length > 0) return null;
  const filter = rawFilter && getLensFilters(rawLens).some((f) => f.id === rawFilter) ? rawFilter : undefined;
  return filter ? { lens: rawLens, filter } : { lens: rawLens };
}

/** The inverse of parseWorkState (without the "#"). */
export function serializeWorkState({ lens, filter }: WorkState): string {
  return filter ? `${lens}/${filter}` : lens;
}

/** The lens + filter for this page, synced with the URL fragment (SSR-safe). */
export function useWorkState() {
  return useHashState(parseWorkState, serializeWorkState, DEFAULT_WORK_STATE);
}

/** Position of a lens in tab order (for direction-aware transitions). */
export const lensOrder = (lens: WorkLens): number => WORK_LENSES.indexOf(lens);

/* ------------------------------------------------------------------ */
/* "Back to Work" — history state handed to the detail page            */
/* ------------------------------------------------------------------ */

/**
 * Every link from the Work index to a record (/work/<id>/) carries this
 * in its history state, so the detail page can offer a precise way back:
 *
 *   const back = readWorkBackState(useLocation().state);
 *   back?.href        "/work/#did/leadership"  — the exact lens + filter
 *   back?.lensLabel   "Did"
 *   back?.filterLabel "Leadership & Student Governance" (when filtered)
 *
 * Arriving this way also means the visitor came from inside the site, so
 * `navigate(-1)` restores the lens, filter and scroll position exactly.
 */
export interface WorkBackState {
  from: "work";
  lens: WorkLens;
  filter?: string;
  /** Canonical href of the view the visitor came from. */
  href: string;
  lensLabel: string;
  filterLabel?: string;
}

export function workBackState(state: WorkState): { workBack: WorkBackState } {
  const filterLabel = state.filter
    ? getLensFilters(state.lens).find((f) => f.id === state.filter)?.label
    : undefined;
  const back: WorkBackState = {
    from: "work",
    lens: state.lens,
    href: paths.work(state.lens, state.filter),
    lensLabel: workLenses[state.lens].label,
  };
  if (state.filter) back.filter = state.filter;
  if (filterLabel) back.filterLabel = filterLabel;
  return { workBack: back };
}

/** Read the back state from `location.state` (undefined when the visitor didn't come from Work). */
export function readWorkBackState(state: unknown): WorkBackState | undefined {
  if (!state || typeof state !== "object" || !("workBack" in state)) return undefined;
  const back = (state as { workBack?: unknown }).workBack;
  if (!back || typeof back !== "object") return undefined;
  const candidate = back as Partial<WorkBackState>;
  if (candidate.from !== "work" || typeof candidate.href !== "string" || !candidate.lens || !isLens(candidate.lens)) {
    return undefined;
  }
  return candidate as WorkBackState;
}
