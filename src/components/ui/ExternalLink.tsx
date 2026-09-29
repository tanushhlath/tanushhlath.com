import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> {
  href: string;
  children: ReactNode;
  className?: string;
  /** Show the ↗ marker (default true). Hide it only when the design already says "leaving the site". */
  arrow?: boolean;
}

/**
 * A link that leaves the site: opens in a new tab with
 * `rel="noopener noreferrer"`, carries a visible ↗, and tells screen
 * readers it opens a new tab. mailto:/tel: links open in place (a new tab
 * would just be blank) and get no arrow.
 */
export function ExternalLink({ href, children, className, arrow = true, ...rest }: ExternalLinkProps) {
  const web = /^(https?:)?\/\//i.test(href);
  return (
    <a
      href={href}
      target={web ? "_blank" : undefined}
      rel={web ? "noopener noreferrer" : undefined}
      data-cursor="view"
      data-cursor-label={web ? "Visit" : undefined}
      {...rest}
      className={cn("ext-link", className)}
    >
      {children}
      {web && arrow && (
        <span className="ext-link__arrow" aria-hidden="true">
          ↗
        </span>
      )}
      {web && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}
