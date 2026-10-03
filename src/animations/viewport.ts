import { useCallback, useState, useSyncExternalStore, type RefObject } from "react";
import { notifyRevealsStarted } from "./boot";
import { isBrowser } from "./env";
import { subscribeScrollDirection, type ScrollDirection } from "./scrollDirection";
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
 * re-render when their phase actually changes — never per scroll event, and
 * not for the first report either when it only confirms the prerendered
 * state (everything below the fold at load).
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
 * so those are detected (just after the next frame is painted, where
 * reading layout is free) and handed to a second, full-viewport observer
 * that reports them inside whenever any of them is on screen. They still
 * reverse and replay like everything else.
 *
 * The observer sees each element's transformed box, cut down (in Chrome) by
 * its own clip-path — the hidden poses in variants.ts follow rules that keep
 * that stable at the reveal line. Where that box can't be trusted, elements
 * are re-checked from their real positions: after scroll jumps, when
 * scrolling comes to rest, on direction changes, and when something is
 * reported below the line (see `reclassify` and `recheckStranded`).
 *
 * It also keeps keyboard focus visible: every reveal around a
 * keyboard-focused element is marked [data-reveal-focus] (see onFocusIn).
 */

export type ViewportPhase = "before" | "inside" | "after";

export interface ViewportState {
  phase: ViewportPhase;
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
  /** Elements that just went below the band: tested for "stranded" in the next frame. */
  strandCheck: Set<Element>;
  /** Waiting inside the band, hidden by an ancestor's clip (see outsidePhase): only the observer can tell when they're uncovered. */
  clipped: Set<Element>;
}

const pools = new Map<number, Pool>();
const noop = () => {};

function normalizeAmount(amount: number | undefined): number {
  const value = amount ?? motionSettings.revealOffset;
  if (!Number.isFinite(value)) return motionSettings.revealOffset;
  return Math.round(Math.min(0.9, Math.max(0, value)) * 100) / 100;
}

/** Remaining distance (px) the document can still scroll down. Reads layout: call it where layout is clean (see scheduleRecheck). */
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

/**
 * Where an element the observer reports as NOT intersecting a band is,
 * judged from its box. "below" means under the band; the caller decides
 * whether that is waiting ("before") or stranded. "clipped" means waiting
 * ("before") inside the band, covered by an ancestor.
 */
function outsidePhase(
  rect: DOMRectReadOnly,
  top: number,
  bottom: number,
  left: number,
  right: number
): ViewportPhase | "below" | "clipped" {
  if (rect.bottom <= top) return "after";
  if (rect.top >= bottom) return "below";
  // Vertically overlapping the band, yet not intersecting it:
  // - entirely beside the viewport: its own sideways offset (a drift or
  //   split waiting to slide in) pushed it off screen. Count it as reached,
  //   or it could never come back.
  if (rect.right <= left || rect.left >= right) return "inside";
  // - sticking out above the band: it is leaving (or has left) by the top.
  //   A fast scroll can carry an element whose entrance is still settling
  //   (clip-path and offset in flight) past the top edge, and Chrome then
  //   reports its last few pixels as not intersecting.
  if (rect.top < top) return "after";
  // - within the band: an ancestor clips it (a horizontal carousel, a
  //   collapsed panel). It waits until it is actually uncovered.
  return "clipped";
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
  pool.strandCheck.delete(target);
  pool.clipped.delete(target);
  if (!pool.stranded.delete(target)) return;
  pool.edge?.unobserve(target);
}

function onBandEntries(pool: Pool, entries: IntersectionObserverEntry[]) {
  let check = false;
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
    const phase = outsidePhase(
      rect,
      bounds?.top ?? 0,
      bounds?.bottom ?? window.innerHeight * (1 - pool.amount),
      bounds?.left ?? 0,
      bounds?.right ?? window.innerWidth
    );
    if (phase === "below") {
      // Waiting below the line — unless it can never reach it. That test
      // reads layout, so it runs in the next frame instead of here.
      if (!pool.stranded.has(target)) emit(pool, target, "before");
      pool.clipped.delete(target);
      pool.strandCheck.add(target);
      check = true;
      continue;
    }
    release(pool, target);
    if (phase === "clipped") {
      pool.clipped.add(target);
      emit(pool, target, "before");
    } else emit(pool, target, phase);
  }
  if (check) scheduleRecheck(false);
}

function onEdgeEntries(pool: Pool, entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    const { target, boundingClientRect: rect } = entry;
    if (!pool.stranded.has(target)) continue;
    if (entry.isIntersecting) {
      emit(pool, target, "inside");
      continue;
    }
    if (isUnrendered(rect)) {
      emit(pool, target, "before");
      continue;
    }
    const bounds = entry.rootBounds;
    const phase = outsidePhase(
      rect,
      bounds?.top ?? 0,
      bounds?.bottom ?? window.innerHeight,
      bounds?.left ?? 0,
      bounds?.right ?? window.innerWidth
    );
    emit(pool, target, phase === "below" || phase === "clipped" ? "before" : phase);
  }
}

function createPool(amount: number): Pool {
  const pool: Pool = {
    amount,
    edge: null,
    listeners: new Map(),
    phases: new Map(),
    stranded: new Set(),
    strandCheck: new Set(),
    clipped: new Set(),
    band: new IntersectionObserver((entries) => onBandEntries(pool, entries), {
      rootMargin: `0px 0px -${Math.round(amount * 100)}% 0px`,
      threshold: 0,
    }),
  };
  pools.set(amount, pool);
  return pool;
}

/*
 * Stranded checks, batched: elements that just went below the band, or —
 * when the page changed size (a filter hides items, a panel collapses, the
 * window is resized; one ResizeObserver on <body>) — every element waiting
 * below the line, since one of them may have just become unreachable. An
 * element that is no longer stranded (the page grew) goes back to the band.
 *
 * Nothing here is urgent (a stranded element is by definition at the very
 * end of the page), so the check runs just after the next frame has been
 * painted, when layout is clean and reading positions is free. In the frame
 * itself it would force the layout early — at page load that is the
 * hydration's whole layout — and the entrances starting in that frame would
 * make the browser do it a second time.
 */
let watching = false;
let recheckPending = false;
let recheckEverything = false;

function recheckStranded() {
  recheckPending = false;
  const everything = recheckEverything;
  recheckEverything = false;
  const remaining = remainingScroll();
  for (const pool of pools.values()) {
    const bandBottom = window.innerHeight * (1 - pool.amount);
    const targets = everything ? pool.listeners.keys() : pool.strandCheck.values();
    for (const target of targets) {
      const held = pool.stranded.has(target);
      if (!held && pool.phases.get(target) !== "before") continue;
      const rect = target.getBoundingClientRect();
      if (isUnrendered(rect)) continue;
      const stranded = rect.top >= bandBottom && isStranded(rect.top, bandBottom, remaining);
      if (stranded && !held) hold(pool, target);
      else if (!stranded && held) {
        release(pool, target);
        emit(pool, target, rect.bottom <= 0 ? "after" : rect.top < bandBottom ? "inside" : "before");
      } else if (!stranded && !pool.clipped.has(target) && rect.top < bandBottom + window.innerHeight * 0.25) {
        // Reported below only because its hidden pose is: it waits offset
        // (or clipped) downward, but its real top is already across the
        // line — at page load, or after a short scroll. It has arrived.
        const box = layoutBox(target, rect);
        if (box.top < bandBottom && box.bottom > 0) emit(pool, target, "inside");
      }
    }
    pool.strandCheck.clear();
  }
}

function scheduleRecheck(everything = true) {
  if (everything) recheckEverything = true;
  if (recheckPending) return;
  recheckPending = true;
  // A task queued from an animation frame runs once that frame is painted.
  requestAnimationFrame(() => window.setTimeout(recheckStranded, 0));
}

const onResize = () => scheduleRecheck(true);

/**
 * Where the element's box sits vertically without its own transform — the
 * pose a reveal waits in (a transform origin at the centre is assumed for
 * scale; a 3D pose is judged by its translateY). Ancestors' transforms
 * (parallax…) still count: they move the element for real.
 */
function layoutBox(target: Element, rect: DOMRectReadOnly): { top: number; bottom: number } {
  const transform = getComputedStyle(target).transform;
  if (!transform || transform === "none") return rect;
  const match = /^matrix(3d)?\((.*)\)$/.exec(transform);
  if (!match) return rect;
  const values = match[2].split(",").map((value) => Number.parseFloat(value) || 0);
  if (match[1]) {
    const translateY = values[13] ?? 0;
    return { top: rect.top - translateY, bottom: rect.bottom - translateY };
  }
  // matrix(a, b, c, d, e, f): scaled by d about the centre, moved by f.
  const scaleY = values[3] > 0 ? values[3] : 1;
  const centre = (rect.top + rect.bottom) / 2 - (values[5] ?? 0);
  const half = rect.height / scaleY / 2;
  return { top: centre - half, bottom: centre + half };
}

/*
 * Re-classification from real positions, for the cases the observer can't
 * see. It sees the *hidden pose* of a waiting element, which is offset (or
 * clipped) toward the side it waits on, so:
 *
 *  - Scroll jumps. An element that goes from above the screen to below it
 *    (or back) without ever intersecting — an instant scrollTo, an anchor
 *    jump, Home/End, a very fast fling — gets no observer callback, so it
 *    would keep its old phase and later arrive from the wrong side.
 *  - Coming to rest just across the line. An element whose real top has
 *    crossed the reveal line, while its hidden pose hasn't, would stay
 *    hidden on screen for as long as the page sits there.
 *  - Direction changes. Scrolling back reverses exits, so an element left on
 *    the wrong side (marked below while it is above the screen, or the
 *    reverse) would come back from the wrong direction — or, with a
 *    clip-path pose that only keeps the edge it waits by, not at all.
 *
 * After a jump of more than half a screen, and whenever scrolling comes to
 * rest, every element near the screen is judged by where it actually sits
 * (its layout box, see layoutBox) and everything else by which side it's
 * on. A direction change only moves elements fully off screen on the wrong
 * side. Elements the observer reports as on screen are only ever corrected
 * when entirely off screen.
 */
function reclassify(full: boolean) {
  const vh = window.innerHeight;
  for (const pool of pools.values()) {
    const bandBottom = vh * (1 - pool.amount);
    for (const [target, phase] of pool.phases) {
      if (pool.stranded.has(target)) continue;
      const rect = target.getBoundingClientRect();
      if (isUnrendered(rect)) continue;
      if (phase === "inside") {
        if (rect.bottom <= 0) emit(pool, target, "after");
        else if (rect.top >= vh) emit(pool, target, "before");
        continue;
      }
      if (!full) {
        if (phase === "before" && rect.bottom <= 0) emit(pool, target, "after");
        else if (phase === "after" && rect.top >= bandBottom) emit(pool, target, "before");
        continue;
      }
      const { top, bottom } = rect.bottom > -vh && rect.top < 2 * vh ? layoutBox(target, rect) : rect;
      const next = bottom <= 0 ? "after" : top >= bandBottom ? "before" : "inside";
      // In the band but covered by an ancestor: the observer says when it's uncovered.
      if (next === "inside" && pool.clipped.has(target)) continue;
      emit(pool, target, next);
    }
  }
}

let lastScrollY = -1;
let jumpFrame = 0;
let restTimer = 0;
let lastDirection: ScrollDirection = "down";
/** Quiet time (ms) after the last scroll event that counts as having come to rest. */
const REST_MS = 150;

function onScrollRest() {
  restTimer = 0;
  requestAnimationFrame(() => reclassify(true));
}

function onScrollForJumps() {
  window.clearTimeout(restTimer);
  restTimer = window.setTimeout(onScrollRest, REST_MS);
  if (jumpFrame) return;
  jumpFrame = requestAnimationFrame(() => {
    jumpFrame = 0;
    const y = window.scrollY;
    const jumped = lastScrollY >= 0 && Math.abs(y - lastScrollY) > window.innerHeight * 0.5;
    lastScrollY = y;
    if (jumped) reclassify(true);
  });
}

function onDirection({ direction }: { direction: ScrollDirection }) {
  if (direction === lastDirection) return;
  lastDirection = direction;
  reclassify(false);
}

/*
 * Keyboard focus always lands on something visible: tabbing scrolls the
 * focused element just into view, possibly still under the reveal line. So
 * every reveal around a keyboard-focused element is marked
 * [data-reveal-focus], which motion.css shows at once, whatever its state.
 * Pointer focus doesn't count (hidden reveals don't take the pointer).
 */
const FOCUS_MARK = "data-reveal-focus";
let focusMarked: Element[] = [];

function clearFocusMarks() {
  for (const element of focusMarked) element.removeAttribute(FOCUS_MARK);
  focusMarked = [];
}

function isKeyboardFocus(target: Element): boolean {
  try {
    return target.matches(":focus-visible");
  } catch {
    return true; // no :focus-visible support: assume it could be the keyboard
  }
}

function onFocusIn(event: FocusEvent) {
  clearFocusMarks();
  const target = event.target;
  if (!(target instanceof Element) || !isKeyboardFocus(target)) return;
  for (let reveal = target.closest("[data-reveal]"); reveal; reveal = reveal.parentElement?.closest("[data-reveal]") ?? null) {
    // Inner pieces ([data-reveal=""]) follow their block.
    if (!reveal.getAttribute("data-reveal")) continue;
    reveal.setAttribute(FOCUS_MARK, "");
    focusMarked.push(reveal);
  }
}

function ensureWatchers() {
  if (watching) return;
  watching = true;
  notifyRevealsStarted();
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", clearFocusMarks);
  subscribeScrollDirection(onDirection);
  // Baseline scroll position for jump detection, read in the first frame —
  // never during React's commit, where it would force a style/layout pass.
  requestAnimationFrame(() => {
    if (lastScrollY < 0) lastScrollY = window.scrollY;
  });
  window.addEventListener("scroll", onScrollForJumps, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(onResize).observe(document.body);
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

const INITIAL_STATE: ViewportState = { phase: "before", inViewOnMount: false, staggerDelay: 0 };
const VISIBLE_STATE: ViewportState = { phase: "inside", inViewOnMount: true, staggerDelay: 0 };
const getServerState = () => INITIAL_STATE;

/**
 * The state an element is prerendered and hydrated with, still unchanged
 * (every change is a new state object): it hasn't moved yet.
 */
export function isPristineViewportState(state: ViewportState): boolean {
  return state === INITIAL_STATE;
}

function createViewportStore() {
  let state = INITIAL_STATE;
  /** The observer has reported at least once (kept out of the snapshot: it never changes what renders). */
  let reported = false;

  function commit(phase: ViewportPhase, staggerDelay: number, notify: () => void) {
    const inViewOnMount = !reported && phase === "inside";
    reported = true;
    // The first report usually just confirms the prerendered "before" (it
    // renders exactly like INITIAL_STATE): no re-render for that.
    if (state.phase === phase) return;
    state = { phase, inViewOnMount, staggerDelay };
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
            if (state.phase !== "inside") group.join(member);
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
