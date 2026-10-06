import { useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { DUR, EASE, Reveal, TextReveal, useReducedMotionSafe } from "@/animations";
import { useAtmosphere } from "@/components/atmosphere/useAtmosphere";
import { LabView } from "@/components/lab/LabView";
import { Kicker, tabPanelProps } from "@/components/ui";
import Link from "@/routing/Link";
import {
  beyondCopy,
  beyondModes,
  formatMonthYear,
  getLatestNowUpdate,
  navigation,
  pages,
} from "@/lib/content";
import { pathOf, paths, type BeyondMode } from "@/routing/paths";
import { ModeEmblem } from "./glyphs";
import { ModeSwitcher } from "./ModeSwitcher";
import { modeOrder, nextMode, pad2, useBeyondMode, useSwitchReady } from "./modeState";
import { NextPanel } from "./NextPanel";
import { NowPanel } from "./NowPanel";

/** Per-switch context handed to the room variants. */
interface SwitchContext {
  /** +1 when moving right (Now → Next → Lab), −1 when moving back. */
  dir: number;
  /** The fragment arriving after hydration: no animation. */
  instant: boolean;
  reduced: boolean;
}

const cut = { opacity: 0, transition: { duration: 0 } };

/**
 * The new room starts showing while the old one is on its way out (the
 * stage uses AnimatePresence "popLayout": the new room mounts at once and
 * the old one is lifted out of the flow to fade on top of it), so the
 * stage is never empty. Its opacity waits a beat (HANDOFF), until the old
 * room is mostly gone, so the two rooms' text barely overlaps.
 */
const HANDOFF = DUR.micro * 0.6;

/**
 * How a room arrives: its opacity comes in fast (EASE.enter) after the
 * handoff; only the room's own movement takes the longer DUR.slow.
 */
function arrival({ instant, reduced }: SwitchContext) {
  if (instant) return { duration: 0 };
  if (reduced) return { duration: DUR.fast, ease: EASE.enter, delay: HANDOFF };
  return {
    duration: DUR.slow,
    ease: EASE.standard,
    opacity: { duration: DUR.base, ease: EASE.enter, delay: HANDOFF },
  };
}

/** Leaving is quick (DUR.micro): the old room clears the stage for the new one. */
const departure = { duration: DUR.micro, ease: EASE.exit };

/**
 * Each room arrives in its own way:
 *  NOW  — comes into focus in place (clean, alive);
 *  NEXT — travels in from ahead, turning slightly on its vertical axis (forward motion);
 *  LAB  — is laid down like a sheet of paper, unrolling from the top.
 * Exits are short and go against the direction of travel.
 */
const ROOM_VARIANTS: Record<BeyondMode, Variants> = {
  now: {
    enter: ({ instant, reduced }: SwitchContext) =>
      instant ? { opacity: 1 } : { opacity: 0, scale: reduced ? 1 : 0.965, y: reduced ? 0 : 14, filter: reduced ? "none" : "blur(6px)" },
    center: (context: SwitchContext) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      transition: arrival(context),
      transitionEnd: { filter: "none" },
    }),
    exit: ({ instant, reduced }: SwitchContext) =>
      instant ? cut : { opacity: 0, scale: reduced ? 1 : 0.985, transition: departure },
  },
  next: {
    enter: ({ dir, instant, reduced }: SwitchContext) =>
      instant ? { opacity: 1 } : { opacity: 0, x: reduced ? 0 : dir * 96, rotateY: reduced ? 0 : dir * -8, transformPerspective: 1400 },
    center: (context: SwitchContext) => ({
      opacity: 1,
      x: 0,
      rotateY: 0,
      transformPerspective: 1400,
      transition: arrival(context),
    }),
    exit: ({ dir, instant, reduced }: SwitchContext) =>
      instant
        ? cut
        : { opacity: 0, x: reduced ? 0 : dir * -64, rotateY: reduced ? 0 : dir * 6, transformPerspective: 1400, transition: departure },
  },
  lab: {
    enter: ({ instant, reduced }: SwitchContext) =>
      instant || reduced
        ? { opacity: instant ? 1 : 0 }
        : { opacity: 0, y: 18, rotate: -0.6, clipPath: "inset(0% 0% 100% 0% round 28px)" },
    center: (context: SwitchContext) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      clipPath: context.instant || context.reduced ? "none" : "inset(0% 0% 0% 0% round 0px)",
      transition: arrival(context),
      transitionEnd: { clipPath: "none" },
    }),
    exit: ({ instant, reduced }: SwitchContext) =>
      instant ? cut : { opacity: 0, y: reduced ? 0 : 12, rotate: reduced ? 0 : 0.4, transition: departure },
  },
};

/** Words of each room's heading that carry the emphasis (matched ignoring case/punctuation). */
const HEAD_EMPHASIS: Record<BeyondMode, string[]> = {
  now: ["now"],
  next: ["headed"],
  lab: ["on", "purpose"],
};

/** The menu position of Beyond ("04"), so the kicker matches the menu. */
function beyondIndex(): string | undefined {
  const position = navigation.primary.findIndex((item) => pathOf(item.href) === paths.beyond());
  return position >= 0 ? pad2(position + 1) : undefined;
}

/** The heading of each room: its own title, and for Now the live signal. */
function RoomHead({ mode }: { mode: BeyondMode }) {
  const copy = beyondModes[mode];
  return (
    <header className="by-head" data-mode={mode}>
      <Reveal variant="fade" className="by-head__kicker">
        <span className="by-head__index" aria-hidden="true">
          {pad2(modeOrder(mode) + 1)}
        </span>
        <span className="by-head__name">{copy.label}</span>
      </Reveal>
      <TextReveal
        as="h2"
        text={copy.heading ?? copy.label}
        emphasis={HEAD_EMPHASIS[mode]}
        emphasisClassName="by-head__em"
        className="by-head__title font-display"
        delay={0.05}
      />
      {mode === "now" ? (
        <Reveal delay={0.16} className="by-live">
          <span className="by-live__pulse" aria-hidden="true">
            <span className="by-live__ring" />
            <span className="by-live__ring by-live__ring--late" />
            <span className="by-live__dot" />
          </span>
          {/* The "Updated …" stamp is in the hero, a screen above — not repeated here. */}
          <span className="by-live__text">{copy.intro}</span>
        </Reveal>
      ) : (
        <Reveal as="p" delay={0.16} className="by-head__intro">
          {copy.intro}
        </Reveal>
      )}
    </header>
  );
}

/** End of a room: the way into the next one (Lab wraps back to Now). */
function RoomOnward({ mode, onGo }: { mode: BeyondMode; onGo: (event: MouseEvent<HTMLAnchorElement>, to: BeyondMode) => void }) {
  const to = nextMode(mode);
  const copy = beyondModes[to];
  return (
    <Reveal variant="rise" className="by-onward">
      <Link
        href={paths.beyond(to)}
        className="by-onward__link"
        data-room={to}
        data-cursor="view"
        data-cursor-label={copy.label}
        onClick={(event) => onGo(event, to)}
      >
        <span className="by-onward__visual" aria-hidden="true">
          <ModeEmblem mode={to} />
        </span>
        <span className="by-onward__index" aria-hidden="true">
          {pad2(modeOrder(to) + 1)}
        </span>
        <span className="by-onward__label font-display">{copy.label}</span>
        <span className="by-onward__hint">{copy.heading ?? copy.hint}</span>
        <span className="by-onward__arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </Reveal>
  );
}

function RoomBody({ mode }: { mode: BeyondMode }) {
  switch (mode) {
    case "now":
      return <NowPanel />;
    case "next":
      return <NextPanel />;
    case "lab":
      return <LabView />;
  }
}

/**
 * /beyond/ — the living, forward-looking side: NOW (a current-state
 * board), NEXT (a horizon you travel toward) and LAB (a workspace of
 * half-formed ideas). The room lives in the URL fragment (#now, #next,
 * #lab), sets the page atmosphere (beyond-now / -next / -lab), and every
 * switch is a designed transition specific to the room you enter.
 */
export function BeyondView() {
  const [mode, setMode] = useBeyondMode();
  const reduced = useReducedMotionSafe();
  const ready = useSwitchReady();
  useAtmosphere(`beyond-${mode}`);

  // Each switch: its direction of travel, and whether it is the fragment
  // arriving after hydration (instant). Recorded when the room changes
  // (during render) and kept until the next switch, so both rooms of one
  // switch — and any re-render while they animate — agree on it, even once
  // the page has become "ready" in between.
  const [travel, setTravel] = useState({ mode, dir: 1, instant: true });
  if (travel.mode !== mode) {
    setTravel({ mode, dir: modeOrder(mode) >= modeOrder(travel.mode) ? 1 : -1, instant: !ready });
  }
  const context: SwitchContext = { dir: travel.dir, instant: travel.instant, reduced };

  const roomsRef = useRef<HTMLDivElement>(null);
  const copy = pages.beyond;
  const latest = getLatestNowUpdate();
  const index = beyondIndex();

  const selectRoom = (next: BeyondMode) => {
    if (next !== mode) setMode(next);
  };

  // The onward links are real /beyond/#mode links (the Link component turns
  // them into a state change); bring the rooms back into view as they switch.
  const goOnward = (event: MouseEvent<HTMLAnchorElement>, to: BeyondMode) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    roomsRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    if (to === mode) event.preventDefault();
  };

  return (
    <div className="beyond-page" data-mode={mode}>
      <header className="by-hero" id="beyond-top">
        <div className="by-shell">
          <div className="by-hero__top">
            {copy.kicker && (
              <Reveal variant="fade">
                <Kicker index={index}>{copy.kicker}</Kicker>
              </Reveal>
            )}
            {latest && (
              <Reveal variant="fade" delay={0.1} className="by-hero__stamp">
                <span className="by-hero__stamp-dot" aria-hidden="true" />
                {beyondCopy.updatedPrefix} <time dateTime={latest}>{formatMonthYear(latest)}</time>
              </Reveal>
            )}
          </div>
          <TextReveal
            as="h1"
            text={copy.heading ?? copy.title}
            emphasis={["alive", "next"]}
            emphasisClassName="by-hero__em"
            className="by-hero__title font-display"
            delay={0.06}
          />
          {copy.intro && (
            <Reveal as="p" delay={0.2} className="by-hero__intro">
              {copy.intro}
            </Reveal>
          )}
          {/* The switcher and the stage depend on the fragment: on a deep link
              (/beyond/#lab) they stay hidden until it is applied (data-hash-panel). */}
          <div ref={roomsRef} id="beyond-modes" className="by-hero__rooms" data-hash-panel="">
            <Reveal delay={0.28}>
              <ModeSwitcher mode={mode} onChange={selectRoom} />
            </Reveal>
          </div>
        </div>
      </header>

      {/* data-switch="instant": the fragment arrived after hydration; the old
          room is hidden at once instead of waiting a frame for its exit. */}
      <section
        {...tabPanelProps("beyond", mode)}
        className="by-stage"
        data-mode={mode}
        data-switch={travel.instant ? "instant" : undefined}
        data-hash-panel=""
      >
        <AnimatePresence mode="popLayout" initial={false} custom={context}>
          <motion.div
            key={mode}
            className="by-room-body"
            data-mode={mode}
            custom={context}
            variants={ROOM_VARIANTS[mode]}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="by-shell">
              <RoomHead mode={mode} />
            </div>
            <RoomBody mode={mode} />
            <div className="by-shell">
              <RoomOnward mode={mode} onGo={goOnward} />
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
