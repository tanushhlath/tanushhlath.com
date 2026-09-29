import type { ReactNode } from "react";
import { Reveal, TextReveal } from "@/animations";
import { cn } from "@/lib/cn";
import { Kicker, type KickerProps } from "./Kicker";

/**
 * Page compositions:
 *   "editorial" (default)  left-aligned, large heading, intro underneath
 *   "display"               oversized heading for the big narrative pages (Story, Work)
 *   "split"                 heading on the left, intro/aside in a right column (Me, Beyond)
 *   "centered"              centred and airy — playful entrances (Explore, 404)
 *   "compact"               smaller and tighter — functional pages (Archive)
 */
export type PageHeroVariant = "editorial" | "display" | "split" | "centered" | "compact";

export interface PageHeroProps {
  /** Small label above the heading (the page's place-name). */
  kicker?: ReactNode;
  /** The <h1>. A "\n" forces a line break. */
  title: string;
  /** Paragraph under the heading (a string is wrapped in <p>). */
  intro?: ReactNode;
  variant?: PageHeroVariant;
  /** Word(s) of the title to set in italic, e.g. "different". */
  emphasis?: string | readonly string[];
  /** Index shown in the kicker, e.g. "02" (matches the menu numbering). */
  index?: string;
  kickerTone?: KickerProps["tone"];
  /** Right-hand column ("split") or a block under the intro (other variants). */
  aside?: ReactNode;
  /** Extra content after the intro — tabs, calls to action. */
  children?: ReactNode;
  id?: string;
  /** id for the <h1>, e.g. to label the page's main region. */
  headingId?: string;
  className?: string;
}

/**
 * The opening of every secondary page: kicker → masked heading → intro,
 * arriving in that order (and replaying when scrolled back to). One
 * component, several compositions, so pages don't all open the same way.
 */
export function PageHero({
  kicker,
  title,
  intro,
  variant = "editorial",
  emphasis,
  index,
  kickerTone,
  aside,
  children,
  id,
  headingId,
  className,
}: PageHeroProps) {
  return (
    <header id={id} className={cn("page-hero", `page-hero--${variant}`, className)}>
      <div className="page-hero__inner">
        <div className="page-hero__main">
          {kicker && (
            <Reveal variant="fade">
              <Kicker index={index} tone={kickerTone} className="page-hero__kicker">
                {kicker}
              </Kicker>
            </Reveal>
          )}
          <TextReveal
            as="h1"
            id={headingId}
            text={title}
            emphasis={emphasis}
            delay={0.08}
            className="page-hero__title font-display"
            emphasisClassName="page-hero__emphasis"
          />
          {intro && (
            <Reveal delay={0.22} className="page-hero__intro">
              {typeof intro === "string" ? <p>{intro}</p> : intro}
            </Reveal>
          )}
          {children && (
            <Reveal delay={0.3} className="page-hero__extra">
              {children}
            </Reveal>
          )}
        </div>
        {aside && (
          <Reveal variant={variant === "split" ? "split-right" : "rise"} delay={0.28} className="page-hero__aside">
            {aside}
          </Reveal>
        )}
      </div>
    </header>
  );
}
