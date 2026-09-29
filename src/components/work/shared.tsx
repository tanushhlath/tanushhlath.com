import type { ReactNode } from "react";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { WORK_UI, claimSharedCover } from "./helpers";
import { workBackState, type WorkState } from "./lensState";

/**
 * Small components shared by the four Work lenses.
 */

export interface RecordLinkProps {
  /** Record id (used for the shared-cover hand-off). */
  id: string;
  /** Always the record's canonical route: entry.href / paths.workItem(id). */
  href: string;
  /** Current lens + filter, handed to the detail page for its "Back" link. */
  from: WorkState;
  children?: ReactNode;
  className?: string;
  cursorLabel?: string;
  /** Decorative duplicate of another link to the same record (e.g. a cover): out of the tab order and hidden from AT. */
  duplicate?: boolean;
  "aria-label"?: string;
}

/** A link to one record's detail page, carrying the Back state and the shared-cover hand-off. */
export function RecordLink({
  id,
  href,
  from,
  children,
  className,
  cursorLabel = WORK_UI.open,
  duplicate = false,
  "aria-label": ariaLabel,
}: RecordLinkProps) {
  return (
    <Link
      href={href}
      state={workBackState(from)}
      onClick={(event) => claimSharedCover(event, id)}
      className={className}
      data-cursor="view"
      data-cursor-label={cursorLabel}
      aria-label={ariaLabel}
      tabIndex={duplicate ? -1 : undefined}
      aria-hidden={duplicate ? true : undefined}
    >
      {children}
    </Link>
  );
}

/** "Open →" with an arrow that slides out and back in on hover of the enclosing link. */
export function OpenArrow({ children = WORK_UI.open, className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn("wk-open", className)}>
      <span className="wk-open__label">{children}</span>
      <span className="wk-open__arrow" aria-hidden="true">
        <span className="wk-open__glyph">→</span>
        <span className="wk-open__glyph wk-open__glyph--next">→</span>
      </span>
    </span>
  );
}

/**
 * A small geometric marker per category — shape, not colour, carries the
 * difference (colour stays reserved for state). Unknown ids get a dot.
 */
export function CategoryMarker({ category, className }: { category: string; className?: string }) {
  return <span className={cn("wk-marker", className)} data-cat={category} aria-hidden="true" />;
}

/** A tiny rosette glyph for recognition results. */
export function RibbonGlyph({ className }: { className?: string }) {
  return (
    <svg className={cn("wk-ribbon", className)} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.6 9.4 4.4 14.5l3.6-1.8 3.6 1.8-1.2-5.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
