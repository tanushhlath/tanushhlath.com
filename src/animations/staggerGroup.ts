import { createContext } from "react";
import { motionSettings } from "./tokens";
import type { RevealVariant } from "./variants";

/**
 * STAGGER GROUPS
 *
 * Every `<StaggerItem>` observes itself, so items in a long grid reveal row
 * by row as they scroll into view (and reverse one by one on the way back)
 * instead of all firing when the top of the list arrives. The group only
 * decides the order: items whose entrances land in the same frame — a row,
 * or everything on screen at page load — are collected, sorted into
 * document order and given increasing delays (capped at
 * `motionSettings.staggerMax`, so big groups never keep anyone waiting).
 * Exits don't wait for anything.
 */

export interface StaggerMember {
  element: Element;
  /** Reveal now, `offset` seconds after the group's own delay. */
  enter(offset: number): void;
}

export interface StaggerGroup {
  join(member: StaggerMember): void;
  leave(member: StaggerMember): void;
}

function byDocumentOrder(a: StaggerMember, b: StaggerMember): number {
  if (a.element === b.element) return 0;
  return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/** `gap`: seconds between consecutive items of one batch. */
export function createStaggerGroup(gap: number): StaggerGroup {
  let pending: StaggerMember[] = [];
  let scheduled = false;

  // All entrances from one IntersectionObserver callback arrive
  // synchronously, so a microtask sees the complete batch.
  function flush() {
    scheduled = false;
    const batch = pending.sort(byDocumentOrder);
    pending = [];
    batch.forEach((member, i) => member.enter(Math.min(i * gap, motionSettings.staggerMax)));
  }

  return {
    join(member) {
      if (pending.includes(member)) return;
      pending.push(member);
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(flush);
      }
    },
    leave(member) {
      if (pending.length) pending = pending.filter((m) => m !== member);
    },
  };
}

/** What a `<Stagger>` hands its items. */
export interface StaggerSettings {
  group: StaggerGroup;
  variant: RevealVariant;
  /** Seconds before the first item of every batch. */
  delay: number;
  amount?: number;
  duration?: number;
  distance?: number;
}

export const StaggerContext = createContext<StaggerSettings | null>(null);
