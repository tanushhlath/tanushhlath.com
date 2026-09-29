import type { BeyondMode } from "@/routing/paths";
import type { NowLabel } from "@/types/content";

/**
 * Small drawn marks for Beyond: one glyph per Now label (what kind of
 * "current" a board item is) and one emblem per mode (the three rooms).
 * Pure SVG in currentColor, decorative (aria-hidden) — the words next to
 * them carry the meaning. Anything that moves is CSS in beyond.css, and
 * only while the room is active, never under reduced motion.
 */

const NOW_GLYPHS: Record<NowLabel, string[]> = {
  // Blocks being stacked.
  building: ["M3 15.5h12", "M4.5 15.5V10h4.2v5.5", "M8.7 15.5V6.2h4.8v9.3", "M10.4 3.6l2.4 1.2"],
  // An open book.
  learning: [
    "M9 5.2C7.2 3.9 4.9 3.8 3 4.6v10c1.9-.8 4.2-.7 6 .6 1.8-1.3 4.1-1.4 6-.6v-10c-1.9-.8-4.2-.7-6 .6z",
    "M9 5.2v10",
  ],
  // A page with lines, a bookmark.
  reading: ["M4.5 3h9v12h-9z", "M6.8 6.5h4.4", "M6.8 9h4.4", "M6.8 11.5h2.6", "M11.2 3v3.6l1-.8 1 .8V3"],
  // A compass: ring + needle.
  exploring: ["M9 2.8a6.2 6.2 0 1 1 0 12.4 6.2 6.2 0 0 1 0-12.4z", "M11.6 6.4 10 10 6.4 11.6 8 8z"],
  // A target.
  goal: ["M9 2.8a6.2 6.2 0 1 1 0 12.4 6.2 6.2 0 0 1 0-12.4z", "M9 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6z", "M9 8.4v1.2"],
  // A knot being worked loose.
  challenge: ["M2.8 9c0-3.2 4.2-3.2 6.2 0s6.2 3.2 6.2 0-4.2-3.2-6.2 0-6.2 3.2-6.2 0z"],
};

export function NowGlyph({ label, className }: { label: NowLabel; className?: string }) {
  const paths = NOW_GLYPHS[label] ?? NOW_GLYPHS.building;
  return (
    <svg
      viewBox="0 0 18 18"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Mini-visual for each room in the mode switcher (160×90). */
export function ModeEmblem({ mode }: { mode: BeyondMode }) {
  return (
    <svg
      viewBox="0 0 160 90"
      className="by-emblem"
      data-emblem={mode}
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMaxYMid meet"
    >
      {mode === "now" && (
        <g className="by-emblem__now">
          <circle className="by-emblem__ring by-emblem__ring--1" cx="118" cy="45" r="14" />
          <circle className="by-emblem__ring by-emblem__ring--2" cx="118" cy="45" r="26" />
          <circle className="by-emblem__ring by-emblem__ring--3" cx="118" cy="45" r="38" />
          <circle className="by-emblem__core" cx="118" cy="45" r="4.5" />
          <path className="by-emblem__trace" d="M4 58h34l6-14 7 26 6-19 5 7h26" />
        </g>
      )}
      {mode === "next" && (
        <g className="by-emblem__next">
          <path className="by-emblem__sky" d="M8 30h148" />
          <path className="by-emblem__rail" d="M60 90 128 30M150 90l-22-60M8 72l120-42M100 90l28-60" />
          <path className="by-emblem__road" d="M112 90 128 30" />
          <circle className="by-emblem__stop" cx="116" cy="75" r="4.2" />
          <circle className="by-emblem__stop" cx="121.5" cy="54" r="3" />
          <circle className="by-emblem__stop" cx="125" cy="41" r="2.1" />
          <circle className="by-emblem__stop by-emblem__stop--far" cx="127.2" cy="33.5" r="1.4" />
        </g>
      )}
      {mode === "lab" && (
        <g className="by-emblem__lab">
          <path className="by-emblem__grid" d="M72 8v74M96 8v74M120 8v74M144 8v74M60 20h96M60 44h96M60 68h96" />
          <path
            className="by-emblem__scribble"
            pathLength={1}
            d="M86 56c-8-10 2-26 18-25 15 1 24 14 17 25-6 10-22 12-31 5-8-6-4-18 6-19 9-1 14 7 9 12"
          />
          <path className="by-emblem__scribble by-emblem__scribble--arrow" pathLength={1} d="M130 70c6-5 10-12 11-21m-6 4 6-5 4 7" />
        </g>
      )}
    </svg>
  );
}

/**
 * The live signal in the corner of the lead Now card: slow rings around a
 * point and a trace running into it. Decorative; the rings only move when
 * motion is allowed (beyond.css).
 */
export function NowSignal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} fill="none" aria-hidden="true" focusable="false">
      <path className="by-signal__trace" d="M0 132h58l9-22 11 44 10-34 8 12h44" />
      <circle className="by-signal__ring by-signal__ring--1" cx="168" cy="132" r="18" />
      <circle className="by-signal__ring by-signal__ring--2" cx="168" cy="132" r="36" />
      <circle className="by-signal__ring by-signal__ring--3" cx="168" cy="132" r="54" />
      <circle className="by-signal__ring by-signal__ring--4" cx="168" cy="132" r="72" />
      <circle className="by-signal__core" cx="168" cy="132" r="5" />
    </svg>
  );
}
