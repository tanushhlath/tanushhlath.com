import { MotionGlobalConfig } from "framer-motion";
import { isBrowser } from "./env";

/**
 * FAIL-SAFE HAND-OFF
 *
 * Prerendered pages ship every reveal in its hidden starting pose, so the
 * page can't depend on the script arriving. motion.css runs a one-shot CSS
 * animation that shows every [data-reveal] element after
 * `--motion-failsafe-delay` unless <html data-motion-ready> is set — which
 * this module does the moment the script evaluates.
 *
 * On a load so slow that the fail-safe may already have shown the page, the
 * script arrives "late": the fail-safe stays in charge for a short settle
 * window while every animation runs instantly, so what's on screen snaps to
 * its visible state underneath; then the hand-off completes. Content that
 * was already showing never disappears to replay its entrance.
 */

/** Keep equal to `--motion-failsafe-delay` in src/styles/motion.css. */
const FAILSAFE_MS = 2500;
/** How long a late start keeps animations instant before handing over. */
const LATE_SETTLE_MS = 1200;
/** Hand over anyway if nothing on the page ever asks for a reveal. */
const LATE_FALLBACK_MS = 4000;

let late = false;
let settleTimer = 0;

function completeHandOff() {
  if (!late) return;
  late = false;
  const root = document.documentElement;
  root.removeAttribute("data-motion-late");
  root.setAttribute("data-motion-ready", "");
  MotionGlobalConfig.instantAnimations = false;
}

if (isBrowser) {
  const root = document.documentElement;
  late = typeof performance !== "undefined" && performance.now() > FAILSAFE_MS;
  if (late) {
    root.setAttribute("data-motion-late", "");
    MotionGlobalConfig.instantAnimations = true;
    window.setTimeout(() => {
      if (!settleTimer) completeHandOff();
    }, LATE_FALLBACK_MS);
  } else {
    root.setAttribute("data-motion-ready", "");
  }
}

/**
 * Called by the viewport engine when it starts observing. On a late start
 * this begins the settle window (the first reports land within a frame or
 * two, and render instantly); otherwise it does nothing.
 */
export function notifyRevealsStarted() {
  if (!late || settleTimer) return;
  settleTimer = window.setTimeout(completeHandOff, LATE_SETTLE_MS);
}
