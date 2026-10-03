import { prefersReducedMotion } from "./env";

/**
 * Scroll helpers shared by <Link>, useAppNavigate and <ScrollManager>.
 * All of them are browser-only (call from handlers/effects).
 *
 * Header offset is handled in CSS (`scroll-margin-top` on every [id], see
 * src/styles/transitions.css), so scrolling to an element lands it just
 * below the fixed top bar.
 */

/**
 * History-state marker for navigations that only change UI state in the
 * fragment (tabs, lenses, filters). <ScrollManager> leaves the scroll
 * position alone for them.
 */
export const HASH_STATE = { hashState: true } as const;

export function isHashStateNavigation(state: unknown): boolean {
  return typeof state === "object" && state !== null && (state as { hashState?: unknown }).hashState === true;
}

/** "#caf%C3%A9" / "café" → "café" (never throws). */
export function decodeFragment(fragment: string): string {
  const raw = fragment.replace(/^#/, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** The element a fragment points at, if it's in the document. */
export function findAnchor(fragment: string): HTMLElement | null {
  const id = decodeFragment(fragment);
  return id ? document.getElementById(id) : null;
}

/** Jump to the top of the page (ignores CSS `scroll-behavior: smooth`). */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

/** Scroll an element to the top of the viewport (below the header). */
export function scrollToElement(element: Element, smooth: boolean): void {
  element.scrollIntoView({
    block: "start",
    behavior: smooth && !prefersReducedMotion() ? "smooth" : "instant",
  });
}

const FOCUSABLE = "a[href], button, input, select, textarea, summary, [tabindex], [contenteditable='true']";

/**
 * Move keyboard focus to an in-page target without scrolling (the way a
 * native in-page link would), so the next Tab continues from there.
 */
export function focusWithoutScroll(element: HTMLElement): void {
  if (!element.matches(FOCUSABLE)) {
    element.setAttribute("tabindex", "-1");
    element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  }
  element.focus({ preventScroll: true });
}

/** Start keyboard and screen-reader users at the page's content (#main). */
export function focusPage(): void {
  const main = document.getElementById("main");
  if (main) focusWithoutScroll(main);
}

/**
 * After re-opening the current page: if the focused element has gone (or
 * goes once the menu that held it has closed, a frame or two later), start
 * again at the page's content — never leave keyboard focus on <body>. A
 * focus that survives stays put.
 */
export function refocusIfLost(): void {
  const check = () => {
    const el = document.activeElement;
    if (!el || el === document.body || !el.isConnected) focusPage();
  };
  check();
  requestAnimationFrame(() => requestAnimationFrame(check));
  window.setTimeout(check, 350);
}

/**
 * Same-page anchor: smooth-scroll to the element (instant under reduced
 * motion) and move focus there. The URL is left alone, so fragment state
 * (e.g. the open Work lens) survives. Returns false if there's no target.
 */
export function scrollToAnchor(fragment: string): boolean {
  if (!decodeFragment(fragment)) {
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
    return true;
  }
  const element = findAnchor(fragment);
  if (!element) return false;
  scrollToElement(element, true);
  focusWithoutScroll(element);
  return true;
}
