import { useSyncExternalStore } from "react";

/**
 * ENVIRONMENT QUERIES — hydration-safe.
 *
 * Every hook here returns `false` during prerender and during the hydration
 * render (React uses the server snapshot), then updates to the real value
 * right after mount and whenever the setting changes. That keeps the first
 * client render byte-identical to the prerendered HTML.
 */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const COARSE_POINTER = "(pointer: coarse)";

export const isBrowser = typeof window !== "undefined";

const queries = new Map<string, MediaQueryList>();

function getQuery(query: string): MediaQueryList | null {
  if (!isBrowser || typeof window.matchMedia !== "function") return null;
  let list = queries.get(query);
  if (!list) {
    list = window.matchMedia(query);
    queries.set(query, list);
  }
  return list;
}

function matches(query: string): boolean {
  return getQuery(query)?.matches ?? false;
}

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const list = getQuery(query);
    if (!list) return () => {};
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
}

const serverFalse = () => false;
const clientTrue = () => true;
const subscribeNever = () => () => {};

const subscribeReduced = subscribeTo(REDUCED_MOTION);
const subscribeFine = subscribeTo(FINE_POINTER);
const subscribeCoarse = subscribeTo(COARSE_POINTER);
const getReduced = () => matches(REDUCED_MOTION);
const getFine = () => matches(FINE_POINTER);
const getCoarse = () => matches(COARSE_POINTER);

/** Non-hook checks, for event handlers and effects. */
export const prefersReducedMotion = getReduced;
export const hasFinePointer = getFine;

/** The visitor asked the OS for reduced motion. */
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribeReduced, getReduced, serverFalse);
}

/** A mouse/trackpad that can hover — the only input that gets tilt and cursor effects. */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribeFine, getFine, serverFalse);
}

/** A touch screen is the primary input. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(subscribeCoarse, getCoarse, serverFalse);
}

/**
 * false during prerender and the hydration render, true right after. Gate
 * values that can only be known in the browser (scroll-linked offsets) on
 * it so the static HTML never bakes in a guess.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, clientTrue, serverFalse);
}
