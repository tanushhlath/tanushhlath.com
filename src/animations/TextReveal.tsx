import { Fragment, useMemo, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { motionSettings } from "./tokens";
import { entranceDelay, revealLabel } from "./variants";
import { useViewportState } from "./viewport";

type TextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "blockquote" | "figcaption";

export interface TextRevealProps {
  /** The text. A "\n" starts a new line (a line break in "words" mode, a new mask in "lines" mode). */
  text: string;
  as?: TextTag;
  /** "words": each word rises out of its own mask (headings). "lines": each line as one piece. */
  mode?: "words" | "lines";
  /** Seconds before the first word. */
  delay?: number;
  /** Reveal line; default `motionSettings.revealOffset`. */
  amount?: number;
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Word(s) to set apart, matched ignoring case and punctuation: "person" or ["build", "lead"]. */
  emphasis?: string | readonly string[];
  /** Class for emphasized words. Default "italic". */
  emphasisClassName?: string;
  /** Render visible and still. */
  disabled?: boolean;
  /**
   * Non-heading tags only. Default true: a visually hidden copy of the text
   * carries it for assistive tech. Pass false when an enclosing element
   * already names it (e.g. a heading with an aria-label around several
   * TextReveal spans), so that element holds exactly one copy of its text.
   */
  srText?: boolean;
}

interface Word {
  text: string;
  /** Position among all words — the stagger order. */
  index: number;
  emphasized: boolean;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function splitLines(text: string, emphasis: Set<string>): Word[][] {
  let index = 0;
  return text.split("\n").map((line) =>
    line
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ text: word, index: index++, emphasized: emphasis.has(normalizeWord(word)) }))
  );
}

const ms = (seconds: number) => `${Math.round(seconds * 1000)}ms`;

/** Stagger position of one moving piece (read by motion.css). */
function orderStyle(index: number): CSSProperties | undefined {
  return index ? ({ "--i": index } as CSSProperties) : undefined;
}

/**
 * Masked heading reveal: words (or lines) slide up out of clipping masks,
 * reversibly — they sink back when you scroll up past the heading and drop
 * in from above when it re-enters from the top.
 *
 * The motion itself is CSS (src/styles/motion.css, "TextReveal"): the block
 * carries `data-reveal` and its timing as custom properties, and every
 * piece transitions from its own position, so a heading costs no animation
 * work on the main thread and reverses smoothly from wherever it is. Each
 * word is three spans: the mask (clips), the mover (animates) and the piece
 * (`.text-reveal__piece`, free for page styles such as colour or an
 * underline, including their own transitions).
 *
 * Accessibility: headings carry the full text as their accessible name
 * (aria-label) with the split pieces hidden from assistive tech; other tags
 * get a visually hidden copy instead, because aria-label isn't allowed on
 * generic elements (`srText={false}` drops it when the enclosing heading is
 * already labelled). Reduced motion → the text is simply shown: no movement,
 * no fade, and nothing that differs between the prerendered page and the
 * first client render.
 */
export function TextReveal({
  text,
  as = "h2",
  mode = "words",
  delay = 0,
  amount,
  id,
  className,
  style,
  emphasis,
  emphasisClassName = "italic",
  disabled = false,
  srText = true,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const active = motionSettings.revealsEnabled && !disabled;
  const state = useViewportState(ref, { amount, disabled: !active });
  const label = revealLabel(state.phase);

  const emphasisKey = typeof emphasis === "string" ? emphasis : (emphasis ?? []).join(" ");
  const lines = useMemo(
    () => splitLines(text, new Set(emphasisKey.split(/\s+/).map(normalizeWord).filter(Boolean))),
    [text, emphasisKey]
  );

  const byLine = mode === "lines";
  const timing = {
    ...style,
    "--text-reveal-delay": ms(entranceDelay(delay, state)),
    "--text-reveal-gap": ms(byLine ? motionSettings.textStagger * 2.5 : motionSettings.textStagger),
    // Long headings still finish promptly.
    "--text-reveal-cap": ms(motionSettings.staggerMax * 2),
  } as CSSProperties;

  const labelled = /^h[1-6]$/.test(as);
  const plain = text.replace(/\s*\n\s*/g, " ");

  const renderWord = (word: Word) =>
    word.emphasized ? <span className={emphasisClassName}>{word.text}</span> : word.text;

  const pieces = byLine
    ? lines.map((words, li) => (
        <span key={li} className="text-reveal__line">
          <span className="text-reveal__move" data-reveal="" style={orderStyle(li)}>
            <span className="text-reveal__piece">
              {words.map((word, wi) => (
                <Fragment key={word.index}>
                  {wi > 0 && " "}
                  {renderWord(word)}
                </Fragment>
              ))}
            </span>
          </span>
        </span>
      ))
    : lines.map((words, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {words.map((word, wi) => (
            <Fragment key={word.index}>
              {wi > 0 && " "}
              <span className="text-reveal__mask">
                <span className="text-reveal__move" data-reveal="" style={orderStyle(word.index)}>
                  <span className={cn("text-reveal__piece", word.emphasized && emphasisClassName)}>{word.text}</span>
                </span>
              </span>
            </Fragment>
          ))}
        </Fragment>
      ));

  // Every allowed tag takes the same attributes; typed as one of them.
  const Tag = as as "div";

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn("text-reveal", className)}
      style={timing}
      aria-label={labelled ? plain : undefined}
      data-reveal={label}
    >
      {!labelled && srText && <span className="sr-only">{plain}</span>}
      <span aria-hidden="true">{pieces}</span>
    </Tag>
  );
}
