import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TagTone = "default" | "accent" | "ember" | "quiet";

export interface TagProps {
  children: ReactNode;
  className?: string;
  /**
   * Colour of the chip. Default "default" (hairline, dim text).
   * "accent" — electric blue, for live/current status; "ember" — warm,
   * for the rare turning point; "quiet" — fainter than default, for dates
   * and tools.
   */
  tone?: TagTone;
  /** Small leading dot — for status-like tags ("Building", "Live"). */
  dot?: boolean;
  title?: string;
}

/** A small rounded label: category, year, status, tool. Not interactive. */
export function Tag({ children, className, tone = "default", dot = false, title }: TagProps) {
  return (
    <span className={cn("tag", tone !== "default" && `tag--${tone}`, className)} title={title}>
      {dot && <span className="tag__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
