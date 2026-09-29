import { ArrowLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Recognition } from "@/types/content";
import { splitResult } from "./model";

export interface RecognitionMarkProps {
  recognition: Recognition;
  /** "seal": the compact badge on the hero image. "display": the large typographic outcome. */
  variant?: "seal" | "display";
  /** Small label above the result ("Recognition"). */
  label?: string;
  /** Year shown in the seal (recognition.year, else the event's). */
  year?: number;
  className?: string;
}

/**
 * A result set as type — "1st Runner-Up", "4 Gold Medals", "Grand
 * National Finale" — exactly as written in the content (never
 * reworded). A leading number is set apart so it reads at a glance.
 */
export function RecognitionMark({ recognition, variant = "display", label, year, className }: RecognitionMarkProps) {
  const { num, suffix, rest } = splitResult(recognition.result);
  return (
    <div
      className={cn("dt-rec", `dt-rec--${variant}`, className)}
      data-level={recognition.level}
      data-numbered={num ? "" : undefined}
    >
      {(label || (variant === "seal" && year)) && (
        <p className="dt-rec__label">
          {label && <span>{label}</span>}
          {variant === "seal" && year !== undefined && <span className="dt-rec__year">{year}</span>}
        </p>
      )}
      <p className="dt-rec__result font-display">
        {num && (
          <span className="dt-rec__num">
            {num}
            {suffix && <span className="dt-rec__suffix">{suffix}</span>}
          </span>
        )}
        <span className="dt-rec__rest">{rest}</span>
      </p>
      {variant === "display" && recognition.detail && <p className="dt-rec__detail">{recognition.detail}</p>}
    </div>
  );
}

export interface RecognitionNoteProps {
  recognition: Recognition;
  /** Small label ("Recognition"). */
  label: string;
  /** recognition.year, else the event's. */
  year?: number;
  /** Where the recognition is filed in the Recognized lens (its category), as a link. */
  filed?: { label: string; href: string };
}

/**
 * The outcome of an award whose result IS its title ("Best Boarder
 * Award"): a compact medallion — the year in a ring, the label, and where
 * it sits among the other recognitions — instead of a display headline
 * that would only repeat the page title.
 */
export function RecognitionNote({ recognition, label, year, filed }: RecognitionNoteProps) {
  return (
    <div className="dt-rec dt-rec--note" data-level={recognition.level}>
      <div className="dt-rec__note-text">
        <p className="dt-rec__label">
          <span>{label}</span>
        </p>
        {filed && (
          <ArrowLink href={filed.href} className="dt-rec__filed">
            {filed.label}
          </ArrowLink>
        )}
        {recognition.detail && <p className="dt-rec__detail">{recognition.detail}</p>}
      </div>
      {year !== undefined && (
        <p className="dt-rec__medal font-display">
          <span>{year}</span>
        </p>
      )}
    </div>
  );
}
