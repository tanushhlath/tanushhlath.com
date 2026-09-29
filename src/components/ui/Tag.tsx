import type { ReactNode } from "react";
import type { Importance } from "@/types/content";
import { importanceLabels } from "@/lib/content";
import { cn } from "@/lib/cn";

export type TagTone = "default" | "accent" | "lavender" | "ember" | "quiet" | "solid";

export interface TagProps {
  children: ReactNode;
  className?: string;
  /** Colour/weight of the chip. Default "default" (hairline, dim text). */
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

const tierTone: Record<Importance, TagTone> = {
  featured: "accent",
  significant: "default",
  archive: "quiet",
};

export interface TierTagProps {
  /** The record's `importance`. */
  tier: Importance;
  className?: string;
  /** Override the label from src/content/taxonomy.ts (importanceLabels). */
  label?: string;
}

/** Importance chip — "Featured" / "Significant" / "Archive". */
export function TierTag({ tier, className, label }: TierTagProps) {
  return (
    <Tag
      tone={tierTone[tier]}
      dot={tier === "featured"}
      className={cn(tier === "significant" && "tag--strong", className)}
      title={importanceLabels[tier].description}
    >
      {label ?? importanceLabels[tier].label}
    </Tag>
  );
}
