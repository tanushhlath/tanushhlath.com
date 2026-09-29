import type { ReactNode } from "react";
import { Reveal, TextReveal } from "@/animations";
import { cn } from "@/lib/cn";
import { Kicker, type KickerProps } from "./Kicker";

export interface SectionHeaderProps {
  /** The heading text. A "\n" forces a line break. */
  title: string;
  kicker?: ReactNode;
  /** Index in the kicker, e.g. "02". */
  index?: string;
  kickerTone?: KickerProps["tone"];
  /** Paragraph under the heading (a string is wrapped in <p>). */
  intro?: ReactNode;
  /** Content opposite the heading on wide screens (a link, a count, a toggle). */
  aside?: ReactNode;
  /** Heading level. Default "h2". */
  as?: "h2" | "h3";
  align?: "start" | "center";
  /** "md" (default) or "lg" for chapter-sized sections. */
  size?: "md" | "lg";
  /** Word(s) of the title to set in italic. */
  emphasis?: string | readonly string[];
  /** id on the wrapper — the anchor target (scroll-margin clears the top bar). */
  id?: string;
  /** id on the heading itself, for aria-labelledby. */
  headingId?: string;
  className?: string;
}

/**
 * Kicker + masked heading + optional intro, with an optional aside
 * opposite. The standard way a section introduces itself.
 */
export function SectionHeader({
  title,
  kicker,
  index,
  kickerTone,
  intro,
  aside,
  as = "h2",
  align = "start",
  size = "md",
  emphasis,
  id,
  headingId,
  className,
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      className={cn(
        "section-header",
        `section-header--${size}`,
        align === "center" && "section-header--center",
        aside !== undefined && "section-header--with-aside",
        className
      )}
    >
      <div className="section-header__main">
        {kicker && (
          <Reveal variant="fade">
            <Kicker index={index} tone={kickerTone}>
              {kicker}
            </Kicker>
          </Reveal>
        )}
        <TextReveal
          as={as}
          id={headingId}
          text={title}
          emphasis={emphasis}
          delay={0.06}
          className="section-header__title font-display"
          emphasisClassName="section-header__emphasis"
        />
        {intro && (
          <Reveal delay={0.16} className="section-header__intro">
            {typeof intro === "string" ? <p>{intro}</p> : intro}
          </Reveal>
        )}
      </div>
      {aside !== undefined && (
        <Reveal variant="fade" delay={0.2} className="section-header__aside">
          {aside}
        </Reveal>
      )}
    </div>
  );
}
