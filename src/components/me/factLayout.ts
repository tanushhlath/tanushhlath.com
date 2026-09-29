import type { CSSProperties } from "react";
import type { PersonalDetail } from "@/types/content";

/**
 * "A few things about me" — a mosaic with no holes.
 *
 * Every card asks for a size from its kind (the preferred number is tall,
 * the game card and long answers are wide, the rest are single cells).
 * The cards are then packed like CSS `grid-auto-flow: dense` for each
 * breakpoint's column count, and any hole left over (usually at the end)
 * is absorbed by growing a neighbour into it. The result is written as
 * explicit grid placements in CSS variables (me.css reads them per
 * breakpoint), so the mosaic always fills its rectangle exactly —
 * whatever cards are added to or removed from personal.ts.
 *
 * Pure and deterministic: same content, same layout on the server and in
 * the browser.
 */

/** Column counts per breakpoint — keep in sync with .me-facts in me.css. */
export const FACT_COLUMNS = { sm: 2, md: 3, lg: 4 } as const;
type Breakpoint = keyof typeof FACT_COLUMNS;

interface Size {
  w: number;
  h: number;
}

interface Placement {
  c: number;
  r: number;
  w: number;
  h: number;
}

/** Long answers get a wide card so they never wrap into a narrow column. */
const LONG_ANSWER = 44;

export function preferredSize(detail: PersonalDetail): Size {
  if (detail.accent === "number") return { w: 1, h: 2 };
  if (detail.accent === "game") return { w: 2, h: 1 };
  if (detail.answer.length > LONG_ANSWER) return { w: 2, h: 1 };
  return { w: 1, h: 1 };
}

export function packFacts(sizes: readonly Size[], cols: number): Placement[] {
  const grid: (number | undefined)[][] = [];
  const out: Placement[] = [];
  const at = (r: number, c: number) => grid[r]?.[c];
  const free = (r: number, c: number, w: number, h: number) => {
    if (c < 0 || c + w > cols) return false;
    for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) if (at(rr, cc) !== undefined) return false;
    return true;
  };
  const occupy = (i: number, r: number, c: number, w: number, h: number) => {
    for (let rr = r; rr < r + h; rr++) {
      grid[rr] ??= [];
      for (let cc = c; cc < c + w; cc++) grid[rr][cc] = i;
    }
  };

  // Dense placement: every card takes the first slot (row-major) it fits.
  sizes.forEach((size, i) => {
    const w = Math.min(size.w, cols);
    for (let r = 0; ; r++) {
      let placed = false;
      for (let c = 0; c < cols && !placed; c++) {
        if (free(r, c, w, size.h)) {
          occupy(i, r, c, w, size.h);
          out.push({ c, r, w, h: size.h });
          placed = true;
        }
      }
      if (placed) break;
    }
  });

  // Fill holes by growing a neighbour: left card widens, card above
  // deepens, or right card widens leftwards.
  const rows = out.reduce((max, p) => Math.max(max, p.r + p.h), 0);
  for (let changed = true; changed; ) {
    changed = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (at(r, c) !== undefined) continue;
        const left = c > 0 ? at(r, c - 1) : undefined;
        if (left !== undefined) {
          const p = out[left];
          if (p.c + p.w === c && free(p.r, c, 1, p.h)) {
            occupy(left, p.r, c, 1, p.h);
            p.w += 1;
            changed = true;
            continue;
          }
        }
        const above = r > 0 ? at(r - 1, c) : undefined;
        if (above !== undefined) {
          const p = out[above];
          if (p.r + p.h === r && free(r, p.c, p.w, 1)) {
            occupy(above, r, p.c, p.w, 1);
            p.h += 1;
            changed = true;
            continue;
          }
        }
        const right = at(r, c + 1);
        if (right !== undefined) {
          const p = out[right];
          if (p.c === c + 1 && free(p.r, c, 1, p.h)) {
            occupy(right, p.r, c, 1, p.h);
            p.c -= 1;
            p.w += 1;
            changed = true;
          }
        }
      }
    }
  }
  return out;
}

export interface FactLayout {
  /** CSS variables with each breakpoint's grid placement for the card. */
  style: CSSProperties;
  /** Width in columns at the widest layout (for type sizing). */
  wide: boolean;
  tall: boolean;
}

/** Grid placements for every card, at every breakpoint. */
export function layoutFacts(details: readonly PersonalDetail[]): FactLayout[] {
  const sizes = details.map(preferredSize);
  const byBreakpoint = Object.fromEntries(
    (Object.keys(FACT_COLUMNS) as Breakpoint[]).map((bp) => [bp, packFacts(sizes, FACT_COLUMNS[bp])])
  ) as Record<Breakpoint, Placement[]>;

  return details.map((_, i) => {
    const style: Record<string, string> = {};
    for (const bp of Object.keys(FACT_COLUMNS) as Breakpoint[]) {
      const p = byBreakpoint[bp][i];
      style[`--fact-col-${bp}`] = `${p.c + 1} / span ${p.w}`;
      style[`--fact-row-${bp}`] = `${p.r + 1} / span ${p.h}`;
    }
    const lg = byBreakpoint.lg[i];
    return { style: style as CSSProperties, wide: lg.w > 1, tall: lg.h > 1 };
  });
}
