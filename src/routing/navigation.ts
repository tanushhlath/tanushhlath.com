import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, type Location, type NavigateFunction } from "react-router-dom";
import { fileHref, isFileMode } from "./fileMode";
import { isExternalHref, isFileHref, isStateFragment, normalizeHref, pathOf, routeFamily, splitHref } from "./paths";
import { triggerRouteReset } from "./routeReset";
import { HASH_STATE, scrollToAnchor, scrollToTop } from "./scroll";
import { runRouteTransition } from "./transitions";

/**
 * NAVIGATION — the one set of rules every internal link follows.
 *
 *   "#section"               same-page anchor: smooth scroll + focus, URL untouched
 *   "/work/" while on /work/ re-open the page (remount, clear fragment, top) — see routeReset.ts
 *   "/work/#did" on /work/   switch UI state in the fragment (replace, no scroll)
 *   "/me/#skills" on /me/    same-page anchor, as above
 *   another page             router navigation inside a view transition; the
 *                            ScrollManager then scrolls to #anchor or the top
 *   another page, file mode  a real page load of the relative …/index.html file
 *   external / mailto / tel  left to the browser
 */

export interface AppNavigateOptions {
  /** Replace the current history entry instead of adding one. */
  replace?: boolean;
  /** History state for the new entry. */
  state?: unknown;
  /** Animate the route change with a view transition (default true). */
  viewTransition?: boolean;
}

/** "app": handled in-app. "document": the browser should load the URL itself. */
export type NavigationResult = "app" | "document";

function navigateWithin(
  href: string,
  options: AppNavigateOptions,
  navigate: NavigateFunction,
  location: Location
): NavigationResult {
  if (!href || isExternalHref(href)) return "document";
  if (href.startsWith("#")) {
    scrollToAnchor(href);
    return "app";
  }
  if (!href.startsWith("/")) return "document";

  const target = splitHref(normalizeHref(href));
  // A file (/sitemap.xml, /media/…/1.png), not a page: let the browser open it.
  if (isFileHref(target.pathname)) return "document";
  const currentPath = pathOf(location.pathname);
  const animate = options.viewTransition !== false;

  if (target.pathname === currentPath) {
    if (target.hash) {
      if (isStateFragment(target.pathname, target.hash)) {
        const hash = `#${target.hash}`;
        if (hash !== location.hash) {
          navigate(
            { pathname: location.pathname, search: location.search, hash },
            { replace: options.replace ?? true, state: HASH_STATE, preventScrollReset: true }
          );
        }
      } else {
        scrollToAnchor(target.hash);
      }
      return "app";
    }

    if (options.replace || target.search) {
      // A programmatic URL update on the same page, not a request to re-open it.
      navigate(`${target.pathname}${target.search}`, {
        replace: options.replace,
        state: options.state ?? HASH_STATE,
        preventScrollReset: true,
      });
      return "app";
    }

    const family = routeFamily(currentPath);
    runRouteTransition(
      () => {
        if (location.hash || location.search) {
          navigate(location.pathname, { replace: true, state: HASH_STATE, preventScrollReset: true });
        }
        triggerRouteReset();
      },
      { from: family, to: family, type: "reset", animate, afterUpdate: scrollToTop }
    );
    return "app";
  }

  if (isFileMode()) return "document";

  const to = `${target.pathname}${target.search}${target.hash ? `#${target.hash}` : ""}`;
  runRouteTransition(() => navigate(to, { replace: options.replace, state: options.state }), {
    from: routeFamily(currentPath),
    to: routeFamily(target.pathname),
    type: "push",
    animate,
  });
  return "app";
}

/**
 * Low-level: returns a stable function that performs an in-app navigation
 * when it can and reports "document" when the browser should load the URL
 * itself (external links, other pages in file mode). <Link> uses it so a
 * real <a href> click falls through to the browser in those cases.
 */
export function useNavigationController(): (href: string, options?: AppNavigateOptions) => NavigationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const latest = useRef({ navigate, location });
  useLayoutEffect(() => {
    latest.current = { navigate, location };
  });
  return useCallback(
    (href: string, options: AppNavigateOptions = {}) =>
      navigateWithin(href, options, latest.current.navigate, latest.current.location),
    []
  );
}

/**
 * Navigate from code with exactly the same rules as <Link> (view
 * transitions, same-page reset, fragment state, file mode). Stable.
 *   const go = useAppNavigate();
 *   go(entry.href);
 *   go(paths.work("did"), { replace: true });
 */
export function useAppNavigate(): (href: string, options?: AppNavigateOptions) => void {
  const controller = useNavigationController();
  return useCallback(
    (href: string, options?: AppNavigateOptions) => {
      if (controller(href, options) === "app") return;
      if (/^(https?:)?\/\//i.test(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else if (options?.replace) {
        window.location.replace(fileHref(href));
      } else {
        window.location.assign(fileHref(href));
      }
    },
    [controller]
  );
}

/**
 * The current pathname in canonical form (always a trailing slash, e.g.
 * "/work/"), so it compares equal to `paths.*` values. Hash and query are
 * not included — use useLocation() for those.
 */
export function usePathname(): string {
  return pathOf(useLocation().pathname);
}

/** next/navigation-style router. push/replace follow the same rules as <Link>. */
export function useRouter(): { push: (href: string) => void; replace: (href: string) => void; back: () => void } {
  const go = useAppNavigate();
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => go(href),
      replace: (href: string) => go(href, { replace: true }),
      back: () => (isFileMode() ? window.history.back() : navigate(-1)),
    }),
    [go, navigate]
  );
}
