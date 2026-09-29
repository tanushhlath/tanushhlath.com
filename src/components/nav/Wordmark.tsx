import { useCallback, useEffect, useRef, type MouseEvent, type Ref } from "react";
import { navigation, site } from "@/lib/content";
import Link from "@/routing/Link";

/** Three clicks/taps, each within this long of the previous one, open the Easter egg. */
const TAP_WINDOW_MS = 650;

/** When the click happened, on the performance.now() clock (event.timeStamp). */
function eventTime(event: Event): number {
  return event.timeStamp || performance.now();
}

/** A tap at `time` continues the run whose latest tap was at `last` (0 = no run). */
function continuesRun(last: number, time: number): boolean {
  const gap = time - last;
  return last > 0 && gap >= 0 && gap <= TAP_WINDOW_MS;
}

export interface WordmarkProps {
  /** Opens the Easter egg dialog (third quick click/tap). */
  onSecret: () => void;
  ref?: Ref<HTMLAnchorElement>;
}

/**
 * "TANUSHH" — top-left, always Home.
 *
 * A single click navigates Home immediately (or, on Home, re-opens it at
 * the top — the site <Link> does that). It is also the Easter egg's
 * trigger: a quick second click is swallowed (so a double click doesn't
 * re-open the page twice), and a quick third click opens the dialog
 * instead of navigating. Works the same for mouse, touch and the Enter
 * key. The dot next to the name swells a little with each quick click —
 * the only clue that something is there.
 *
 * The first click usually starts a route view transition, and while one
 * runs the browser sends every click to <html> instead of the element
 * under the pointer. So a quick follow-up click that lands on the root
 * inside the wordmark's box (the top bar never moves) still counts.
 *
 * Taps are timed by when they happened (the event's timeStamp), never by
 * when their handler runs: on a slow phone the trip Home that the first
 * click starts can hold the main thread for a second or more, and the
 * next two clicks are only handled after it — still three quick taps.
 */
export function Wordmark({ onSecret, ref }: WordmarkProps) {
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  /** `last` = timeStamp of the latest counted tap (0 = no run in progress). */
  const taps = useRef({ count: 0, last: 0 });
  const swellTimer = useRef<number | undefined>(undefined);
  const secret = useRef(onSecret);

  useEffect(() => {
    secret.current = onSecret;
  });

  /** Counts one tap made at `time`; returns true when the tap must not navigate. */
  const tap = useCallback((el: HTMLElement, time: number): boolean => {
    const state = taps.current;
    state.count = continuesRun(state.last, time) ? state.count + 1 : 1;
    state.last = time;
    window.clearTimeout(swellTimer.current);

    if (state.count >= 3) {
      state.count = 0;
      state.last = 0;
      delete el.dataset.taps;
      secret.current();
      return true;
    }

    // Only the dot's swell fades on a timer — the count itself is decided
    // by the timestamps above, so a late timer can't break a quick run.
    el.dataset.taps = String(state.count);
    swellTimer.current = window.setTimeout(() => delete el.dataset.taps, TAP_WINDOW_MS);
    // The first click already opened (or re-opened) Home; a quick second one doesn't repeat it.
    return state.count === 2;
  }, []);

  // Follow-up taps that a running view transition retargeted to <html>.
  useEffect(() => {
    const onRootClick = (event: globalThis.MouseEvent) => {
      const el = anchorRef.current;
      if (!el || event.target !== document.documentElement || event.button !== 0) return;
      const time = eventTime(event);
      if (!continuesRun(taps.current.last, time)) return;
      const box = el.getBoundingClientRect();
      const inside =
        event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (inside) tap(el, time);
    };
    document.addEventListener("click", onRootClick, true);
    return () => {
      document.removeEventListener("click", onRootClick, true);
      window.clearTimeout(swellTimer.current);
    };
  }, [tap]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (tap(event.currentTarget, eventTime(event.nativeEvent))) event.preventDefault();
  };

  const setRef = (node: HTMLAnchorElement | null) => {
    anchorRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <Link
      ref={setRef}
      href={navigation.home.href}
      onClick={onClick}
      className="wordmark"
      aria-label={`${site.name} — ${navigation.home.label}`}
      data-cursor="view"
      data-cursor-label={navigation.home.label}
    >
      <span className="wordmark__dot" aria-hidden="true" />
      <span className="wordmark__text" aria-hidden="true">
        {site.shortName}
      </span>
      <span className="wordmark__hint" aria-hidden="true">
        <span className="wordmark__hint-arrow">↖</span>
        {navigation.home.label}
      </span>
    </Link>
  );
}
