import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { EASE, usePointer, useReducedMotionSafe } from "@/animations";
import type { RouteFamily } from "@/routing/paths";
import { pageFamily } from "@/routing/pageFamily";
import { useAtmosphereVariant } from "./useAtmosphere";

// Re-exported so pages can import the hook from the component's module.
// eslint-disable-next-line react-refresh/only-export-components
export { useAtmosphere, useAtmosphereVariant } from "./useAtmosphere";

/** Routes whose light leans toward the pointer. */
const POINTER_ROUTES: ReadonlySet<RouteFamily> = new Set<RouteFamily>(["home", "me", "explore"]);

/** How far the glow travels when the pointer reaches the window's edge. */
const GLOW_TRAVEL = { x: 8, y: 6 }; // vw, vh

const YEAR = /\b(?:19|20)\d{2}\b/;

/**
 * The living background behind every page — rendered once by App.
 *
 * A fixed, non-interactive stack of layers whose mood follows the route
 * family (.atmo[data-route], also mirrored to html[data-route] for other
 * styles) and any sub-mood a page sets with `useAtmosphere(…)`. All the
 * look lives in src/styles/atmosphere.css; this component only supplies
 * the state and the pointer-driven glow.
 *
 * SSR-safe: the route family is known during prerender, so the right
 * mood is in the static HTML from the first paint. Sub-moods and the
 * pointer only arrive after hydration.
 */
export function Atmosphere() {
  const { pathname } = useLocation();
  const family = pageFamily(pathname);
  const variant = useAtmosphereVariant();
  const reduced = useReducedMotionSafe();

  // A3's shared pointer: one listener site-wide, spring-smoothed, and
  // perfectly still on touch screens, under reduced motion and on routes
  // without a glow — so nothing runs unless the pointer actually moves.
  const pointer = usePointer({ disabled: !POINTER_ROUTES.has(family) });
  const glowX = useTransform(pointer.x, (v) => `${v * GLOW_TRAVEL.x}vw`);
  const glowY = useTransform(pointer.y, (v) => `${v * GLOW_TRAVEL.y}vh`);

  useEffect(() => {
    document.documentElement.dataset.route = family;
  }, [family]);

  // Story chapters can put their year in the background: useAtmosphere("story-2024").
  const year = family === "story" ? (variant?.match(YEAR)?.[0] ?? null) : null;
  const drift = reduced ? 0 : "0.06em";

  return (
    <div className="atmo" data-route={family} data-atmo={variant ?? undefined} aria-hidden="true">
      <div className="atmo__layer atmo__base" />
      <div className="atmo__layer atmo__fields" />
      <div className="atmo__layer atmo__planes" />
      <div className="atmo__layer atmo__ruler" />
      <div className="atmo__layer atmo__numeral">
        <AnimatePresence initial={false}>
          {year && (
            <motion.span
              key={year}
              initial={{ opacity: 0, y: drift }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : "-0.06em" }}
              transition={{ duration: reduced ? 0 : 1.2, ease: EASE.standard }}
            >
              {year}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="atmo__layer atmo__grid" />
      <div className="atmo__layer atmo__sketch" />
      <div className="atmo__layer atmo__horizon" />
      <div className="atmo__layer atmo__pulse" />
      <motion.div className="atmo__glow" style={{ x: glowX, y: glowY }} />
      <div className="atmo__layer atmo__vignette" />
      <div className="atmo__layer atmo__grain" />
    </div>
  );
}
