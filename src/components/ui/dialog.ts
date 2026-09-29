import { useEffect, useLayoutEffect, useMemo, useSyncExternalStore, type RefObject } from "react";

/**
 * DIALOG BEHAVIOUR HOOKS
 *
 * One focus trap for every modal surface on the site — the photo
 * Lightbox (useFocusTrap), the menu and the Easter egg (useModalLayer,
 * from components/nav/SiteChrome.tsx) — so they all behave the same way:
 * focus moves in and is trapped inside, the page behind is inert and
 * can't scroll, and focus goes back where it came from on close.
 */

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "video[controls]",
  "audio[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Visible, tabbable descendants of `root`, in DOM order. */
export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0
  );
}

export interface ModalLayerOptions {
  /** Focused when the layer opens (defaults to its first focusable element, then the layer). */
  initialFocus?: RefObject<HTMLElement | null>;
  /**
   * Return focus to whatever had it before the layer opened, when it
   * closes. Default true. Pass false for a layer whose links navigate
   * (the menu, the Easter egg): the new page takes focus then, and the
   * caller restores focus itself when the visitor closes the layer.
   */
  restoreFocus?: boolean;
  /**
   * Selectors of page regions to make `inert` while open — never the
   * layer itself or anything containing it, and anything already inert
   * is left alone. Pass a stable (module-level) array.
   */
  inert?: readonly string[];
}

const NO_REGIONS: readonly string[] = [];

/**
 * THE focus trap. While `active`: marks the `inert` regions, moves focus
 * into `ref` (next frame), wraps Tab / Shift+Tab inside it and pulls back
 * any focus that escapes by other means; on close it undoes all of that
 * and (by default) restores focus.
 *
 * It runs as a *layout* effect so that when a link inside the layer
 * navigates, the layer is torn down in the same commit, before the
 * ScrollManager moves focus to the new page's <main> — so <main> is no
 * longer inert and nothing drags focus back into the closing layer.
 *
 *   useModalLayer(rootRef, open, { initialFocus: firstLinkRef, inert: ["#main"], restoreFocus: false });
 */
export function useModalLayer(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  { initialFocus, restoreFocus = true, inert = NO_REGIONS }: ModalLayerOptions = {}
): void {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!active || !root) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const madeInert: HTMLElement[] = [];
    for (const selector of inert) {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (el.hasAttribute("inert") || el.contains(root) || root.contains(el)) return;
        el.setAttribute("inert", "");
        madeInert.push(el);
      });
    }

    const frame = requestAnimationFrame(() => {
      const target = initialFocus?.current ?? getFocusable(root)[0] ?? root;
      target.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = getFocusable(root);
      if (items.length === 0) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !root.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !root.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    // Focus escaping by other means (a programmatic focus elsewhere).
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !root.contains(event.target)) {
        (getFocusable(root)[0] ?? root).focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      for (const el of madeInert) el.removeAttribute("inert");
      if (restoreFocus && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref, active, initialFocus, restoreFocus, inert]);
}

export interface FocusTrapOptions {
  /** Element to focus on open (defaults to the first focusable, then the container). */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Return focus to the previously focused element on close. Default true. */
  restoreFocus?: boolean;
  /**
   * Selector of the page content to mark `inert` while open — only for
   * dialogs rendered *outside* it (e.g. portalled to <body>). Leave unset
   * for dialogs that live inside #root.
   */
  inertSelector?: string;
}

/**
 * useModalLayer with a single inert selector — the shape the Lightbox
 * uses: useFocusTrap(ref, open, { initialFocus, inertSelector: "#root" }).
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  { initialFocus, restoreFocus = true, inertSelector }: FocusTrapOptions = {}
): void {
  const inert = useMemo(() => (inertSelector ? [inertSelector] : NO_REGIONS), [inertSelector]);
  useModalLayer(ref, active, { initialFocus, restoreFocus, inert });
}

/* Scroll lock is reference-counted so stacked dialogs can't unlock each other. */
let lockCount = 0;
let savedStyles: { htmlOverflow: string; bodyOverflow: string; paddingRight: string } | null = null;

/**
 * Stops the page behind a dialog from scrolling while `active`, without
 * the layout jump of a disappearing scrollbar. The compensation width is
 * also exposed as `--scrollbar-compensation` on <html> so fixed chrome
 * (the top bar) can offset itself too.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;

    if (lockCount === 0) {
      const gutterStable = getComputedStyle(html).scrollbarGutter?.includes("stable");
      const scrollbar = gutterStable ? 0 : Math.max(0, window.innerWidth - html.clientWidth);
      savedStyles = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        paddingRight: body.style.paddingRight,
      };
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
      html.style.setProperty("--scrollbar-compensation", `${scrollbar}px`);
      html.setAttribute("data-scroll-locked", "");
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0 && savedStyles) {
        html.style.overflow = savedStyles.htmlOverflow;
        body.style.overflow = savedStyles.bodyOverflow;
        body.style.paddingRight = savedStyles.paddingRight;
        html.style.removeProperty("--scrollbar-compensation");
        html.removeAttribute("data-scroll-locked");
        savedStyles = null;
      }
    };
  }, [active]);
}

const noopSubscribe = () => () => {};

/**
 * False during prerender and hydration, true afterwards — for things that
 * can only exist in the browser (portals). Hydration-safe by construction.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
