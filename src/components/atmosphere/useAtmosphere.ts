import { useEffect, useSyncExternalStore } from "react";

/**
 * ATMOSPHERE SUB-MOODS
 *
 * The route decides the base atmosphere (see Atmosphere.tsx). A page or
 * section can layer a sub-mood on top while it's mounted:
 *
 *   useAtmosphere(`beyond-${mode}`);   // "beyond-now" | "beyond-next" | "beyond-lab"
 *   useAtmosphere(`explore-${lens}`);  // explore-built / -grown / -tried / -care / -proud
 *   useAtmosphere(`story-${year}`);    // Story: shows that year as a giant background numeral
 *   useAtmosphere(null);               // nothing (e.g. no lens chosen yet)
 *
 * The active value is mirrored to html[data-atmo] (and .atmo[data-atmo]),
 * which styles/atmosphere.css keys its moods on. If several components ask
 * at once, the most recently mounted one wins; when it unmounts, the
 * previous one takes over again.
 */

interface Claim {
  variant: string;
}

let claims: Claim[] = [];
const listeners = new Set<() => void>();

function currentVariant(): string | null {
  return claims.length > 0 ? claims[claims.length - 1].variant : null;
}

function publish(): void {
  const variant = currentVariant();
  const root = document.documentElement;
  if (variant) root.dataset.atmo = variant;
  else delete root.dataset.atmo;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverVariant = () => null;

/** Set a sub-mood for as long as the calling component is mounted. */
export function useAtmosphere(variant: string | null): void {
  useEffect(() => {
    if (!variant) return;
    const claim: Claim = { variant };
    claims = [...claims, claim];
    publish();
    return () => {
      claims = claims.filter((c) => c !== claim);
      publish();
    };
  }, [variant]);
}

/** The active sub-mood (null during prerender and hydration). */
export function useAtmosphereVariant(): string | null {
  return useSyncExternalStore(subscribe, currentVariant, serverVariant);
}
