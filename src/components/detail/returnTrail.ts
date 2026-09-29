import { useCallback, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { readWorkBackState, type WorkBackState } from "@/components/work";
import { prefersReducedMotion, useHydrated } from "@/animations";
import { navigation, workLenses, type WorkItem } from "@/lib/content";
import { useFileMode } from "@/routing/fileMode";
import { paths, routeFamily, type RouteFamily } from "@/routing/paths";
import { DETAIL_UI, homeLens } from "./model";

/**
 * RETURN TRAIL — "Back" on a detail page returns the visitor to exactly
 * where they were: the Work lens + filter + scroll position they opened
 * the record from, the Archive/Explore/Home view, or the previous record.
 *
 * How it knows:
 *  - Links from the Work index carry `{ workBack }` in their history
 *    state (components/work/lensState.ts).
 *  - Links out of a detail page (connections, previous/next) carry
 *    `{ detailTrail: { origin, hops } }`: `origin` is where the trail
 *    started, `hops` how many records were stepped through since, so
 *    Back can jump over them in one go (history.go(-(hops + 1))).
 *  - Any other in-app arrival: the route family the navigation came from
 *    (html[data-nav-from], set by routing/transitions.ts), remembered per
 *    history entry so Back/Forward into the page keeps the same label.
 *  - A direct visit (typed URL, search result, shared link, file mode):
 *    no history to go back through, so Back is a plain link to the
 *    record's own Work lens (Built for projects, Did for events,
 *    Recognized for awards).
 *
 * History-based returns go through navigate(-n), so the ScrollManager
 * restores the lens, filter and scroll position exactly.
 */

export type TrailOrigin =
  | { kind: "work"; back: WorkBackState }
  | { kind: "page"; family: RouteFamily }
  | { kind: "detail"; id: string; title: string }
  | { kind: "none" };

export interface DetailTrail {
  origin: TrailOrigin;
  /** Records stepped through (previous/next) since the origin. */
  hops: number;
}

export interface ReturnTarget {
  /** Real href for the link (works without JS, in a new tab, and in file mode). */
  href: string;
  /** Visible label, e.g. "Back to Work · Did · Leadership". */
  label: string;
  /** > 0: go back this many history entries instead of following `href`. */
  steps: number;
  /** Route family of the destination (for the exit transition). */
  family: RouteFamily;
}

/* ------------------------------------------------------------------ */
/* History state                                                       */
/* ------------------------------------------------------------------ */

function isOrigin(value: unknown): value is TrailOrigin {
  if (!value || typeof value !== "object") return false;
  const origin = value as Partial<Record<string, unknown>>;
  switch (origin.kind) {
    case "work":
      return readWorkBackState({ workBack: origin.back }) !== undefined;
    case "page":
      return typeof origin.family === "string";
    case "detail":
      return typeof origin.id === "string" && typeof origin.title === "string";
    case "none":
      return true;
    default:
      return false;
  }
}

/** The trail stored in `location.state`, if any (validated). */
export function readDetailTrail(state: unknown): DetailTrail | undefined {
  if (!state || typeof state !== "object" || !("detailTrail" in state)) return undefined;
  const trail = (state as { detailTrail?: unknown }).detailTrail;
  if (!trail || typeof trail !== "object") return undefined;
  const { origin, hops } = trail as Partial<DetailTrail>;
  if (!isOrigin(origin) || typeof hops !== "number" || hops < 0) return undefined;
  return { origin, hops: Math.floor(hops) };
}

/** History state for a link out of a detail page. Keeps B4's `workBack` shape for the Work origin. */
export function trailState(trail: DetailTrail): { detailTrail: DetailTrail; workBack?: WorkBackState } {
  return trail.origin.kind === "work"
    ? { detailTrail: trail, workBack: trail.origin.back }
    : { detailTrail: trail };
}

/* ------------------------------------------------------------------ */
/* Where an in-app arrival came from                                   */
/* ------------------------------------------------------------------ */

const STORAGE_PREFIX = "tl-detail-from:";
const FAMILIES: readonly RouteFamily[] = [
  "home",
  "story",
  "work",
  "work-item",
  "me",
  "beyond",
  "archive",
  "explore",
  "not-found",
];
const originCache = new Map<string, RouteFamily | null>();

const isFamily = (value: unknown): value is RouteFamily =>
  typeof value === "string" && (FAMILIES as readonly string[]).includes(value);

/**
 * The route family the navigation into this history entry came from.
 * Read once per entry (html[data-nav-from] is only present while the
 * route transition runs) and remembered, so Back/Forward into the entry
 * — even after a reload — shows the same "Back to …".
 */
function originFor(key: string): RouteFamily | null {
  if (key === "default") return null;
  const cached = originCache.get(key);
  if (cached !== undefined) return cached;

  let family: RouteFamily | null = null;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (isFamily(stored)) family = stored;
  } catch {
    // Storage unavailable (private mode, blocked): fall through to the live attribute.
  }
  if (!family) {
    const root = document.documentElement;
    const from = root.dataset.navFrom;
    if (root.dataset.navTo === "work-item" && isFamily(from)) {
      family = from;
      try {
        window.sessionStorage.setItem(STORAGE_PREFIX + key, from);
      } catch {
        // Not persisted; the in-memory cache still covers this session.
      }
    }
  }
  // Only remember a definite answer: a later read may still find the attribute.
  if (family) originCache.set(key, family);
  return family;
}

const subscribeNever = () => () => {};

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [navigation.home, ...navigation.primary, ...navigation.secondary];
const workNavLabel = NAV_ITEMS.find((item) => routeFamily(item.href) === "work")?.label ?? "Work";

const joinLabel = (parts: (string | undefined)[]) => {
  const shown = parts.filter((part): part is string => Boolean(part));
  return shown.length > 0 ? `${DETAIL_UI.backTo} ${shown.join(" · ")}` : DETAIL_UI.back;
};

function fallbackTarget(work: WorkItem): ReturnTarget {
  const lens = homeLens(work);
  return {
    href: paths.work(lens),
    label: joinLabel([workNavLabel, workLenses[lens].label]),
    steps: 0,
    family: "work",
  };
}

function targetFor(trail: DetailTrail, work: WorkItem): ReturnTarget {
  const steps = trail.hops + 1;
  const { origin } = trail;
  switch (origin.kind) {
    case "work":
      return {
        href: origin.back.href,
        label: joinLabel([workNavLabel, origin.back.lensLabel, origin.back.filterLabel]),
        steps,
        family: "work",
      };
    case "detail":
      return { href: paths.workItem(origin.id), label: joinLabel([origin.title]), steps, family: "work-item" };
    case "page": {
      const item = NAV_ITEMS.find((nav) => routeFamily(nav.href) === origin.family);
      const fallback = fallbackTarget(work);
      return item
        ? { href: item.href, label: joinLabel([item.label]), steps, family: origin.family }
        : { href: fallback.href, label: DETAIL_UI.back, steps, family: origin.family };
    }
    default:
      return fallbackTarget(work);
  }
}

export interface ReturnTrail {
  /** Where "Back" goes, and how it's labelled. */
  target: ReturnTarget;
  /** History state for a previous/next link (keeps the trail's origin, one more hop). */
  stepState: ReturnType<typeof trailState>;
  /** History state for a connection link (this record becomes the origin). */
  branchState: ReturnType<typeof trailState>;
  /** Return through history (only when `target.steps > 0`; otherwise follow `target.href`). */
  goBack: () => void;
}

/**
 * Where "Back" leads for this record. SSR-safe: the prerendered page and
 * the hydration render use the direct-visit fallback (a real link to the
 * record's Work lens); the in-app answer takes over right after.
 */
export function useReturnTrail(work: WorkItem): ReturnTrail {
  const location = useLocation();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const fileMode = useFileMode();
  const arrivedFrom = useSyncExternalStore(
    subscribeNever,
    () => originFor(location.key),
    () => null
  );

  let trail: DetailTrail | null = null;
  if (hydrated && !fileMode) {
    const stored = readDetailTrail(location.state);
    const workBack = readWorkBackState(location.state);
    if (stored) trail = stored;
    else if (workBack) trail = { origin: { kind: "work", back: workBack }, hops: 0 };
    else if (arrivedFrom) trail = { origin: { kind: "page", family: arrivedFrom }, hops: 0 };
  }

  const target = trail ? targetFor(trail, work) : fallbackTarget(work);
  const stepState = trailState({ origin: trail?.origin ?? { kind: "none" }, hops: (trail?.hops ?? 0) + 1 });
  const branchState = trailState({ origin: { kind: "detail", id: work.item.id, title: work.item.title }, hops: 0 });

  const { steps, family } = target;
  const goBack = useCallback(() => {
    if (steps > 0) historyBack(steps, family, () => navigate(-steps));
  }, [steps, family, navigate]);

  return { target, stepState, branchState, goBack };
}

/* ------------------------------------------------------------------ */
/* The return itself                                                   */
/* ------------------------------------------------------------------ */

/**
 * Go back through history inside a view transition, so returning plays
 * the same "detail sinks away, the index settles back" animation as the
 * rest of the site (styles/transitions.css keys it on data-nav-from/to).
 * Back/Forward is asynchronous, so the new snapshot is taken once the
 * popstate has been handled (with a safety timeout). No View Transitions,
 * reduced motion or a hidden tab → a plain instant return.
 */
function historyBack(steps: number, to: RouteFamily, go: () => void): void {
  const root = document.documentElement;
  const canAnimate =
    typeof document.startViewTransition === "function" &&
    document.visibilityState === "visible" &&
    !prefersReducedMotion() &&
    !root.classList.contains("vt-theme");
  if (!canAnimate) {
    go();
    return;
  }

  root.dataset.navFrom = "work-item";
  root.dataset.navTo = to;
  root.dataset.navType = "push";
  const clear = () => {
    if (root.dataset.navFrom !== "work-item" || root.dataset.navTo !== to) return;
    delete root.dataset.navFrom;
    delete root.dataset.navTo;
    delete root.dataset.navType;
  };

  try {
    const transition = document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            window.removeEventListener("popstate", onPop);
            resolve();
          };
          // Let the router render the restored page (and the ScrollManager restore its scroll).
          const onPop = () => window.setTimeout(finish, 90);
          window.addEventListener("popstate", onPop);
          window.setTimeout(finish, 900);
          go();
        })
    );
    transition.finished.then(clear, clear);
  } catch {
    clear();
    go();
  }
}
