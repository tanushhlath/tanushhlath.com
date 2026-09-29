import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface KickerProps {
  children: ReactNode;
  className?: string;
  /** Element to render. Default "p". */
  as?: "p" | "span" | "div";
  /** Optional index before the label, e.g. "02" for a numbered chapter. */
  index?: string;
  /** Colour of the leading rule. Default "azure". */
  tone?: "azure" | "lavender" | "ember" | "quiet";
  id?: string;
}

/** Small uppercase label used above headings to give sections a place-name. */
export function Kicker({ children, className, as: Tag = "p", index, tone = "azure", id }: KickerProps) {
  return (
    <Tag id={id} className={cn("kicker", `kicker--${tone}`, className)}>
      <span className="kicker__rule" aria-hidden="true" />
      {index && <span className="kicker__index">{index}</span>}
      <span className="kicker__label">{children}</span>
    </Tag>
  );
}
