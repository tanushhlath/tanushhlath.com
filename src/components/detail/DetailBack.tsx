import type { MouseEvent } from "react";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { DETAIL_UI } from "./model";
import type { ReturnTrail } from "./returnTrail";

export interface DetailBackProps {
  trail: ReturnTrail;
  /** "bar": compact control above the hero. "end": the large return at the foot of the page. */
  variant?: "bar" | "end";
  className?: string;
}

const PREFIX = `${DETAIL_UI.backTo} `;

/**
 * The explicit way back from a record — labelled with where it goes
 * ("Back to Work · Did · Leadership", "Back to Archive", "Back to
 * InnoVenture Competition"). A real link (to the record's Work lens, or
 * the origin page) that, when the visitor came from inside the site,
 * returns through history instead so the lens, filter and scroll
 * position are restored exactly. Modified clicks open the link normally.
 */
export function DetailBack({ trail, variant = "bar", className }: DetailBackProps) {
  const { target, goBack } = trail;
  const hasPrefix = target.label.startsWith(PREFIX);
  const segments = (hasPrefix ? target.label.slice(PREFIX.length) : target.label).split(" · ");

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (target.steps === 0) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goBack();
  };

  return (
    <Link
      href={target.href}
      onClick={onClick}
      className={cn("dt-back", `dt-back--${variant}`, className)}
      data-cursor="back"
      aria-label={target.label}
    >
      <span className="dt-back__icon" aria-hidden="true">
        <span className="dt-back__glyph">←</span>
      </span>
      <span className="dt-back__text" aria-hidden="true">
        {hasPrefix && <span className="dt-back__prefix">{DETAIL_UI.backTo}</span>}
        <span className="dt-back__path">
          {segments.map((segment, i) => (
            <span key={`${segment}-${i}`} className="dt-back__seg">
              {segment}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}
