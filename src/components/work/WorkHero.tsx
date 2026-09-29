import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Parallax, Reveal, TextReveal, usePointerParallax } from "@/animations";
import { MediaCover } from "@/components/media";
import { Kicker } from "@/components/ui";
import { getEvents, navigation, pages, toWorkEntry, type WorkEntry } from "@/lib/content";
import { pathOf, paths, type WorkLens } from "@/routing/paths";
import { pad2 } from "./helpers";

/**
 * The words of the page heading ("What I build, do, and earn") that light
 * up for each lens — the heading itself answers "which lens am I in?".
 * Matched ignoring case and punctuation; if the heading is reworded and a
 * word no longer appears, nothing is highlighted (no error).
 */
const LENS_WORDS: Record<WorkLens, string[]> = {
  built: ["build"],
  did: ["do"],
  recognized: ["earn"],
  all: ["build", "do", "earn"],
};

/** Photo-like covers (not banners or tall scans) from the featured events: the hero's media fragments. */
function heroFragments(): WorkEntry[] {
  const photoLike = (entry: WorkEntry) => {
    const { width, height } = entry.cover ?? {};
    if (!width || !height) return Boolean(entry.cover);
    const ratio = width / height;
    return ratio >= 1.05 && ratio <= 1.9;
  };
  const events = getEvents();
  const pick = (importance: string) =>
    events
      .filter((e) => e.importance === importance)
      .map((item) => toWorkEntry({ kind: "event", item }))
      .filter(photoLike);
  return [...pick("featured"), ...pick("significant")].slice(0, 4);
}

let fragmentCache: WorkEntry[] | undefined;
const getFragments = () => (fragmentCache ??= heroFragments());

/** Depth per fragment slot: scroll parallax speed, pointer travel (px). */
const SLOTS = [
  { speed: 0.22, pointer: 14 },
  { speed: 0.46, pointer: 26 },
  { speed: 0.12, pointer: 8 },
  { speed: 0.62, pointer: 34 },
];

function HeroFragment({ entry, slot }: { entry: WorkEntry; slot: number }) {
  const depth = SLOTS[slot % SLOTS.length];
  const { x, y } = usePointerParallax(-depth.pointer);
  return (
    <Parallax speed={depth.speed} className="wk-hero__fragment" data-slot={slot}>
      <Reveal variant="scale" delay={0.18 + slot * 0.09} className="wk-hero__fragment-reveal">
        <motion.span className="wk-hero__fragment-inner" style={{ x, y }}>
          <MediaCover image={entry.cover} title={entry.title} aspect="4/3" fit="cover" interactive={false} sizes="260px" />
        </motion.span>
      </Reveal>
    </Parallax>
  );
}

export interface WorkHeroProps {
  lens: WorkLens;
  /** The lens switcher, placed under the intro. */
  lenses: ReactNode;
}

/**
 * The Work opening: kicker, a masked heading whose verb follows the lens,
 * the intro, the lens switcher — with real event photos floating at
 * different depths behind it (scroll + pointer parallax, reversible).
 */
export function WorkHero({ lens, lenses }: WorkHeroProps) {
  const copy = pages.work;
  const position = navigation.primary.findIndex((item) => pathOf(item.href) === paths.work());
  const fragments = getFragments();

  return (
    <header className="wk-hero" id="work-top">
      {fragments.length > 0 && (
        <div className="wk-hero__fragments" aria-hidden="true">
          {fragments.map((entry, slot) => (
            <HeroFragment key={entry.id} entry={entry} slot={slot} />
          ))}
        </div>
      )}
      <div className="wk-shell wk-hero__inner">
        <div className="wk-hero__copy">
          {copy.kicker && (
            <Reveal variant="fade">
              <Kicker index={position >= 0 ? pad2(position + 1) : undefined} className="wk-hero__kicker">
                {copy.kicker}
              </Kicker>
            </Reveal>
          )}
          <TextReveal
            as="h1"
            text={copy.heading ?? copy.title}
            className="wk-hero__title"
            emphasis={LENS_WORDS[lens]}
            emphasisClassName="wk-hero__verb"
            delay={0.06}
          />
          {copy.intro && (
            <Reveal as="p" delay={0.2} className="wk-hero__intro">
              {copy.intro}
            </Reveal>
          )}
        </div>
        <Reveal delay={0.28} className="wk-hero__lenses">
          {lenses}
        </Reveal>
      </div>
    </header>
  );
}
