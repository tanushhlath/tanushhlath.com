import { Fragment, useMemo, useRef, type CSSProperties } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";
import { MOTION_TAGS } from "./tags";
import { motionSettings } from "./tokens";
import { useReveal } from "./useReveal";
import { entranceDelay, maskedTextVariants, revealVariants } from "./variants";

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

const STILL: Variants = { below: {}, visible: {}, above: {} };

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

/**
 * Masked heading reveal: words (or lines) slide up out of clipping masks,
 * reversibly — they sink back when you scroll up past the heading and drop
 * in from above when it re-enters from the top.
 *
 * Accessibility: headings carry the full text as their accessible name
 * (aria-label) with the split pieces hidden from assistive tech; other tags
 * get a visually hidden copy instead, because aria-label isn't allowed on
 * generic elements (`srText={false}` drops it when the enclosing heading is
 * already labelled). Reduced motion → the whole block fades.
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
  const { state, label, reduced, active } = useReveal(ref, { amount, disabled });
  const start = entranceDelay(delay, state);

  const emphasisKey = typeof emphasis === "string" ? emphasis : (emphasis ?? []).join(" ");
  const lines = useMemo(
    () => splitLines(text, new Set(emphasisKey.split(/\s+/).map(normalizeWord).filter(Boolean))),
    [text, emphasisKey]
  );

  const byLine = mode === "lines";
  const gap = byLine ? motionSettings.textStagger * 2.5 : motionSettings.textStagger;
  const pieceVariants = useMemo(() => maskedTextVariants({ delay: start, gap, reduced }), [start, gap, reduced]);
  const blockVariants = useMemo(
    () => (reduced ? revealVariants("fade", { delay: start, reduced: true }) : STILL),
    [reduced, start]
  );

  const labelled = /^h[1-6]$/.test(as);
  const plain = text.replace(/\s*\n\s*/g, " ");
  const initial = active ? "below" : false;
  const Tag = MOTION_TAGS[as];

  const renderWord = (word: Word) =>
    word.emphasized ? <span className={emphasisClassName}>{word.text}</span> : word.text;

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={style}
      aria-label={labelled ? plain : undefined}
      data-reveal={label}
      initial={initial}
      animate={label}
      variants={blockVariants}
    >
      {!labelled && srText && <span className="sr-only">{plain}</span>}
      <span aria-hidden="true">
        {byLine
          ? lines.map((words, li) => (
              <span key={li} className="text-reveal__line">
                <motion.span
                  className="text-reveal__piece"
                  data-reveal=""
                  custom={li}
                  initial={initial}
                  animate={label}
                  variants={pieceVariants}
                >
                  {words.map((word, wi) => (
                    <Fragment key={word.index}>
                      {wi > 0 && " "}
                      {renderWord(word)}
                    </Fragment>
                  ))}
                </motion.span>
              </span>
            ))
          : lines.map((words, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {words.map((word, wi) => (
                  <Fragment key={word.index}>
                    {wi > 0 && " "}
                    <span className="text-reveal__mask">
                      <motion.span
                        className={cn("text-reveal__piece", word.emphasized && emphasisClassName)}
                        data-reveal=""
                        custom={word.index}
                        initial={initial}
                        animate={label}
                        variants={pieceVariants}
                      >
                        {word.text}
                      </motion.span>
                    </span>
                  </Fragment>
                ))}
              </Fragment>
            ))}
      </span>
    </Tag>
  );
}
