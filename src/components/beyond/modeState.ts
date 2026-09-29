import { useEffect, useState } from "react";
import { useHydrated } from "@/animations";
import { BEYOND_MODES, type BeyondMode } from "@/routing/paths";
import { useHashState } from "@/routing/useHashState";

/** "#lab" → "lab"; anything that isn't a Beyond mode → undefined (→ Now). */
export function parseBeyondMode(fragment: string): BeyondMode | undefined {
  const value = fragment.trim().toLowerCase();
  return BEYOND_MODES.find((mode) => mode === value);
}

export const DEFAULT_BEYOND_MODE: BeyondMode = "now";

/**
 * The Beyond mode lives in the URL fragment (/beyond/#next): click,
 * refresh, share, come back — same room. The prerender and the hydration
 * render always show Now (the server can't see fragments); the real mode
 * applies right after mount.
 */
export function useBeyondMode() {
  return useHashState<BeyondMode>(parseBeyondMode, (mode) => mode, DEFAULT_BEYOND_MODE);
}

/** Position of a mode in tab order (0-based). */
export const modeOrder = (mode: BeyondMode): number => BEYOND_MODES.indexOf(mode);

/** The mode after this one, wrapping Lab → Now. */
export const nextMode = (mode: BeyondMode): BeyondMode =>
  BEYOND_MODES[(modeOrder(mode) + 1) % BEYOND_MODES.length];

/** "01", "02"… */
export const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * True one frame after hydration. Until then a mode change is applied
 * instantly: that is the URL fragment arriving after the static (Now)
 * HTML hydrates, which should look like a page load, not a switch.
 */
export function useSwitchReady(): boolean {
  const hydrated = useHydrated();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [hydrated]);
  return ready;
}
