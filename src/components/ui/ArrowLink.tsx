import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "@/routing/Link";
import { isExternalHref, normalizeHref } from "@/routing/paths";
import { cn } from "@/lib/cn";
import { ExternalLink } from "./ExternalLink";

export type ArrowDirection = "right" | "down" | "left" | "up";

export interface ArrowLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> {
  /** Internal path from `paths.*` (or a same-page "#anchor"). External URLs are handled too. */
  href: string;
  children: ReactNode;
  /**
   * "text"  — inline, underline draws in on hover (default)
   * "pill"  — hairline pill, for secondary calls to action
   * "solid" — filled electric blue, for the one primary action in a view
   */
  variant?: "text" | "pill" | "solid";
  /** Which way the arrow points. "down" suits "Enter ↓"-style same-page jumps. */
  direction?: ArrowDirection;
  /** Label for the contextual cursor. Default "Go". */
  cursorLabel?: string;
  className?: string;
}

const GLYPH: Record<ArrowDirection, string> = { right: "→", down: "↓", left: "←", up: "↑" };

/**
 * Internal call to action with an arrow that slides out and back in on
 * hover. Routes through the site's Link (canonical hrefs, view
 * transitions, same-page anchors, reset-on-current-page). An external
 * href becomes an ExternalLink with the ↗ marker instead.
 */
export function ArrowLink({
  href,
  children,
  variant = "text",
  direction = "right",
  cursorLabel = "Go",
  className,
  ...rest
}: ArrowLinkProps) {
  const classes = cn("arrow-link", `arrow-link--${variant}`, `arrow-link--${direction}`, className);

  if (isExternalHref(href)) {
    return (
      <ExternalLink href={href} className={classes} {...rest}>
        <span className="arrow-link__label">{children}</span>
      </ExternalLink>
    );
  }

  const glyph = GLYPH[direction];
  return (
    <Link href={normalizeHref(href)} className={classes} data-cursor="view" data-cursor-label={cursorLabel} {...rest}>
      <span className="arrow-link__label">{children}</span>
      <span className="arrow-link__arrow" aria-hidden="true">
        <span className="arrow-link__glyph">{glyph}</span>
        <span className="arrow-link__glyph arrow-link__glyph--next">{glyph}</span>
      </span>
    </Link>
  );
}
