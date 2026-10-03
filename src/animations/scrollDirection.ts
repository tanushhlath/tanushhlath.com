import { useSyncExternalStore } from "react";
import { isBrowser } from "./env";

/**
 * SCROLL DIRECTION STORE
 *
 * One passive scroll listener for the whole site, read once per animation
 * frame. It never touches React state on scroll: it only notifies
 * subscribers (and flips two attributes on <html>) when something actually
 * changes —
 *
 *   html[data-scroll-dir="down" | "up"]   last meaningful scroll direction
 *   html[data-scrolled="true" | "false"]  scrolled past the very top
 *
 * so CSS can react without any JavaScript in the component:
 *   html[data-scroll-dir="up"] .thing { … }
 */

export type ScrollDirection = "up" | "down";

export interface ScrollState {
  direction: ScrollDirection;
  /** true once the page is scrolled more than a few pixels from the top. */
  scrolled: boolean;
}

/** Ignore sub-pixel jitter and trackpad noise smaller than this (px). */
const DIRECTION_THRESHOLD = 6;
/** Below this scroll offset (px) the page counts as "at the top". */
const TOP_THRESHOLD = 8;

let state: ScrollState = { direction: "down", scrolled: false };
let anchorY = 0;
let frameId = 0;
let started = false;
const listeners = new Set<(state: ScrollState) => void>();

function writeAttributes(next: ScrollState, prev: ScrollState | null) {
  const root = document.documentElement;
  if (!prev || prev.direction !== next.direction) root.dataset.scrollDir = next.direction;
  if (!prev || prev.scrolled !== next.scrolled) root.dataset.scrolled = String(next.scrolled);
}

function read() {
  frameId = 0;
  const y = Math.max(0, window.scrollY);
  let direction = state.direction;
  // The anchor only moves once the threshold is crossed, so a slow scroll
  // accumulates into a direction change instead of being lost as noise.
  if (Math.abs(y - anchorY) >= DIRECTION_THRESHOLD) {
    direction = y > anchorY ? "down" : "up";
    anchorY = y;
  }
  const scrolled = y > TOP_THRESHOLD;
  if (direction === state.direction && scrolled === state.scrolled) return;
  const prev = state;
  state = { direction, scrolled };
  writeAttributes(state, prev);
  listeners.forEach((listener) => listener(state));
}

function onScroll() {
  if (!frameId) frameId = requestAnimationFrame(read);
}

/** First reading of the scroll position — in an animation frame, never inside React's commit, where reading scrollY would force a style/layout pass. */
function init() {
  anchorY = Math.max(0, window.scrollY);
  const prev = state;
  state = { direction: prev.direction, scrolled: anchorY > TOP_THRESHOLD };
  writeAttributes(state, null);
  if (state.scrolled !== prev.scrolled) listeners.forEach((listener) => listener(state));
}

/**
 * Start tracking (idempotent). Called automatically by the reveal system and
 * by any subscriber; safe to call early from the app entry as well. The
 * html attributes appear in the next animation frame.
 */
export function startScrollDirection() {
  if (started || !isBrowser) return;
  started = true;
  requestAnimationFrame(init);
  window.addEventListener("scroll", onScroll, { passive: true });
}

export function getScrollDirection(): ScrollDirection {
  return state.direction;
}

export function getScrollState(): ScrollState {
  return state;
}

/** Called only when the direction or the at-top state changes. Returns an unsubscribe. */
export function subscribeScrollDirection(listener: (state: ScrollState) => void): () => void {
  startScrollDirection();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverDirection = (): ScrollDirection => "down";
const serverScrolled = () => false;
const getScrolled = () => state.scrolled;

/** Re-renders only when the scroll direction flips — never per scroll event. */
export function useScrollDirection(): ScrollDirection {
  return useSyncExternalStore(subscribeScrollDirection, getScrollDirection, serverDirection);
}

/** Re-renders only when the page leaves / returns to the very top. */
export function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScrollDirection, getScrolled, serverScrolled);
}
