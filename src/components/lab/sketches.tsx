import type { CSSProperties } from "react";
import type { LabStatus } from "@/types/content";

/**
 * Hand-drawn marks for the Lab: one small doodle per idea status, the
 * rubber-stamp status label, and loose line-work in the margins of the
 * workspace. Paths are drawn slightly off on purpose (no perfect circles
 * or straight grids) so they read as pencil on paper, not as icons.
 *
 * Every stroke has pathLength=1, so CSS can draw it in with
 * stroke-dashoffset when its card/section is on screen (beyond.css keys
 * this off the enclosing reveal's data-reveal attribute, so it undraws
 * when you scroll away and redraws when you come back). Decorative only.
 */

interface Stroke {
  d: string;
  /** Dotted/dashed strokes can't be "drawn" with dashoffset — they fade in instead. */
  dotted?: boolean;
  /** A soft fill behind the line (e.g. liquid in the flask). */
  wash?: boolean;
}

const SKETCHES: Record<LabStatus, Stroke[]> = {
  // A lightbulb that isn't quite closed, with a few rays.
  idea: [
    { d: "M58 45c-9-5-12-18-4-27 8-9 23-8 30 1 7 9 2 20-6 26" },
    { d: "M61 47c5 1 10 1 15-1" },
    { d: "M62 52c4 1 9 1 12 0" },
    { d: "M69 4l-1 6M92 13l-4 4M45 12l4 5M101 29h-6M35 30h6" },
  ],
  // A magnifier over a wandering path.
  exploring: [
    { d: "M8 58c10-7 15 4 25-2s8-16 19-14 12 9 20 6", dotted: true },
    { d: "M68 35c-1-9 6-16 14-16 9 0 15 7 14 15-1 9-8 14-16 13-7-1-12-5-12-12z" },
    { d: "M93 45l15 14" },
    { d: "M76 28c2-3 6-4 9-3" },
  ],
  // Blocks going up next to a crane.
  building: [
    { d: "M22 62c28-1 56 1 90 0" },
    { d: "M36 62l-1-21 18 1 1 20" },
    { d: "M54 62l1-33 19 1-1 32" },
    { d: "M96 62V13M96 13c-11 0-22 1-33 0M70 13l-1 11M92 13l5-6 5 6" },
  ],
  // A flask with something in it, and bubbles.
  testing: [
    { d: "M63 50c6-3 12 3 18 0s10-2 12 0", wash: true },
    { d: "M60 8h17M65 8l1 17-15 29c-2 5 1 8 6 8h25c5 0 8-3 6-8L73 25l-1-17" },
    { d: "M69 40a2.2 2.2 0 1 0 .2 0M77 33a1.6 1.6 0 1 0 .2 0M72 27a1.2 1.2 0 1 0 .2 0" },
    { d: "M108 20l4 4 8-9M108 40l4 4 8-9" },
  ],
  // Two bars inside a wobbly circle.
  paused: [
    { d: "M70 7c17-1 29 12 28 28-1 15-13 27-29 26-15 0-26-13-25-28 1-14 12-25 26-26" },
    { d: "M63 23l1 23M77 23l-1 23" },
  ],
  // A tick, circled, underlined.
  done: [
    { d: "M71 5c17-1 30 13 29 29-1 17-15 29-31 27-15-1-26-14-25-29 1-14 12-26 27-27" },
    { d: "M54 34l11 12 22-25" },
    { d: "M38 66c22-3 44-3 66 0" },
  ],
};

export function LabSketch({ status, className }: { status: LabStatus; className?: string }) {
  const strokes = SKETCHES[status] ?? SKETCHES.idea;
  return (
    <svg
      viewBox="0 0 140 70"
      className={className ? `by-sketch ${className}` : "by-sketch"}
      data-status={status}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {strokes.map((stroke, i) => (
        <path
          key={stroke.d}
          d={stroke.d}
          pathLength={1}
          className={
            stroke.wash ? "by-sketch__wash" : stroke.dotted ? "by-sketch__stroke by-sketch__stroke--dotted" : "by-sketch__stroke"
          }
          style={{ "--by-stroke": i } as CSSProperties}
        />
      ))}
    </svg>
  );
}

/** Loose margin marks around the workspace: an arrow in, a circled spot, crop marks. */
export function LabMargins() {
  return (
    <>
      <svg className="by-margin by-margin--arrow" viewBox="0 0 120 80" fill="none" aria-hidden="true" focusable="false">
        <path
          className="by-sketch__stroke"
          pathLength={1}
          style={{ "--by-stroke": 0 } as CSSProperties}
          d="M6 12c28-9 58 2 78 22 8 8 13 18 16 30"
        />
        <path
          className="by-sketch__stroke"
          pathLength={1}
          style={{ "--by-stroke": 3 } as CSSProperties}
          d="M88 58l12 7 5-14"
        />
      </svg>
      <svg className="by-margin by-margin--loop" viewBox="0 0 120 90" fill="none" aria-hidden="true" focusable="false">
        <path
          className="by-sketch__stroke"
          pathLength={1}
          style={{ "--by-stroke": 1 } as CSSProperties}
          d="M18 50c-3-20 18-36 44-33 26 3 42 20 36 38-7 19-38 26-62 16-15-6-20-20-10-30 9-9 26-10 40-6"
        />
      </svg>
      <svg className="by-margin by-margin--crop" viewBox="0 0 60 60" fill="none" aria-hidden="true" focusable="false">
        <path
          className="by-sketch__stroke"
          pathLength={1}
          style={{ "--by-stroke": 2 } as CSSProperties}
          d="M4 22V4h18M38 56h18V38"
        />
      </svg>
    </>
  );
}
