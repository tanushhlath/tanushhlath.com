import { useState, type FocusEvent, type PointerEvent, type Ref } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { DUR, EASE, useReducedMotionSafe } from "@/animations";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { site } from "@/lib/content";
import Link from "@/routing/Link";
import { backLabelFor, getMenu, type MenuEntry, type MenuKey } from "./menuModel";
import { MenuPreviewPanel } from "./MenuPreview";

/**
 * MENU OVERLAY — the full-screen menu opened from the top bar.
 *
 *   Home · 01 Story · 02 Work · 03 Me · 04 Beyond · Archive · Explore
 *
 * Labels, descriptions and order come from `navigation` in
 * src/content/site.ts; the previews from menuModel.ts. Hovering (or
 * keyboard-focusing) an item makes it dominant — it shifts, its
 * description slides in, the others quieten, the background tint leans
 * toward that route's atmosphere and its preview appears. Touch screens
 * show every description up front (chrome.css, `hover: none`).
 *
 * Behaviour lives in SiteChrome, which also makes the whole chrome (top
 * bar + this panel) the modal dialog while the menu is open: focus trap +
 * inert page (useModalLayer), scroll lock that keeps the page's position,
 * Esc, and closing on navigation. Links are the site <Link>, so the
 * current page's item (or Home on Home) re-opens that page at the top;
 * "Back to …" only closes the menu — same page, same scroll position,
 * same tab state, no history — so it names the page you're on (a Work
 * record's own title on its detail page).
 */

export interface MenuOverlayProps {
  id: string;
  /** Canonical pathname ("/work/wizmo/"). */
  pathname: string;
  /** The menu entry the current page belongs to (null on the 404). */
  currentKey: MenuKey | null;
  /** Close without navigating (the Back control). */
  onClose: () => void;
  /** Receives the element to focus when the menu opens. */
  focusRef: Ref<HTMLAnchorElement>;
}

export function MenuOverlay({ id, pathname, currentKey, onClose, focusRef }: MenuOverlayProps) {
  const reduced = useReducedMotionSafe();
  const menu = getMenu();
  // The hovered / keyboard-focused item. Only mouse hover quietens the
  // others (a keyboard user reading down the list keeps every item legible).
  const [active, setActive] = useState<{ key: MenuKey; via: "pointer" | "keyboard" } | null>(null);
  const activeKey = active?.key ?? null;
  const shownKey: MenuKey = activeKey ?? currentKey ?? menu.home.key;
  const shown = menu.all.find((e) => e.key === shownKey);
  // The page you go "back to" — the one you're on (none on the 404: the control just reads "Back").
  const backTo = backLabelFor(pathname);
  const focusKey = currentKey ?? menu.home.key;
  const variants = overlayVariants(reduced);

  const clearIfLeaving = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null);
  };

  const row = (entry: MenuEntry, order: number, size: "lg" | "md") => (
    <MenuRow
      key={entry.key}
      entry={entry}
      order={order}
      size={size}
      isPage={entry.href === pathname}
      inSection={entry.key === currentKey}
      active={entry.key === activeKey}
      onActivate={(key, via) => setActive({ key, via })}
      focusRef={entry.key === focusKey ? focusRef : undefined}
      reduced={reduced}
    />
  );

  return (
    <motion.div
      id={id}
      className="menu"
      data-tone={shownKey}
      variants={variants.overlay}
      initial="closed"
      animate="open"
      exit="closed"
    >
      <div className="menu__tint" aria-hidden="true" />
      <div className="menu__rules" aria-hidden="true" />

      <div className="menu__numeral" aria-hidden="true">
        <AnimatePresence initial={false}>
          {shown?.index && (
            <motion.span
              key={shown.index}
              className="menu__numeral-digit"
              initial={{ opacity: 0, y: reduced ? 0 : 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -60 }}
              transition={{ duration: DUR.slow, ease: EASE.enter }}
            >
              {shown.index}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="menu__scroll">
        <motion.div className="menu__inner" variants={variants.inner}>
          <motion.div className="menu__top" variants={variants.fade} custom={0}>
            <button type="button" className="menu__back" onClick={onClose} data-cursor="back">
              <span className="menu__back-arrow" aria-hidden="true">
                ←
              </span>
              {backTo ? (
                <span className="menu__back-text">
                  Back to <span className="menu__back-page">{backTo}</span>
                </span>
              ) : (
                <span>Back</span>
              )}
            </button>
          </motion.div>

          <div className="menu__grid">
            <nav
              aria-label="Site"
              className="menu__nav"
              data-hovering={active?.via === "pointer" ? "" : undefined}
              onPointerLeave={(e: PointerEvent) => e.pointerType === "mouse" && setActive(null)}
              onBlur={clearIfLeaving}
            >
              <ul className="menu-list">
                {[menu.home, ...menu.primary].map((entry, i) => row(entry, i, "lg"))}
              </ul>
              <ul className="menu-list menu-list--secondary">
                {menu.secondary.map((entry, i) => row(entry, menu.primary.length + 1 + i, "md"))}
              </ul>
            </nav>

            <motion.div className="menu__aside" variants={variants.fade} custom={3}>
              <MenuPreviewPanel entries={menu.all} shownKey={shownKey} />
            </motion.div>
          </div>

          <motion.div className="menu__meta" variants={variants.fade} custom={8}>
            <p className="menu__location">{site.location.short}</p>
            <CopyEmail email={site.email} className="menu__email" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface MenuRowProps {
  entry: MenuEntry;
  order: number;
  size: "lg" | "md";
  /** This item is the page you're on. */
  isPage: boolean;
  /** You're somewhere inside this item's section (e.g. a Work detail page). */
  inSection: boolean;
  active: boolean;
  onActivate: (key: MenuKey, via: "pointer" | "keyboard") => void;
  focusRef?: Ref<HTMLAnchorElement>;
  reduced: boolean;
}

function MenuRow({ entry, order, size, isPage, inSection, active, onActivate, focusRef, reduced }: MenuRowProps) {
  const variants = rowVariants(reduced);
  return (
    <motion.li className="menu-row" variants={variants.row} custom={order}>
      <Link
        ref={focusRef}
        href={entry.href}
        className="menu-item"
        data-size={size}
        data-active={active ? "" : undefined}
        data-current={isPage ? "page" : inSection ? "section" : undefined}
        aria-current={isPage ? "page" : undefined}
        data-cursor="view"
        data-cursor-label="Go"
        onPointerEnter={(e) => e.pointerType === "mouse" && onActivate(entry.key, "pointer")}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && onActivate(entry.key, "keyboard")}
      >
        <span className="menu-item__index" data-mark={entry.index ? undefined : "home"} aria-hidden="true">
          {entry.index ?? <span className="menu-item__home-mark" />}
        </span>
        <span className="menu-item__mask">
          <motion.span className="menu-item__title" variants={variants.title} custom={order}>
            {entry.label}
          </motion.span>
        </span>
        <span className="menu-item__desc">{entry.description}</span>
      </Link>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

/** Delay of the first row, so the curtain is mostly down before the type rises. */
const ROW_START = 0.16;
const ROW_GAP = 0.045;

function overlayVariants(reduced: boolean): Record<"overlay" | "inner" | "fade", Variants> {
  if (reduced) {
    return {
      overlay: {
        closed: { opacity: 0, transition: { duration: DUR.fast } },
        open: { opacity: 1, transition: { duration: DUR.fast } },
      },
      inner: { closed: {}, open: {} },
      fade: { closed: { opacity: 0 }, open: { opacity: 1 } },
    };
  }
  return {
    overlay: {
      // A curtain that drops from the top bar (soft rounded lip), and lifts back up.
      closed: {
        clipPath: "inset(0% 0% 100% 0% round 0px 0px 48px 48px)",
        transition: { duration: 0.46, ease: EASE.exit, delay: 0.06 },
      },
      open: {
        clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)",
        transition: { duration: 0.62, ease: EASE.cinematic },
      },
    },
    inner: {
      closed: { y: -28, transition: { duration: 0.4, ease: EASE.exit } },
      open: { y: 0, transition: { duration: 0.8, ease: EASE.enter } },
    },
    fade: {
      closed: { opacity: 0, y: -8, transition: { duration: DUR.micro } },
      open: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: DUR.base, ease: EASE.enter, delay: ROW_START + i * ROW_GAP },
      }),
    },
  };
}

function rowVariants(reduced: boolean): Record<"row" | "title", Variants> {
  if (reduced) {
    return {
      row: { closed: { opacity: 0 }, open: { opacity: 1, transition: { duration: DUR.fast } } },
      title: { closed: {}, open: {} },
    };
  }
  return {
    row: {
      closed: { opacity: 0, transition: { duration: DUR.micro } },
      open: (i: number) => ({
        opacity: 1,
        transition: { duration: DUR.fast, delay: ROW_START + i * ROW_GAP },
      }),
    },
    title: {
      closed: { y: "130%", transition: { duration: DUR.micro, ease: EASE.exit } },
      open: (i: number) => ({
        y: "0%",
        transition: { duration: DUR.slow, ease: EASE.enter, delay: ROW_START + i * ROW_GAP },
      }),
    },
  };
}
