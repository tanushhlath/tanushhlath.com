import { useId, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { motion } from "framer-motion";
import {
  DUR,
  EASE,
  Stagger,
  StaggerItem,
  Tilt,
  TiltLayer,
  useReducedMotionSafe,
  type RevealVariant,
} from "@/animations";
import { ExternalLink } from "@/components/ui";
import Link from "@/routing/Link";
import { cn } from "@/lib/cn";
import { meCopy } from "@/lib/content";
import type { PersonalDetail } from "@/types/content";
import { layoutFacts } from "./factLayout";
import { useHashChoice } from "./useHashChoice";

/**
 * A FEW THINGS ABOUT ME — a mosaic of small, specific answers.
 *
 * The grid is packed with no holes at every breakpoint (factLayout.ts);
 * each kind of card has its own entrance and its own interaction:
 *
 *   number  (hidden)  "? ?" slots → Reveal → the digits roll up like an
 *                     odometer into a big numeral
 *   hidden  (other)   the card flips over in 3D to show the answer
 *   game              leans toward the pointer with its track art in depth;
 *                     a ball rolls down the slope when it arrives / on
 *                     hover; "Play … ↗" opens the game in a new tab
 *   music             an equaliser that plays a few bars on arrival / hover
 *   place             a pin that sends out a ping on arrival / hover
 *   default           the answer steps forward when you hover or focus it
 *
 * Arrivals are reversible (StaggerItem variants differ per kind).
 *
 * Deep links: every card's id is `fact-<id>`. /me/#fact-preferred-number
 * (Home's quick questions link here) scrolls to that card (ScrollManager)
 * and marks it `data-targeted`: a soft ring settles around it and, if the
 * answer is covered, its Reveal button invites the click (me.css). The
 * mark follows the URL, so it clears on the next in-page navigation.
 */

type Kind = "number" | "flip" | "game" | "music" | "place" | "default";

function kindOf(detail: PersonalDetail): Kind {
  if (detail.accent === "number") return "number";
  if (detail.hidden) return "flip";
  if (detail.accent === "game" || detail.accent === "music" || detail.accent === "place") return detail.accent;
  return "default";
}

const ENTRANCE: Record<Kind, RevealVariant> = {
  number: "mask",
  flip: "tilt",
  game: "tilt",
  music: "blur",
  place: "rise",
  default: "rise",
};

/** Answers this short are set big, like a one-word reply. */
const SHORT_ANSWER = 16;

export function PersonalCollage({ details }: { details: PersonalDetail[] }) {
  const layout = useMemo(() => layoutFacts(details), [details]);
  const [targetId] = useHashChoice<string | null>(
    "fact-",
    (id) => details.some((d) => d.id === id),
    null
  );
  if (details.length === 0) return null;

  return (
    <Stagger as="ul" gap={0.06} className="me-facts">
      {details.map((detail, i) => {
        const kind = kindOf(detail);
        const place = layout[i];
        const variant = kind === "default" && place.wide ? "clip" : ENTRANCE[kind];
        return (
          <StaggerItem
            as="li"
            key={detail.id}
            id={`fact-${detail.id}`}
            data-targeted={detail.id === targetId ? "" : undefined}
            variant={variant}
            className={cn(
              "me-fact",
              `me-fact--${kind}`,
              place.wide && "me-fact--wide",
              place.tall && "me-fact--tall"
            )}
            style={place.style}
          >
            <FactCard detail={detail} kind={kind} />
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

function FactCard({ detail, kind }: { detail: PersonalDetail; kind: Kind }) {
  switch (kind) {
    case "number":
      return <NumberFact detail={detail} />;
    case "flip":
      return <FlipFact detail={detail} />;
    case "game":
      return <GameFact detail={detail} />;
    case "music":
      return <MusicFact detail={detail} />;
    case "place":
      return <PlaceFact detail={detail} />;
    default:
      return <PlainFact detail={detail} />;
  }
}

function Heading({ detail, id }: { detail: PersonalDetail; id?: string }) {
  return (
    <>
      <p className="me-fact__cat">{detail.category}</p>
      <h3 className="me-fact__prompt" id={id}>
        {detail.prompt}
      </h3>
    </>
  );
}

function Answer({ detail, className, children }: { detail: PersonalDetail; className?: string; children?: ReactNode }) {
  const short = detail.answer.length <= SHORT_ANSWER;
  return (
    <p className={cn("me-fact__answer font-display", short && "me-fact__answer--big", className)}>
      {children ?? detail.answer}
    </p>
  );
}

function FactLink({ detail }: { detail: PersonalDetail }) {
  if (!detail.link) return null;
  return detail.link.external ? (
    <ExternalLink href={detail.link.href} className="me-fact__link" data-cursor-label="Play">
      {detail.link.label}
    </ExternalLink>
  ) : (
    <Link href={detail.link.href} className="me-fact__link" data-cursor="view">
      {detail.link.label}
    </Link>
  );
}

/* ---------------------------------------------------------------- */
/* default — the answer steps forward on hover / focus               */
/* ---------------------------------------------------------------- */

function PlainFact({ detail }: { detail: PersonalDetail }) {
  return (
    <div className="me-fact__card me-fact__card--plain">
      <span className="me-fact__mark font-display" aria-hidden="true">
        &ldquo;
      </span>
      <Heading detail={detail} />
      <Answer detail={detail} />
      <FactLink detail={detail} />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* number — "? ?" slots, then an odometer roll into a big numeral     */
/* ---------------------------------------------------------------- */

function NumberFact({ detail }: { detail: PersonalDetail }) {
  const [shown, setShown] = useState(!detail.hidden);
  const answerRef = useRef<HTMLSpanElement>(null);
  const promptId = useId();
  const answerId = useId();
  const chars = Array.from(detail.answer);

  const reveal = () => {
    setShown(true);
    // Keep keyboard focus on the thing that just appeared.
    window.requestAnimationFrame(() => answerRef.current?.focus());
  };

  return (
    <div className="me-fact__card me-fact__card--number" data-shown={shown ? "true" : "false"}>
      <Heading detail={detail} id={promptId} />
      <div className="me-number" id={answerId} aria-live="polite">
        {shown ? (
          <Odometer ref={answerRef} value={detail.answer} labelledBy={promptId} />
        ) : (
          <span className="me-number__slots" aria-hidden="true">
            {chars.map((_, i) => (
              <span key={i} className="me-number__slot font-display">
                ?
              </span>
            ))}
          </span>
        )}
      </div>
      {!shown && (
        <button
          type="button"
          className="me-fact__reveal"
          aria-expanded={false}
          aria-controls={answerId}
          aria-describedby={promptId}
          onClick={reveal}
          data-cursor="view"
          data-cursor-label={meCopy.personal.revealLabel}
        >
          {meCopy.personal.revealLabel}
        </button>
      )}
      <FactLink detail={detail} />
    </div>
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function Odometer({ value, labelledBy, ref }: { value: string; labelledBy: string; ref?: Ref<HTMLSpanElement> }) {
  const reduced = useReducedMotionSafe();
  const chars = Array.from(value);
  return (
    <span ref={ref} tabIndex={-1} className="me-odo font-display" aria-labelledby={labelledBy}>
      <span className="sr-only">{value}</span>
      <span className="me-odo__row" aria-hidden="true">
        {chars.map((char, i) => {
          const digit = DIGITS.indexOf(char);
          if (digit < 0 || reduced) {
            return (
              <motion.span
                key={i}
                className="me-odo__char"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DUR.base, delay: i * 0.08 }}
              >
                {char}
              </motion.span>
            );
          }
          return (
            <span key={i} className="me-odo__slot">
              <motion.span
                className="me-odo__strip"
                initial={{ y: "0%" }}
                animate={{ y: `${-digit * 10}%` }}
                transition={{ duration: DUR.cinematic + i * 0.25, ease: EASE.cinematic, delay: 0.05 + i * 0.12 }}
              >
                {DIGITS.map((d) => (
                  <span key={d} className="me-odo__digit">
                    {d}
                  </span>
                ))}
              </motion.span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* hidden (any other) — flips over in 3D                              */
/* ---------------------------------------------------------------- */

function FlipFact({ detail }: { detail: PersonalDetail }) {
  const [flipped, setFlipped] = useState(false);
  const backRef = useRef<HTMLDivElement>(null);
  const backId = useId();

  const flip = () => {
    setFlipped(true);
    window.requestAnimationFrame(() => backRef.current?.focus());
  };

  return (
    <div className="me-flip" data-flipped={flipped ? "true" : "false"}>
      <div className="me-flip__inner">
        <div className="me-flip__face me-flip__face--front" inert={flipped}>
          <div className="me-fact__card me-fact__card--flip">
            <Heading detail={detail} />
            <span className="me-flip__glyph font-display" aria-hidden="true">
              ?
            </span>
            <button
              type="button"
              className="me-fact__reveal"
              aria-expanded={flipped}
              aria-controls={backId}
              onClick={flip}
              data-cursor="view"
              data-cursor-label={meCopy.personal.revealLabel}
            >
              {meCopy.personal.revealLabel}
            </button>
          </div>
        </div>
        <div
          ref={backRef}
          id={backId}
          tabIndex={-1}
          className="me-flip__face me-flip__face--back"
          inert={!flipped}
          aria-hidden={!flipped}
        >
          <div className="me-fact__card me-fact__card--flip-back">
            <Heading detail={detail} />
            <Answer detail={detail} />
            <FactLink detail={detail} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* game — tilts in depth; a ball rolls down the slope                 */
/* ---------------------------------------------------------------- */

function GameFact({ detail }: { detail: PersonalDetail }) {
  return (
    <Tilt max={7} scale={1.015} glare className="me-fact__card me-fact__card--game">
      <TiltLayer depth={-12} className="me-slope" aria-hidden="true">
        <SlopeArt />
      </TiltLayer>
      <TiltLayer depth={14} className="me-fact__front">
        <Heading detail={detail} />
        <Answer detail={detail} />
        <FactLink detail={detail} />
      </TiltLayer>
    </Tilt>
  );
}

/** A track running into the distance, drawn in perspective, and its ball. */
function SlopeArt() {
  // Near edge (bottom-left, wide) → far edge (top-right, narrow).
  const near = { l: [8, 124], r: [118, 124] };
  const far = { l: [150, 10], r: [170, 10] };
  const lerp = (a: number[], b: number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const rungs = [0.06, 0.16, 0.3, 0.48, 0.72];
  return (
    <svg className="me-slope__svg" viewBox="0 0 200 128" preserveAspectRatio="xMaxYMax meet" focusable="false">
      <path
        className="me-slope__track"
        d={`M${far.l.join(",")} L${far.r.join(",")} L${near.r.join(",")} L${near.l.join(",")} Z`}
      />
      {rungs.map((t) => {
        const a = lerp(far.l, near.l, t);
        const b = lerp(far.r, near.r, t);
        return <line key={t} className="me-slope__rung" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
      })}
      <line className="me-slope__edge" x1={far.l[0]} y1={far.l[1]} x2={near.l[0]} y2={near.l[1]} />
      <line className="me-slope__edge" x1={far.r[0]} y1={far.r[1]} x2={near.r[0]} y2={near.r[1]} />
      <g className="me-slope__ball">
        <circle className="me-slope__shadow" cx="0" cy="3" r="6" />
        <circle className="me-slope__sphere" cx="0" cy="0" r="6" />
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* music — an equaliser plays a few bars                              */
/* ---------------------------------------------------------------- */

function MusicFact({ detail }: { detail: PersonalDetail }) {
  // "Viva La Vida — Coldplay." → song / artist, when written that way.
  const [song, artist] = detail.answer.split(/\s+[—–-]\s+/, 2);
  return (
    <div className="me-fact__card me-fact__card--music">
      <Heading detail={detail} />
      <Answer detail={detail} className="me-song">
        {artist ? (
          <>
            <span className="me-song__title">{song}</span>
            <span className="me-song__artist">{artist}</span>
          </>
        ) : undefined}
      </Answer>
      <span className="me-eq" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span key={bar} className="me-eq__bar" />
        ))}
      </span>
      <FactLink detail={detail} />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* place — a pin sends out a ping                                     */
/* ---------------------------------------------------------------- */

function PlaceFact({ detail }: { detail: PersonalDetail }) {
  return (
    <div className="me-fact__card me-fact__card--place">
      <span className="me-pin" aria-hidden="true">
        <span className="me-pin__ring" />
        <span className="me-pin__ring me-pin__ring--2" />
        <svg className="me-pin__glyph" viewBox="0 0 24 24" focusable="false">
          <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
          <circle cx="12" cy="10" r="2.6" />
        </svg>
      </span>
      <Heading detail={detail} />
      <Answer detail={detail} />
      <FactLink detail={detail} />
    </div>
  );
}
