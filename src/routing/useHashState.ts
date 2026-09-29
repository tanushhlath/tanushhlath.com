import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHydrated } from "./env";
import { isStateFragment } from "./paths";
import { HASH_STATE, decodeFragment } from "./scroll";

export interface HashStateOptions {
  /** Add a history entry instead of replacing the current one (default: replace). */
  push?: boolean;
}

/**
 * UI state kept in the URL fragment: /work/#did/sports, /beyond/#lab,
 * /explore/#proud. Click, refresh, share, come back — same state.
 *
 *   const [lens, setLens] = useHashState(parseLens, (l) => l, "built");
 *
 * - `parse(fragment)` gets the decoded fragment without "#" ("did/sports")
 *   and returns the state, or undefined/null for anything it doesn't
 *   recognise (→ `fallback`).
 * - `serialize(value)` returns the fragment without "#"; "" removes it.
 * - SSR-safe: the prerender and the hydration render use `fallback` (the
 *   server can't see fragments); the real value applies right after mount.
 *   Pages mounted by a client-side navigation get it on their first render.
 * - Updates replace the history entry and never scroll: the navigation is
 *   marked with HASH_STATE so <ScrollManager> leaves the position alone.
 * - The setter is stable and accepts a value or an updater function.
 */
export function useHashState<T>(
  parse: (fragment: string) => T | null | undefined,
  serialize: (value: T) => string,
  fallback: T
): readonly [T, (next: T | ((previous: T) => T), options?: HashStateOptions) => void] {
  const location = useLocation();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const value = hydrated ? (parse(decodeFragment(location.hash)) ?? fallback) : fallback;

  const latest = useRef({ value, serialize, location, navigate });
  useLayoutEffect(() => {
    latest.current = { value, serialize, location, navigate };
  });

  const setValue = useCallback((next: T | ((previous: T) => T), options?: HashStateOptions) => {
    const { value: current, serialize: toFragment, location: here, navigate: go } = latest.current;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(current) : next;
    const fragment = toFragment(resolved);
    const hash = fragment ? `#${fragment}` : "";
    if (hash === here.hash) return;
    go(
      { pathname: here.pathname, search: here.search, hash },
      { replace: !options?.push, preventScrollReset: true, state: HASH_STATE }
    );
  }, []);

  return [value, setValue] as const;
}

/**
 * Old query-string UI state → fragment state, in place:
 *
 *   useLegacyQueryRedirect("tab");                          // ?tab=did → #did
 *   useLegacyQueryRedirect("tab", (v) => (isLens(v) ? v : null));
 *
 * After mount, if `?<param>=<value>` is in the URL it is removed and
 * `toFragment(value, pathname)` becomes the fragment, via
 * history.replaceState — so the page shows the right state, the address
 * bar shows the canonical form, and nothing ever points at a query URL.
 * When `toFragment` returns null/"" the parameter is just dropped and an
 * existing fragment is kept. Other query parameters are kept.
 *
 * App already runs `useLegacyTabRedirect()` (below) for every page, so
 * pages don't need to call this for the old `?tab=` links.
 */
export function useLegacyQueryRedirect(
  param: string,
  toFragment: (value: string, pathname: string) => string | null | undefined = (value) => value
): void {
  const location = useLocation();
  const navigate = useNavigate();
  const convert = useRef(toFragment);
  useLayoutEffect(() => {
    convert.current = toFragment;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get(param);
    if (value === null) return;
    params.delete(param);
    const search = params.toString();
    // The old parameter wins over an old fragment (e.g. /work?tab=recognized#<old-card-id>).
    const fragment = convert.current(value, location.pathname) || decodeFragment(location.hash);
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "", hash: fragment ? `#${fragment}` : "" },
      { replace: true, preventScrollReset: true, state: HASH_STATE }
    );
  }, [location.pathname, location.search, location.hash, navigate, param]);
}

/**
 * The old site kept tabs in `?tab=`: /work?tab=did, /work?tab=recognized,
 * /beyond?tab=lab (some of those URLs are in search indexes). This turns
 * them into today's fragment state — /work/#did, /beyond/#lab — whenever
 * the value is a state the page understands, and drops the parameter
 * otherwise. Mounted once, in App.
 */
export function useLegacyTabRedirect(): void {
  useLegacyQueryRedirect("tab", (value, pathname) => {
    const fragment = value.trim().toLowerCase();
    return isStateFragment(pathname, fragment) ? fragment : null;
  });
}
