import { isFileMode } from "./fileMode";

/**
 * SCROLL MEMORY — where the visitor was on each history entry, so Back
 * and Forward (and a reload) land them exactly there again.
 *
 * Positions are kept per history entry (React Router's `location.key`),
 * in memory while the page is open and in sessionStorage across reloads
 * and trips to other sites. Browser-only; used by <ScrollManager>.
 */

const STORAGE_KEY = "tanushhlath:scroll";
/** Oldest entries are dropped beyond this, so storage stays tiny. */
const MAX_ENTRIES = 80;
/** React Router's key for an entry without our key: never trusted (several entries can share it). */
const UNKEYED = "default";

let positions: Map<string, number> | null = null;

function memory(): Map<string, number> {
  if (positions) return positions;
  positions = new Map();
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    if (Array.isArray(stored)) {
      for (const pair of stored) {
        if (Array.isArray(pair) && typeof pair[0] === "string" && typeof pair[1] === "number") {
          positions.set(pair[0], pair[1]);
        }
      }
    }
  } catch {
    // Storage blocked or corrupt: remember for this page view only.
  }
  return positions;
}

/**
 * The key a location's scroll position is stored under. In file mode the
 * in-memory router's keys are new on every page load, so the document's
 * own path identifies the entry instead.
 */
export function scrollKey(locationKey: string): string | null {
  if (isFileMode()) return `file:${window.location.pathname}`;
  return locationKey && locationKey !== UNKEYED ? locationKey : null;
}

export function rememberPosition(key: string | null, y: number): void {
  if (!key) return;
  const map = memory();
  map.delete(key); // re-insert so the most recent entries survive trimming
  map.set(key, Math.max(0, Math.round(y)));
}

export function savedPosition(key: string | null): number | undefined {
  return key ? memory().get(key) : undefined;
}

/** Write the positions to sessionStorage (on navigation and when the page is hidden). */
export function persistPositions(): void {
  if (!positions) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...positions].slice(-MAX_ENTRIES)));
  } catch {
    // Quota or privacy mode — nothing to do.
  }
}

/**
 * True when this document was loaded by a reload or by Back/Forward from
 * another document — the only first loads where a saved position applies.
 */
export function isReturnVisit(): boolean {
  try {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return entry?.type === "reload" || entry?.type === "back_forward";
  } catch {
    return false;
  }
}

/**
 * Call once, before the router is created (main.tsx):
 * - turns off the browser's own scroll restoration (the ScrollManager
 *   restores positions itself, after the page has rendered), and
 * - gives the landing history entry a unique key. React Router only keys
 *   entries it creates; without this the first entry and any native
 *   #fragment jump would share the key "default" and their positions
 *   would overwrite each other.
 */
export function prepareHistory(): void {
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  if (isFileMode()) return;
  const state: unknown = window.history.state;
  const current = state && typeof state === "object" ? (state as Record<string, unknown>) : {};
  if (typeof current.key === "string" && current.key !== UNKEYED) return;
  const key = Math.random().toString(36).slice(2, 10);
  try {
    window.history.replaceState({ ...current, key }, "");
  } catch {
    // Some embedded browsers forbid replaceState; restoration just degrades.
  }
}
