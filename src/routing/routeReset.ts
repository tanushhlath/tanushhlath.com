import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";

/**
 * ROUTE RESET — "open this page again".
 *
 * Activating a link to the page you're already on (menu item, logo, a
 * "Work" link while on /work/) doesn't navigate; it re-opens the page:
 * App remounts the routed page (its entrance replays, tabs and expanded
 * states reset), the fragment is cleared and the window scrolls to the
 * top. Components outside the page (menu, atmosphere…) can react with
 * `useRouteReset`.
 */

let resetKey = 0;
const keyListeners = new Set<() => void>();
const resetCallbacks = new Set<() => void>();

/** Re-open the current page. Called by Link / useAppNavigate; rarely needed directly. */
export function triggerRouteReset(): void {
  resetKey += 1;
  for (const callback of [...resetCallbacks]) callback();
  for (const listener of [...keyListeners]) listener();
}

function subscribeKey(listener: () => void): () => void {
  keyListeners.add(listener);
  return () => keyListeners.delete(listener);
}

/** Increments on every reset. App keys the routed page with it (0 during prerender). */
export function useResetKey(): number {
  return useSyncExternalStore(
    subscribeKey,
    () => resetKey,
    () => 0
  );
}

/**
 * Run `callback` whenever the current page is re-opened from a link to
 * itself — e.g. close a menu or rewind a component living outside the page.
 */
export function useRouteReset(callback: () => void): void {
  const latest = useRef(callback);
  useLayoutEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    const run = () => latest.current();
    resetCallbacks.add(run);
    return () => {
      resetCallbacks.delete(run);
    };
  }, []);
}
