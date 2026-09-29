import { useSyncExternalStore } from "react";

/**
 * Small, hydration-safe environment checks shared by the routing layer.
 */

const subscribeNever = () => () => {};

/**
 * False during prerender and during the hydration render, true from then
 * on (and immediately for components mounted by a client navigation).
 * Use it to switch to browser-only values without a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

/** The visitor asked the OS for reduced motion. Handlers/effects only. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
