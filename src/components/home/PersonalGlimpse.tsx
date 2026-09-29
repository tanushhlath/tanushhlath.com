import { useRef, type CSSProperties } from "react";
import { motion, type MotionStyle } from "framer-motion";
import { useDepthEnabled, useSectionProgress } from "@/animations";
import Link from "@/routing/Link";
import { getHomePersonalDetails, home } from "@/lib/content";
import { paths } from "@/routing/paths";
import type { PersonalDetail } from "@/types/content";
import type { ScrollOffsets } from "./homeUtils";
import { SectionIntro } from "./parts";

/**
 * A FEW QUICK QUESTIONS — a teaser for Me's "A few things about me".
 * Three small cards from personal.ts (chosen in home.ts → personal.ids)
 * show only their question; the answer stays redacted here and each card
 * opens its own card on Me (/me/#fact-<id>), which is where the answers
 * live. So Home hints at the person without repeating the Me page.
 *
 * The cards arrive as one squared-up deck and fan out into place as the
 * section scrolls up (a collage spreading apart); scrolling back gathers
 * them again. The spread is one scroll-linked number (--spread, 0 → 1)
 * on the deck; each card's fold-in offset and rotation live in home.css,
 * so phones fold vertically and wide screens sideways. Hover / focus
 * lifts a card, straightens it and lights up the redacted answer.
 */

/** 0 as the deck's top enters the screen → 1 when its centre is 58% down. */
const SPREAD_RANGE: ScrollOffsets = ["start end", "center 0.58"];

const GLYPHS: Record<NonNullable<PersonalDetail["accent"]>, string> = {
  place: "⌖",
  music: "♪",
  number: "#",
  game: "◆",
  default: "✳",
};

export function PersonalGlimpse() {
  const copy = home.personal;
  const details = getHomePersonalDetails();
  const deckRef = useRef<HTMLUListElement>(null);
  const progress = useSectionProgress(deckRef, SPREAD_RANGE);
  const live = useDepthEnabled();
  if (details.length === 0) return null;

  const deckStyle = (live ? { "--spread": progress } : undefined) as MotionStyle | undefined;

  return (
    <section id={copy.id ?? "about"} className="home-section home-about" aria-labelledby="home-about-title">
      <div className="home-container home-about__grid">
        <SectionIntro
          kicker={copy.kicker}
          heading={copy.heading ?? copy.kicker}
          headingId="home-about-title"
          cta={copy.cta}
          ctaCursor="explore"
          className="home-header--stacked"
        />
        <motion.ul ref={deckRef} className="home-about__deck" style={deckStyle} data-count={details.length}>
          {details.map((detail, i) => (
            <li
              key={detail.id}
              className="home-about__card"
              data-accent={detail.accent ?? "default"}
              style={{ "--i": i, "--n": details.length } as CSSProperties}
            >
              <Link
                href={paths.me(`fact-${detail.id}`)}
                className="home-about__open"
                data-cursor="explore"
                data-cursor-label="Open"
              >
                <span className="home-about__glyph" aria-hidden="true">
                  {GLYPHS[detail.accent ?? "default"]}
                </span>
                <span className="home-about__category">{detail.category}</span>{" "}
                <span className="home-about__prompt">
                  <KeepHyphenated text={detail.prompt} />
                </span>{" "}
                <span className="home-about__redacted" aria-hidden="true" />
                <span className="home-about__cta">
                  {copy.answerLabel}
                  <span className="home-about__arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/** "Favourite time-pass game": a hyphenated word never breaks at its hyphen. */
function KeepHyphenated({ text }: { text: string }) {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="home-about__nowrap">
        {part}
      </span>
    ) : (
      part
    )
  );
}
