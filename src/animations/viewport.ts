import { useCallback, useState, useSyncExternalStore, type RefObject } from "react";
import { notifyRevealsStarted } from "./boot";
import { isBrowser } from "./env";
import { startScrollDirection } from "./scrollDirection";
import type { StaggerGroup, StaggerMember } from "./staggerGroup";
import { motionSettings } from "./tokens";

/**
 * VIEWPORT PHASES — the engine behind every reversible reveal.
 *
 *   "before"  below the reveal line — not reached yet, or scrolled back up past
 *   "inside"  on screen (its top has crossed the reveal line)
 *   "after"   scrolled past — entirely above the top of the screen
 *
 * One shared IntersectionObserver per `amount` (in practice one or two for
 * the whole site) instead of one per element: the browser batches every
 * observed element into a single callback per frame, and elements are
 * added/removed from it as components mount and unmount. Components only
 * re-render when their phase actually changes — never per scroll event.
 *
 * The observed band is the viewport with its bottom `amount` shaved off
 * (rootMargin), threshold 0. That makes tall elements work (a 5-screen-tall
 * section still counts as inside while any of it is on screen) and content
 * that grows while visible never "falls out" of view.
 *
 * Stranded elements: something whose top sits in that shaved-off strip even
 * when the page is scrolled all the way down (a footer line, the end of a
 * short page) can never cross the reveal line. `top - remainingScroll` is
 * the element's top at maximum scroll — it doesn't change while scrolling —
 * so those are detected up front and handed to a second, full-viewport
 * observer that reports them inside whenever any of them is on screen. They
 * still reverse and replay like everything else.
 *
 * The observer sees each element's transformed box, cut down (in Chrome) by
 * its own clip-path — the hidden poses in variants.ts follow rules that keep
 * that stable at the reveal line.
 */

export type ViewportPhase = "before" | "inside" | "after";

export interface ViewportState {
  phase: ViewportPhase;
  /** true once the observer has reported at least once. */
  reported: boolean;
  /** true when the element was already on screen when it mounted (page load, route change). */
  inViewOnMount: boolean;
  /**
   * Extra entrance delay (s) a `<Stagger>` group assigned because several of
   * its items entered together. Always 0 outside a group.
   */
  staggerDelay: number;
}

export interface ViewportOptions {
  /** Reveal line as a fraction of screen height up from the bottom edge. Default `motionSettings.revealOffset`. */
  amount?: number;
  /** Skip observing and report "inside" (always visible). */
  disabled?: boolean;
  /** Join a stagger group: items entering in the same frame are delayed in document order. */
  group?: StaggerGroup | null;
}

type PhaseListener = (phase: ViewportPhase) => void;

interface Pool {
  amount: number;
  /** The reveal band: viewport minus its bottom `amount`. */
  band: IntersectionObserver;
  /** Full-viewport observer for stranded elements, created on first need. */
  edge: IntersectionObserver | null;
  listeners: Map<Element, Set<PhaseListener>>;
  phases: Map<Element, ViewportPhase>;
  stranded: Set<Element>;
}

const pools = new Map<number, Pool>();
const noop = () => {};

function normalizeAmount(amount: number | undefined): number {
  const value = amount ?? motionSettings.revealOffset;
  if (!Number.isFinite(value)) return motionSettings.revealOffset;
  return Math.round(Math.min(0.9, Math.max(0, value)) * 100) / 100;
}

/** Remaining distance (px) the document can still scroll down. */
function remainingScroll(): number {
  const doc = document.documentElement;
  return Math.max(0, doc.scrollHeight - (window.scrollY + window.innerHeight));
}

/** Would this element's top still be at or below the reveal line at maximum scroll? */
function isStranded(top: number, bandBottom: number, remaining: number): boolean {
  return top - remaining >= bandBottom;
}

function isUnrendered(rect: DOMRectReadOnly): boolean {
  return rect.width === 0 && rect.height === 0;
}

function emit(pool: Pool, target: Element, phase: ViewportPhase) {
  if (pool.phases.get(target) === phase) return;
  pool.phases.set(target, phase);
  pool.listeners.get(target)?.forEach((listener) => listener(phase));
}

/** Hand a stranded element to the edge observer, which reports its phase from now on. */
function hold(pool: Pool, target: Element) {
  if (pool.stranded.has(target)) return;
  pool.stranded.add(target);
  pool.edge ??= new IntersectionObserver((entries) => onEdgeEntries(pool, entries), { threshold: 0 });
  pool.edge.observe(target);
}

function release(pool: Pool, target: Element) {
  if (!pool.stranded.delete(target)) return;
  pool.edge?.unobserve(target);
}

function onBandEntries(pool: Pool, entries: IntersectionObserverEntry[]) {
  let remaining = -1;
  for (const entry of entries) {
    const { target, boundingClientRect: rect } = entry;
    if (!pool.listeners.has(target)) continue;
    if (entry.isIntersecting) {
      release(pool, target);
      emit(pool, target, "inside");
      continue;
    }
    // Not rendered (display: none, collapsed panel) — waiting to be shown.
    if (isUnrendered(rect)) {
      release(pool, target);
      emit(pool, target, "before");
      continue;
    }
    const bounds = entry.rootBounds;
    const bandTop = bounds?.top ?? 0;
    const bandBottom = bounds?.bottom ?? window.innerHeight * (1 - pool.amount);
    if (rect.bottom <= bandTop) {
      release(pool, target);
      emit(pool, target, "after");
      continue;
    }
    if (rect.top >= bandBottom) {
      if (remaining < 0) remaining = remainingScroll();
      if (isStranded(rect.top, bandBottom, remaining)) {
        hold(pool, target);
        continue;
      }
      release(pool, target);
      emit(pool, target, "before");
      continue;
    }
    release(pool, target);
    // Vertically in the band but not intersecting. Entirely beside the
    // viewport means its own sideways offset (a drift or split waiting to
    // slide in) pushed it off screen: count it as reached, or it could never
    // come back. Otherwise an ancestor clips it (a horizontal carousel, a
    // collapsed panel) and it waits until it's actually uncovered.
    const left = bounds?.left ?? 0;
    const right = bounds?.right ?? window.innerWidth;
    emit(pool, target, rect.right <= left || rect.left >= right ? "inside" : "before");
  }
}

function onEdgeEntries(pool: Pool, entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    const { target, boundingClientRect: rect } = entry;
    if (!pool.stranded.has(target)) continue;
    if (entry.isIntersecting) {
      emit(pool, target, "inside");
      continue;
    }
    const bounds = entry.rootBounds;
    if (isUnrendered(rect) || rect.top >= (bounds?.bottom ?? window.innerHeight)) emit(pool, target, "before");
    else if (rect.bottom <= (bounds?.top ?? 0)) emit(pool, target, "after");
    // Beside the viewport (its own sideways offset) or clipped — same rule as the band.
    else emit(pool, target, rect.right <= (bounds?.left ?? 0) || rect.left >= (bounds?.right ?? window.innerWidth) ? "inside" : "before");
  }
}

function createPool(amount: number): Pool {
  const pool: Pool = {
    amount,
    edge: null,
    listeners: new Map(),
    phases: new Map(),
    stranded: new Set(),
    band: new IntersectionObserver((entries) => onBandEntries(pool, entries), {
      rootMargin: `0px 0px -${Math.round(amount * 100)}% 0px`,
      threshold: 0,
    }),
  };
  pools.set(amount, pool);
  return pool;
}

/*
 * Stranded re-check. The band observer only reports intersection changes,
 * so when the page gets shorter (a filter hides items, a panel collapses) or
 * the window is resized, an element waiting below the line might have just
 * become unreachable with no further callback. One ResizeObserver on <body>
 * (plus window resize), coalesced to a frame, re-tests the waiting elements.
 */
let watching = false;
let recheckFrame = 0;

function recheckStranded() {
  recheckFrame = 0;
  const remaining = remainingScroll();
  for (const pool of pools.values()) {
    const bandBottom = window.innerHeight * (1 - pool.amount);
    for (const [target, phase] of pool.phases) {
      if (phase !== "before" || pool.stranded.has(target)) continue;
      const rect = target.getBoundingClientRect();
      if (!isUnrendered(rect) && rect.top >= bandBottom && isStranded(rect.top, bandBottom, remaining)) {
        hold(pool, target);
      }
    }
  }
}

function scheduleRecheck() {
  if (!recheckFrame) recheckFrame = requestAnimationFrame(recheckStranded);
}

/*
 * Scroll jumps. An element that goes from above the screen to below it (or
 * back) without ever intersecting — an instant scrollTo, an anchor jump,
 * Home/End, a very fast fling — never gets an observer callback, so it
 * would keep its old phase and later arrive from the wrong side. When the
 * page moves more than half a screen between two frames, every element
 * that isn't on screen is re-classified from its actual position. Normal
 * scrolling never triggers this.
 */
let lastScrollY = 0;
let jumpFrame = 0;

function reclassifyOffscreen() {
  for (const pool of pools.values()) {
    const bandBottom = window.innerHeight * (1 - pool.amount);
    for (const [target, phase] of pool.phases) {
      if (phase === "inside" || pool.stranded.has(target)) continue;
      const rect = target.getBoundingClientRect();
      if (isUnrendered(rect)) continue;
      if (rect.bottom <= 0) emit(pool, target, "after");
      else if (rect.top >= bandBottom) emit(pool, target, "before");
    }
  }
}

function onScrollForJumps() {
  if (jumpFrame) return;
  jumpFrame = requestAnimationFrame(() => {
    jumpFrame = 0;
    const y = window.scrollY;
    const jumped = Math.abs(y - lastScrollY) > window.innerHeight * 0.5;
    lastScrollY = y;
    if (jumped) reclassifyOffscreen();
  });
}

function ensureWatchers() {
  if (watching) return;
  watching = true;
  notifyRevealsStarted();
  startScrollDirection();
  lastScrollY = window.scrollY;
  window.addEventListener("scroll", onScrollForJumps, { passive: true });
  window.addEventListener("resize", scheduleRecheck, { passive: true });
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(scheduleRecheck).observe(document.body);
}

/**
 * Low-level: observe one element. The listener fires with the current phase
 * shortly after observing, then on every change. Returns an unsubscribe.
 * Without IntersectionObserver support it reports "inside" immediately, so
 * content is never left hidden.
 */
export function observeViewport(target: Element, listener: PhaseListener, amount?: number): () => void {
  if (!isBrowser) return noop;
  if (typeof IntersectionObserver === "undefined") {
    listener("inside");
    return noop;
  }
  ensureWatchers();
  const key = normalizeAmount(amount);
  const pool = pools.get(key) ?? createPool(key);
  let listeners = pool.listeners.get(target);
  if (!listeners) {
    listeners = new Set();
    pool.listeners.set(target, listeners);
    pool.band.observe(target);
  } else {
    // Already observed by another hook: the observer won't report again, so
    // hand this listener the last known phase straight away.
    const known = pool.phases.get(target);
    if (known) listener(known);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    pool.listeners.delete(target);
    pool.phases.delete(target);
    release(pool, target);
    pool.band.unobserve(target);
    if (!pool.listeners.size) {
      pool.band.disconnect();
      pool.edge?.disconnect();
      pools.delete(key);
    }
  };
}

/* ------------------------------------------------------------------ */
/* React bindings                                                      */
/* ------------------------------------------------------------------ */

const INITIAL_STATE: ViewportState = { phase: "before", reported: false, inViewOnMount: false, staggerDelay: 0 };
const VISIBLE_STATE: ViewportState = { phase: "inside", reported: true, inViewOnMount: true, staggerDelay: 0 };
const getServerState = () => INITIAL_STATE;

function createViewportStore() {
  let state = INITIAL_STATE;

  function commit(phase: ViewportPhase, staggerDelay: number, notify: () => void) {
    if (state.reported && state.phase === phase) return;
    state = { phase, reported: true, inViewOnMount: !state.reported && phase === "inside", staggerDelay };
    notify();
  }

  return {
    get: () => state,
    observe(
      target: Element | null,
      amount: number | undefined,
      group: StaggerGroup | null | undefined,
      notify: () => void
    ) {
      if (!target) return noop;
      const member: StaggerMember = {
        element: target,
        enter: (offset) => commit("inside", offset, notify),
      };
      const stop = observeViewport(
        target,
        (phase) => {
          if (phase === "inside" && group) {
            // Entrances wait for the group to order everything arriving this frame.
            if (!(state.reported && state.phase === "inside")) group.join(member);
            return;
          }
          group?.leave(member);
          commit(phase, 0, notify);
        },
        amount
      );
      return () => {
        group?.leave(member);
        stop();
      };
    },
  };
}

/**
 * Full viewport state for an element: phase, whether it was already on
 * screen at mount, and any stagger offset. Renders "before" during
 * prerender/hydration, so the server HTML and the first client render
 * always match.
 */
export function useViewportState(
  ref: RefObject<Element | null>,
  { amount, disabled = false, group = null }: ViewportOptions = {}
): ViewportState {
  const [store] = useState(createViewportStore);
  const subscribe = useCallback(
    (notify: () => void) => (disabled ? noop : store.observe(ref.current, amount, group, notify)),
    [store, ref, amount, disabled, group]
  );
  const state = useSyncExternalStore(subscribe, store.get, getServerState);
  return disabled ? VISIBLE_STATE : state;
}

/** `"before" | "inside" | "after"` for an element; changes only on transitions. */
export function useViewportPhase(ref: RefObject<Element | null>, options?: ViewportOptions): ViewportPhase {
  return useViewportState(ref, options).phase;
}
