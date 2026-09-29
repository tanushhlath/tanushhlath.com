import { flushSync } from "react-dom";
import { prefersReducedMotion } from "./env";
import type { RouteFamily } from "./paths";

/**
 * ROUTE TRANSITIONS
 *
 * Route changes run inside the browser's View Transitions API: the old
 * page is snapshotted, the new route is rendered synchronously inside the
 * update callback (the router is created with `useTransitions={false}`,
 * see main.tsx, so `flushSync` really commits it), and
 * src/styles/transitions.css animates between the two.
 *
 * While a transition runs, <html> carries
 *   data-nav-from / data-nav-to   the route families (see routeFamily())
 *   data-nav-type                 "push" (a route change) or "reset" (the
 *                                 current page re-opened from a link)
 * which the CSS keys its per-destination animations on. They're removed
 * once the transition finishes, so they never affect the theme toggle's
 * own view transition (html.vt-theme).
 *
 * No View Transitions support, a hidden tab or reduced motion → the
 * update simply runs, with no animation.
 */

export type RouteTransitionType = "push" | "reset";

export interface RouteTransitionOptions {
  from: RouteFamily;
  to: RouteFamily;
  type: RouteTransitionType;
  /** false → run the update without a view transition. */
  animate?: boolean;
  /** Runs right after the update is committed (inside the transition), e.g. to scroll. */
  afterUpdate?: () => void;
}

/**
 * `view-transition-name` for a record's shared cover: set it on ONE card
 * cover per page and on the detail hero, and the image morphs between
 * them. Example: `<MediaCover vtName={workTransitionName(id)} … />`.
 */
export const workTransitionName = (id: string): string => `work-${id}`;

let activeToken = 0;

function canAnimate(): boolean {
  if (typeof document === "undefined" || typeof document.startViewTransition !== "function") return false;
  if (document.visibilityState !== "visible" || prefersReducedMotion()) return false;
  // Never interrupt the theme toggle's wash.
  return !document.documentElement.classList.contains("vt-theme");
}

/** Perform a route update, animated with a view transition when possible. */
export function runRouteTransition(update: () => void, options: RouteTransitionOptions): void {
  const root = document.documentElement;
  const token = ++activeToken;
  const clear = () => {
    if (token !== activeToken) return; // a newer navigation owns the attributes now
    delete root.dataset.navFrom;
    delete root.dataset.navTo;
    delete root.dataset.navType;
  };

  root.dataset.navFrom = options.from;
  root.dataset.navTo = options.to;
  root.dataset.navType = options.type;

  if (options.animate === false || !canAnimate()) {
    update();
    options.afterUpdate?.();
    requestAnimationFrame(clear);
    return;
  }

  try {
    const transition = document.startViewTransition(() => {
      flushSync(update);
      options.afterUpdate?.();
    });
    transition.finished.then(clear, clear);
  } catch {
    // startViewTransition can throw on an invalid document state; navigate anyway.
    update();
    options.afterUpdate?.();
    clear();
  }
}
