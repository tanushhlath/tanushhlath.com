import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType, type Location } from "react-router-dom";
import { isFileMode } from "./fileMode";
import { isStateFragment, pathOf } from "./paths";
import { findAnchor, focusWithoutScroll, isHashStateNavigation, scrollToElement, scrollToTop } from "./scroll";
import { isReturnVisit, persistPositions, rememberPosition, savedPosition, scrollKey } from "./scrollMemory";

/**
 * SCROLL MANAGER — the one place that decides where the window scrolls
 * after the URL changes. Mounted once, in App.
 *
 *   new page (link / useAppNavigate)  → top, or the #anchor once it exists
 *   Back / Forward                    → exactly where the visitor was
 *   reload / return from another site → where the visitor was
 *   fresh deep link /me/#skills       → the #skills section
 *   UI-state fragments (/work/#did)   → never moves the page
 *
 * It runs in a layout effect, so for animated navigations it scrolls
 * inside the view transition's update — the incoming snapshot already
 * shows the right position and the animation never fights the scroll.
 * Waits for late targets (≤ 2.5 s, one check per frame) and gives up as
 * soon as the visitor scrolls, taps or types. The header offset comes
 * from `scroll-margin-top` (src/styles/transitions.css).
 */

const WAIT_LIMIT_MS = 2500;
const USER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/** Stops the current "wait for the page, then scroll" loop, if any. */
let stopPending: (() => void) | null = null;

function cancelPending(): void {
  stopPending?.();
  stopPending = null;
}

/** Run `attempt` now, then once per frame until it succeeds, times out or the visitor takes over. */
function retryUntil(attempt: () => boolean): void {
  cancelPending();
  if (attempt()) return;

  const deadline = performance.now() + WAIT_LIMIT_MS;
  let frame = 0;
  const onUserInput = () => cancelPending();
  const tick = () => {
    if (attempt() || performance.now() > deadline) cancelPending();
    else frame = requestAnimationFrame(tick);
  };

  for (const type of USER_INPUT) window.addEventListener(type, onUserInput, { capture: true, passive: true });
  stopPending = () => {
    cancelAnimationFrame(frame);
    for (const type of USER_INPUT) window.removeEventListener(type, onUserInput, { capture: true });
  };
  frame = requestAnimationFrame(tick);
}

/** Scroll to a saved position, waiting until the page is tall enough to reach it. */
function restorePosition(y: number): void {
  retryUntil(() => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(y, max), left: 0, behavior: "instant" });
    return max >= y;
  });
}

/** How long a fragment target is held in place after the first scroll to it. */
const SETTLE_MS = 1500;

/**
 * The element's position in the document from layout alone (offsetTop
 * chain) — unaffected by transforms, so a reveal animating on the target
 * itself isn't mistaken for the page moving.
 */
function layoutTop(element: HTMLElement): number {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return top;
}

/**
 * Scroll to the element a fragment names, as soon as it exists — then
 * hold it just below the header for a moment: fonts, images, hydration
 * and sticky/scroll-linked sections can still change the height of what's
 * above it after the first jump (seen on /story/ deep links). The hold
 * ends early the moment the visitor scrolls, taps or types.
 */
function scrollToFragment(fragment: string, moveFocus: boolean): void {
  let target: HTMLElement | null = null;
  let holdUntil = 0;
  retryUntil(() => {
    if (!target) {
      target = findAnchor(fragment);
      if (!target) return false;
      scrollToElement(target, false);
      if (moveFocus) focusWithoutScroll(target);
      holdUntil = performance.now() + SETTLE_MS;
      return false; // keep ticking: hold the position while layout settles
    }
    if (!target.isConnected) return true;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const desired = Math.min(max, Math.max(0, layoutTop(target) - margin));
    if (Math.abs(window.scrollY - desired) > 2) window.scrollTo({ top: desired, left: 0, behavior: "instant" });
    return performance.now() > holdUntil;
  });
}

/** After a page change, start keyboard and screen-reader users at the new page's content. */
function focusPage(): void {
  const main = document.getElementById("main");
  if (main) focusWithoutScroll(main);
}

/** The fragment if it names a section to scroll to — "" for none or for UI state (/work/#did). */
function anchorOf(location: Location): string {
  const fragment = location.hash.slice(1);
  return fragment && !isStateFragment(pathOf(location.pathname), fragment) ? fragment : "";
}

/**
 * In file mode the router lives in memory; mirror its query and fragment
 * into the address bar so a refresh (or a copied file URL) keeps the open
 * tab/lens.
 */
function syncFileModeUrl({ search, hash }: Location): void {
  if (!isFileMode() || (window.location.search === search && window.location.hash === hash)) return;
  try {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}${hash}`);
  } catch {
    // Not allowed in this context; the in-app state is still correct.
  }
}

export function ScrollManager(): null {
  const location = useLocation();
  const navigationType = useNavigationType();
  const handled = useRef<Location | null>(null);
  const activeKey = useRef<string | null>(null);

  // Remember the position of the current entry as the visitor scrolls.
  useEffect(() => {
    const onScroll = () => rememberPosition(activeKey.current, window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persistPositions);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persistPositions);
    };
  }, []);

  useLayoutEffect(() => {
    const previous = handled.current;
    if (previous === location) return; // StrictMode re-run of the same commit
    handled.current = location;
    activeKey.current = scrollKey(location.key);
    syncFileModeUrl(location);

    const anchor = anchorOf(location);

    // First render: a fresh visit, a reload, or a return from another site.
    if (!previous) {
      const saved = isReturnVisit() ? savedPosition(activeKey.current) : undefined;
      if (saved !== undefined) restorePosition(saved);
      else if (anchor) scrollToFragment(anchor, false);
      return;
    }

    persistPositions();
    const samePage = pathOf(previous.pathname) === pathOf(location.pathname);

    // Back / Forward.
    if (navigationType === "POP") {
      // Stepping through UI states (lenses, tabs) on one page never scrolls.
      if (samePage && !anchor && !anchorOf(previous)) return;
      const saved = savedPosition(activeKey.current);
      if (saved !== undefined) restorePosition(saved);
      else if (anchor) scrollToFragment(anchor, false);
      else if (!samePage) scrollToTop();
      return;
    }

    // A link or useAppNavigate. Fragment-state updates (useHashState,
    // lens/filter links) keep the scroll position.
    if (isHashStateNavigation(location.state) || (samePage && !anchor && location.hash)) return;
    if (anchor) {
      if (!findAnchor(anchor)) scrollToTop(); // don't linger at the old page's offset while waiting
      scrollToFragment(anchor, true);
    } else {
      cancelPending();
      scrollToTop();
      // A new page — or the same page re-opened from its own link, whose
      // focused link (in the closed menu / the remounted page) is gone.
      const lostFocus = !document.activeElement || document.activeElement === document.body;
      if (!samePage || lostFocus) focusPage();
    }
  }, [location, navigationType]);

  return null;
}
