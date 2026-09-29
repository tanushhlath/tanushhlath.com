import type { ReactNode } from "react";
import { Reveal } from "@/animations";
import { ArrowLink, Kicker, SectionHeader, type ArrowLinkProps } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CopyLink } from "@/types/content";

/**
 * HOME BUILDING BLOCKS
 *
 * Thin Home-flavoured wrappers over the shared UI primitives
 * (src/components/ui — styled globally in src/styles/ui.css), so every
 * Home section introduces itself and links onward the same way the rest
 * of the site does. All copy comes in through props from `home` / `site`.
 */

type CursorMode = "view" | "explore" | "read";

/**
 * A section whose only title is its place-name ("Who I am"): the kicker
 * itself is the section's <h2>, revealed by unrolling from its rule.
 */
export function KickerHeading({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <Reveal variant="clip" className={cn("home-kicker-heading", className)}>
      <h2 id={id} className="home-kicker-heading__h">
        <Kicker as="span">{children}</Kicker>
      </h2>
    </Reveal>
  );
}

export interface HomeLinkProps extends ArrowLinkProps {
  /** Contextual cursor mode (components/misc/Cursor.tsx). Default "view". */
  cursor?: CursorMode;
}

/** ArrowLink with a contextual cursor mode — the site's standard onward link. */
export function HomeLink({ cursor = "view", ...props }: HomeLinkProps) {
  return <ArrowLink data-cursor={cursor} {...props} />;
}

export interface SectionIntroProps {
  kicker: string;
  heading: string;
  /** id of the heading (the section's aria-labelledby target). */
  headingId: string;
  cta?: CopyLink;
  ctaCursor?: CursorMode;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Kicker → masked heading, with the section's onward link opposite on
 * wide screens (under the heading on phones).
 */
export function SectionIntro({ kicker, heading, headingId, cta, ctaCursor, size = "md", className }: SectionIntroProps) {
  return (
    <SectionHeader
      kicker={kicker}
      title={heading}
      headingId={headingId}
      size={size}
      className={cn("home-header", className)}
      aside={
        cta ? (
          <HomeLink href={cta.href} cursor={ctaCursor}>
            {cta.label}
          </HomeLink>
        ) : undefined
      }
    />
  );
}
