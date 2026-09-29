import { useEffect, useRef } from "react";

/**
 * CUSTOM CURSOR — decorative, mouse/trackpad only.
 *
 * ── The data-cursor contract (for every page and component) ──────────
 * Put these on the element the pointer is over (the nearest ancestor that
 * has them wins):
 *
 *   data-cursor="view"      a disc with "View" — opens / enlarges something
 *                           (cards, covers, photos, primary links)
 *   data-cursor="explore"   a disc with "Explore" — lenses, maps, "go deeper"
 *   data-cursor="read"      a disc with "Read" — expandable text, stories
 *   data-cursor="back"      a ring with "←" — back / return controls
 *   data-cursor="close"     a ring with "×" — close controls
 *   data-cursor="none"      hide the custom cursor here (native cursor stays hidden)
 *   data-cursor-label="…"   replaces the default word (1–2 words: "Open", "Play")
 *
 * Plain links and buttons without data-cursor get the "link" state (the
 * dot grows and turns accent); text fields keep the native text caret and
 * the dot steps aside. Anything else: a small dot.
 *
 * Never required: every control must work and read well without it. It
 * never intercepts clicks (pointer-events: none), is aria-hidden, and is
 * off on touch / coarse pointers and under prefers-reduced-motion — the
 * native cursor is used there (visibility rules: styles/base.css; looks:
 * styles/chrome.css).
 *
 * Performance: the dot is written to the exact pointer position every
 * frame (it can't lag); the ring follows with a light lerp. Both move with
 * translate3d from one rAF loop that stops when they settle. The hovered
 * element is resolved on pointerover (not per move), and modes/labels are
 * written straight to data attributes — no React state, no re-renders.
 */

type Mode = "default" | "link" | "text" | "view" | "explore" | "read" | "back" | "close" | "none";

const LABELED: readonly Mode[] = ["view", "explore", "read", "back", "close"];

const DEFAULT_LABEL: Partial<Record<Mode, string>> = {
  view: "View",
  explore: "Explore",
  read: "Read",
  back: "←",
  close: "×",
};

const TARGETS =
  "[data-cursor], a[href], button, [role='button'], [role='tab'], [role='link'], summary, label, select, input, textarea, [contenteditable='true']";

const TEXT_FIELD = "textarea, [contenteditable='true'], input:not([type='range'], [type='checkbox'], [type='radio'], [type='button'], [type='submit'], [type='reset'])";

/** How quickly the ring catches up (0–1 per frame). */
const RING_EASE = 0.24;

function resolve(target: EventTarget | null): { mode: Mode; label: string } {
  const el = target instanceof Element ? target.closest<HTMLElement>(TARGETS) : null;
  if (!el) return { mode: "default", label: "" };
  const requested = el.dataset.cursor as Mode | undefined;
  if (requested && (LABELED.includes(requested) || requested === "none")) {
    return { mode: requested, label: el.dataset.cursorLabel ?? DEFAULT_LABEL[requested] ?? "" };
  }
  if (el.matches(TEXT_FIELD)) return { mode: "text", label: "" };
  if (el.matches(":disabled, [aria-disabled='true']")) return { mode: "default", label: "" };
  return { mode: "link", label: "" };
}

export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const labelEl = labelRef.current;
    if (!root || !dot || !ring || !labelEl) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop: (() => void) | null = null;

    const start = () => {
      let tx = 0;
      let ty = 0;
      let rx = 0;
      let ry = 0;
      let frame = 0;
      let shown = false;
      let mode: Mode = "default";
      let label = "";
      let settleTimer = 0;

      const place = () => {
        frame = 0;
        dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        rx += (tx - rx) * RING_EASE;
        ry += (ty - ry) * RING_EASE;
        if (Math.abs(tx - rx) < 0.1 && Math.abs(ty - ry) < 0.1) {
          rx = tx;
          ry = ty;
        } else {
          frame = requestAnimationFrame(place);
        }
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(place);
      };

      const apply = (next: { mode: Mode; label: string }) => {
        if (next.mode !== mode) {
          mode = next.mode;
          root.dataset.mode = mode;
        }
        if (next.label !== label) {
          label = next.label;
          labelEl.textContent = label;
        }
      };

      const show = () => {
        if (shown) return;
        shown = true;
        rx = tx;
        ry = ty;
        document.body.classList.add("has-custom-cursor");
        delete root.dataset.hidden;
      };
      const hide = () => {
        shown = false;
        root.dataset.hidden = "";
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") {
          // A touch on a hybrid device: step aside until the mouse moves again.
          hide();
          document.body.classList.remove("has-custom-cursor");
          return;
        }
        tx = event.clientX;
        ty = event.clientY;
        show();
        schedule();
      };
      const onOver = (event: PointerEvent) => {
        if (event.pointerType !== "touch") apply(resolve(event.target));
      };
      const onOut = (event: PointerEvent) => {
        if (!event.relatedTarget) hide(); // left the window
      };
      const onDown = () => {
        root.dataset.pressed = "";
      };
      const onUp = () => {
        delete root.dataset.pressed;
        // What's under the pointer may change after a click (menus, navigation).
        requestAnimationFrame(() => {
          if (shown) apply(resolve(document.elementFromPoint(tx, ty)));
        });
      };
      // Scrolling moves content under a still pointer; re-check once it settles.
      const onScroll = () => {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          if (shown) apply(resolve(document.elementFromPoint(tx, ty)));
        }, 120);
      };

      root.dataset.mode = mode;
      root.dataset.hidden = "";
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointerout", onOut, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("blur", hide);

      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(settleTimer);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointerout", onOut);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("blur", hide);
        document.body.classList.remove("has-custom-cursor");
        root.dataset.hidden = "";
      };
    };

    const evaluate = () => {
      const enabled = fine.matches && !reduce.matches;
      if (enabled && !stop) stop = start();
      else if (!enabled && stop) {
        stop();
        stop = null;
      }
    };

    evaluate();
    fine.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);
    return () => {
      fine.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
      stop?.();
    };
  }, []);

  return (
    <div ref={rootRef} className="cursor-dot cursor" aria-hidden="true" data-hidden="">
      <div ref={ringRef} className="cursor__ring">
        <div className="cursor__ring-shape">
          <span ref={labelRef} className="cursor__label" />
        </div>
      </div>
      <div ref={dotRef} className="cursor__dot">
        <div className="cursor__dot-shape" />
      </div>
    </div>
  );
}
