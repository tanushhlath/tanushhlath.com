import type { MouseEvent } from "react";
import { archiveCopy } from "@/lib/content";
import { workTransitionName } from "@/routing/transitions";

/**
 * Non-component helpers shared by the four Work lenses.
 */

/** Short interface words used across the lenses (verbs and labels, not page copy). */
export const WORK_UI = {
  open: "Open",
  openRecord: "Open the full record",
  more: "More",
  less: "Less",
  jumpToYear: "Jump to year",
  quickSwitch: "Switch lens",
  nextLens: "Next lens",
  filter: "Filter",
  count: archiveCopy.count,
} as const;

/** "1 entry" / "7 entries" (words from the archive copy). */
export const countLabel = (n: number): string => `${n} ${n === 1 ? WORK_UI.count.one : WORK_UI.count.many}`;

/**
 * Shared-element transition into a detail page: the card's cover gets
 * `view-transition-name: work-<id>` at the moment it's clicked — the same
 * name the detail hero carries — so exactly one element morphs (card →
 * hero) instead of every cover on the page being snapshotted.
 * Mark the cover element with `data-work-cover={id}`.
 */
export function claimSharedCover(event: MouseEvent<HTMLElement>, id: string): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  document.querySelectorAll<HTMLElement>("[data-work-cover]").forEach((el) => {
    el.style.removeProperty("view-transition-name");
  });
  const cover = document.querySelector<HTMLElement>(`[data-work-cover="${CSS.escape(id)}"]`);
  cover?.style.setProperty("view-transition-name", workTransitionName(id));
}

/**
 * Splits a result into a leading number and the rest, so the number can
 * be set apart typographically: "1st Runner-Up" → { num: "1", suffix: "st",
 * rest: "Runner-Up" }, "4 Gold Medals" → { num: "4", rest: "Gold Medals" },
 * "Final Round" → { rest: "Final Round" }.
 */
export function splitResult(result: string): { num?: string; suffix?: string; rest: string } {
  const match = /^(\d+)(st|nd|rd|th)?\s+(.+)$/i.exec(result.trim());
  if (!match) return { rest: result.trim() };
  return { num: match[1], suffix: match[2], rest: match[3] };
}

/** Two-digit index, e.g. 2 → "02". */
export const pad2 = (n: number): string => String(n).padStart(2, "0");
