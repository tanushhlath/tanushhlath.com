import { Fragment, useRef } from "react";
import { motion, useTransform, type MotionStyle } from "framer-motion";
import {
  Reveal,
  TextReveal,
  useCoarsePointer,
  useDepthEnabled,
  useHydrated,
  usePointer,
  useSectionProgress,
} from "@/animations";
import { ProtectedImage } from "@/components/media";
import { ArrowLink, Kicker, Magnetic } from "@/components/ui";
import { cn } from "@/lib/cn";
import { home, navigation, site } from "@/lib/content";
import { paths } from "@/routing/paths";
import type { ResolvedImage } from "@/types/content";
import { splitName, useRange, type ScrollOffsets } from "./homeUtils";

/**
 * HOME HERO — the entrance.
 *
 * Layered, fast entrance (≈1.1 s end to end; the delays below are scaled
 * by 0.6 and capped at 0.6 s because the hero is on screen at mount —
 * motionSettings.initialDelayScale / initialDelayMax):
 *   ambient bloom → kicker (0.03 s) → portrait (0.12 s) → name (0.18 s)
 *   → statement (0.3 s) → top bar (SiteChrome, timed from the kicker's
 *   start; --chrome-enter-delay in chrome.css, which must stay between the
 *   two) → Enter / Explore (0.6 s).
 *
 * Scrolling away, the stage stays pinned for a moment (CSS, home.css) and
 * recedes in depth — the bloom widens and fades slowest, the identity block
 * shrinks back and blurs, the statement lifts away fastest — while the
 * "Who I am" section rises over it. Everything is scroll-linked, so it
 * reverses exactly when scrolling back up. The portrait leans toward the
 * pointer (mouse/trackpad only).
 *
 * Portrait placement is recomposed per breakpoint rather than shrunk:
 * phones/tablets show it beside the kicker; wide screens set it into the
 * first line of the name like a signature.
 */

/** 0 at the top of the page → 1 once the hero wrapper has scrolled out. */
const HERO_RANGE: ScrollOffsets = ["start start", "end start"];

const PORTRAIT: ResolvedImage = {
  src: site.photo.small ?? site.photo.src,
  alt: site.photo.alt,
  // Head-and-shoulders crop out of the landscape headshot.
  focus: "50% 22%",
};

const EXPLORE = navigation.secondary.find((item) => item.href === paths.explore());

export function Hero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useSectionProgress(wrapRef, HERO_RANGE);
  const hydrated = useHydrated();
  const depth = useDepthEnabled();
  const coarse = useCoarsePointer();
  const pointer = usePointer();

  // Fades (any visitor once hydrated — opacity isn't motion).
  const identityOpacity = useRange(progress, [0.05, 0.36], [1, 0]);
  const ledeOpacity = useRange(progress, [0, 0.2], [1, 0]);
  const metaOpacity = useRange(progress, [0, 0.08], [1, 0]);
  const bloomOpacity = useRange(progress, [0, 0.5], [1, 0]);

  // Depth: each layer recedes at its own rate.
  const identityScale = useRange(progress, [0, 0.42], [1, 0.86]);
  const identityY = useRange(progress, [0, 0.42], [0, -64]);
  const identityBlur = useRange(progress, [0.08, 0.36], [0, 6]);
  const identityFilter = useTransform(identityBlur, (v) => `blur(${v.toFixed(2)}px)`);
  const identityX = useTransform(pointer.x, (v) => v * -6);
  const ledeY = useRange(progress, [0, 0.3], [0, -120]);
  const bloomScale = useRange(progress, [0, 0.5], [1, 1.45]);
  const bloomX = useTransform(pointer.x, (v) => v * 40);
  const bloomY = useTransform(pointer.y, (v) => v * 26);

  const identityStyle: MotionStyle | undefined = hydrated
    ? {
        opacity: identityOpacity,
        ...(depth ? { scale: identityScale, y: identityY, x: identityX } : {}),
        ...(depth && !coarse ? { filter: identityFilter } : {}),
      }
    : undefined;
  const ledeStyle: MotionStyle | undefined = hydrated
    ? { opacity: ledeOpacity, ...(depth ? { y: ledeY } : {}) }
    : undefined;
  const bloomStyle: MotionStyle | undefined = hydrated
    ? { opacity: bloomOpacity, ...(depth ? { scale: bloomScale, x: bloomX, y: bloomY } : {}) }
    : undefined;

  const [firstName, lastName] = splitName(site.name);

  return (
    <div ref={wrapRef} className="home-hero" data-home-hero="">
      <section className="home-hero__stage" aria-labelledby="home-hero-name">
        {/* 1 — ambient light local to the hero, on top of the route atmosphere */}
        <motion.div className="home-hero__bloom" style={bloomStyle} aria-hidden="true">
          <Reveal variant="fade" duration={1.1} className="home-hero__bloom-light" />
        </motion.div>

        <div className="home-container home-hero__inner">
          <motion.div className="home-hero__identity" style={identityStyle}>
            <div className="home-hero__kicker-row">
              {/* 3 — portrait (phones/tablets: beside the kicker) */}
              <Portrait className="home-portrait--compact" delay={0.2} />
              <div className="home-hero__kicker-text">
                {/* 2 — context label */}
                {/* data-entrance-lead: the top bar's entrance starts with this one (SiteChrome). */}
                <Reveal variant="rise" distance={14} delay={0.05} data-entrance-lead="">
                  <Kicker className="home-hero__kicker">{site.heroKicker}</Kicker>
                </Reveal>
                <Reveal variant="fade" delay={0.45} className="home-hero__place home-hero__place--compact">
                  <Place />
                </Reveal>
              </div>
            </div>

            {/* 4 — name. One copy of the text: the aria-label names the
                heading, the animated words are its only text (for crawlers,
                reader modes and copy/paste), hidden from assistive tech. */}
            <h1 id="home-hero-name" className="home-hero__name" aria-label={site.name}>
              <span className="home-hero__name-line" aria-hidden="true">
                <TextReveal as="span" text={firstName} delay={0.3} srText={false} className="home-hero__word" />
                {/* 3 — portrait (wide screens: set into the name) */}
                <Portrait className="home-portrait--inline" delay={0.2} />
              </span>
              {lastName && (
                <>
                  {" "}
                  <span className="home-hero__name-line home-hero__name-line--2" aria-hidden="true">
                    <TextReveal as="span" text={lastName} delay={0.4} srText={false} className="home-hero__word" />
                  </span>
                </>
              )}
            </h1>
          </motion.div>

          <motion.div className="home-hero__lede" style={ledeStyle}>
            {/* 5 — statement */}
            <Reveal as="p" variant="blur" delay={0.5} className="home-hero__statement">
              {site.tagline}
            </Reveal>
            {/* 7 — actions (6, the top bar, arrives in between — SiteChrome) */}
            <Reveal variant="rise" distance={18} delay={1} className="home-hero__actions">
              <Magnetic className="inline-block" strength={0.25}>
                <ArrowLink
                  href={home.hero.enter.href}
                  variant="solid"
                  direction="down"
                  cursorLabel={home.hero.enter.label}
                  data-cursor="explore"
                  className="home-hero__enter"
                >
                  {home.hero.enter.label}
                </ArrowLink>
              </Magnetic>
              {EXPLORE && (
                <ArrowLink
                  href={EXPLORE.href}
                  variant="pill"
                  cursorLabel={EXPLORE.label}
                  data-cursor="explore"
                  className="home-hero__explore"
                >
                  {EXPLORE.label}
                  <span className="home-hero__explore-note">{EXPLORE.description}</span>
                </ArrowLink>
              )}
            </Reveal>
          </motion.div>
        </div>

        <motion.div
          className="home-container home-hero__meta"
          style={hydrated ? { opacity: metaOpacity } : undefined}
        >
          {/* amount 0: these sit at the very bottom edge, below the usual reveal line */}
          <Reveal variant="fade" amount={0} delay={1.05} className="home-hero__place home-hero__place--wide">
            <Place />
          </Reveal>
          <Reveal variant="fade" amount={0} delay={1.1} className="home-hero__cue" aria-hidden="true">
            <span>{home.hero.scrollCue}</span>
            <span className="home-hero__cue-line" />
          </Reveal>
        </motion.div>
      </section>
    </div>
  );
}

/** "Born & brought up in Dubai, UAE · Schooling in Jaipur, India" → one line per half. */
const PLACE_PARTS = site.location.short.split(/\s+·\s+/).filter(Boolean);

/**
 * Where I'm from and where I study, set as two lines so the separator can
 * never dangle at a line end (single-line uses elsewhere keep the "·").
 */
function Place() {
  return (
    <p>
      {PLACE_PARTS.map((part, i) => (
        <Fragment key={part}>
          {i > 0 && " "}
          <span className="home-hero__place-part">{part}</span>
        </Fragment>
      ))}
    </p>
  );
}

/**
 * The person behind the site: a 4:5 framed headshot with a soft glow and
 * depth shadow, leaning a few degrees toward the pointer while the photo
 * inside shifts the other way (depth inside the frame). Decorative here —
 * the name sits right beside it — so its alt text is empty.
 */
function Portrait({ className, delay }: { className: string; delay: number }) {
  const pointer = usePointer();
  const rotateY = useTransform(pointer.x, (v) => v * 10);
  const rotateX = useTransform(pointer.y, (v) => v * -8);
  const x = useTransform(pointer.x, (v) => v * 8);
  const y = useTransform(pointer.y, (v) => v * 6);
  const photoX = useTransform(pointer.x, (v) => v * -5);
  const photoY = useTransform(pointer.y, (v) => v * -4);
  const glowX = useTransform(pointer.x, (v) => v * -12);
  const glowY = useTransform(pointer.y, (v) => v * -10);

  return (
    <Reveal as="span" variant="scale" delay={delay} className={cn("home-portrait", className)}>
      <motion.span className="home-portrait__glow" style={{ x: glowX, y: glowY }} aria-hidden="true" />
      <motion.span className="home-portrait__tilt" style={{ rotateX, rotateY, x, y, transformPerspective: 640 }}>
        <span className="home-portrait__frame">
          <motion.span className="home-portrait__photo" style={{ x: photoX, y: photoY }}>
            <ProtectedImage image={PORTRAIT} alt="" fill fit="cover" priority sizes="140px" />
          </motion.span>
          <span className="home-portrait__sheen" aria-hidden="true" />
        </span>
      </motion.span>
    </Reveal>
  );
}
