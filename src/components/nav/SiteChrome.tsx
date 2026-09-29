import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { prefersReducedMotion } from "@/animations";
import { EasterEggDialog } from "@/components/easter-egg/EasterEgg";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useModalLayer, useScrollLock } from "@/components/ui/dialog";
import { usePathname } from "@/routing/navigation";
import { useRouteReset } from "@/routing/routeReset";
import { MenuOverlay } from "./MenuOverlay";
import { menuKeyFor } from "./menuModel";
import { SectionIndicator } from "./SectionIndicator";
import { Wordmark } from "./Wordmark";

/**
 * GLOBAL CHROME — the fixed top bar every page shares, the full-screen
 * menu it opens, and the Easter egg dialog behind the wordmark.
 *
 *   TANUSHH (Home)                  01 / 04 · Story   [☾ Dark]   [Menu ☰]
 *
 * Top bar: transparent at the very top of a page; after ~12px of scroll a
 * translucent, blurred surface with a hairline and a soft shadow fades in
 * (a data attribute set from one passive scroll listener + rAF — no React
 * state). On the first load of Home it arrives as step 6 of the hero's
 * entrance (after the name and statement); everywhere else, and on
 * client-side navigation, it's simply there. It carries data-vt="chrome"
 * so route transitions leave it still (styles/transitions.css).
 *
 * Menu: see MenuOverlay. While it's open the whole chrome — the bar
 * (wordmark, theme, Close) plus the menu — is one modal dialog labelled
 * "Menu": focus is trapped inside exactly that element, the page behind
 * is inert and can't scroll (its scroll position is kept), Esc, Close
 * and the Back control close it and return focus to the Menu button, and
 * any navigation (including re-opening the current page) closes it at
 * once so the route transition takes over.
 *
 * Easter egg: three quick clicks/taps on the wordmark (see Wordmark,
 * EasterEggDialog). Styles: src/styles/chrome.css, easter-egg.css.
 */

/** Scroll distance (px) after which the bar gets its surface. */
const ELEVATE_AT = 12;
/**
 * The wordmark's first click starts the trip Home (or re-opens Home) and
 * the third opens the Easter egg; on a slow device that navigation can
 * land just after the egg opened. For this long it doesn't close the egg.
 */
const EGG_GRACE_MS = 1200;
/** Page regions made inert while the menu is open. */
const MENU_INERT = ["#main", "#site-footer"] as const;
/** …and while the Easter egg is open (the top bar too). */
const EGG_INERT = ["#main", "#site-footer", "[data-chrome-root]"] as const;
/** Accessible name of the open menu (interface word, not content). */
const MENU_LABEL = "Menu";

export function SiteChrome() {
  const pathname = usePathname();
  const menuId = useId().replace(/[^\w-]/g, "") + "-menu";

  const chromeRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuFocusRef = useRef<HTMLAnchorElement>(null);
  const wordmarkRef = useRef<HTMLAnchorElement>(null);
  const eggRef = useRef<HTMLDivElement>(null);
  const eggFocusRef = useRef<HTMLInputElement>(null);
  const restoreMenuFocus = useRef(false);
  const restoreEggFocus = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [eggOpen, setEggOpen] = useState(false);
  // Bumping these remounts the AnimatePresence around a layer, which drops
  // it instantly (no exit animation) — used when a navigation closes it.
  const [menuGen, setMenuGen] = useState(0);
  const [eggGen, setEggGen] = useState(0);
  const [eggGrace, setEggGrace] = useState(false);

  // Home's first load: the bar enters as step 6 of the hero sequence.
  const [entrance] = useState(() => (pathname === "/" ? "pending" : "none"));

  // Any page change closes both layers instantly.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    if (menuOpen) {
      setMenuOpen(false);
      setMenuGen((g) => g + 1);
    }
    if (eggOpen && !eggGrace) {
      setEggOpen(false);
      setEggGen((g) => g + 1);
    }
  }

  // …and so does re-opening the current page from a link (menu item, Home, the egg's link).
  useRouteReset(() => {
    setMenuOpen(false);
    setMenuGen((g) => g + 1);
    if (eggGrace) return;
    setEggOpen(false);
    setEggGen((g) => g + 1);
  });

  useEffect(() => {
    if (!eggGrace) return;
    const timer = window.setTimeout(() => setEggGrace(false), EGG_GRACE_MS);
    return () => window.clearTimeout(timer);
  }, [eggGrace]);

  // Focus returns by hand (below): only when the visitor closes a layer, never after a navigation.
  useModalLayer(chromeRef, menuOpen, { initialFocus: menuFocusRef, inert: MENU_INERT, restoreFocus: false });
  useModalLayer(eggRef, eggOpen, { initialFocus: eggFocusRef, inert: EGG_INERT, restoreFocus: false });
  useScrollLock(menuOpen || eggOpen);

  // Esc closes whichever layer is open and hands focus back to its opener.
  useEffect(() => {
    if (!menuOpen && !eggOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      if (eggOpen) {
        restoreEggFocus.current = true;
        setEggOpen(false);
      } else {
        restoreMenuFocus.current = true;
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, eggOpen]);

  // Focus goes back to the Menu button / the wordmark after a visitor closes a layer
  // (not after a navigation — the ScrollManager moves focus to the new page).
  useEffect(() => {
    if (menuOpen || !restoreMenuFocus.current) return;
    restoreMenuFocus.current = false;
    menuButtonRef.current?.focus({ preventScroll: true });
  }, [menuOpen]);

  useEffect(() => {
    if (eggOpen || !restoreEggFocus.current) return;
    restoreEggFocus.current = false;
    wordmarkRef.current?.focus({ preventScroll: true });
  }, [eggOpen]);

  // Surface after the first few pixels of scroll.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;
    let elevated: boolean | null = null;
    const update = () => {
      frame = 0;
      const next = window.scrollY > ELEVATE_AT;
      if (next === elevated) return;
      elevated = next;
      bar.toggleAttribute("data-elevated", next);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Home entrance: prerendered hidden (data-entrance="pending"), played on hydration.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || bar.dataset.entrance !== "pending") return;
    bar.dataset.entrance = prefersReducedMotion() ? "none" : "play";
  }, []);

  const toggleMenu = () => {
    if (menuOpen) restoreMenuFocus.current = true;
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    restoreMenuFocus.current = true;
    setMenuOpen(false);
  };

  const openEgg = () => {
    setMenuOpen(false);
    setEggOpen(true);
    setEggGrace(true);
  };

  const closeEgg = () => {
    restoreEggFocus.current = true;
    setEggOpen(false);
  };

  return (
    <>
      {/* The focus trap's element is the dialog: while the menu is open, bar + menu are one modal. */}
      <div
        ref={chromeRef}
        className="chrome"
        data-chrome-root=""
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen ? true : undefined}
        aria-label={menuOpen ? MENU_LABEL : undefined}
      >
        <header
          ref={barRef}
          className="chrome-bar"
          data-vt="chrome"
          data-entrance={entrance}
          data-menu-open={menuOpen ? "" : undefined}
        >
          <div className="chrome-bar__surface" aria-hidden="true" />
          <div className="chrome-bar__inner">
            <div className="chrome-bar__start">
              <Wordmark ref={wordmarkRef} onSecret={openEgg} />
            </div>
            <div className="chrome-bar__end">
              <SectionIndicator pathname={pathname} />
              <ThemeToggle showLabel className="chrome-theme" />
              <button
                ref={menuButtonRef}
                type="button"
                className="menu-toggle"
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                aria-controls={menuOpen ? menuId : undefined}
                onClick={toggleMenu}
                data-cursor={menuOpen ? "close" : "view"}
                data-cursor-label={menuOpen ? undefined : "Menu"}
              >
                <span className="menu-toggle__label" aria-hidden="true">
                  <span className="menu-toggle__word">Menu</span>
                  <span className="menu-toggle__word">Close</span>
                </span>
                <span className="menu-toggle__icon" aria-hidden="true">
                  <span className="menu-toggle__line" />
                  <span className="menu-toggle__line" />
                  <span className="menu-toggle__line" />
                </span>
                <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence key={menuGen}>
          {menuOpen && (
            <MenuOverlay
              key="menu"
              id={menuId}
              pathname={pathname}
              currentKey={menuKeyFor(pathname)}
              onClose={closeMenu}
              focusRef={menuFocusRef}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence key={eggGen}>
        {eggOpen && <EasterEggDialog key="egg" ref={eggRef} inputRef={eggFocusRef} onClose={closeEgg} />}
      </AnimatePresence>
    </>
  );
}
