import type { CopyLink } from "@/types/content";
import { paths } from "@/routing/paths";

/**
 * HOMEPAGE
 *
 * Every word on the homepage that isn't identity (name, tagline, kicker,
 * bio, location, photo → `site.ts`). Sections appear in this order:
 *
 *   hero → snapshot ("Who I am") → definingThings → current ("Right now")
 *   → featuredWork → personal + care → journey → finale
 *
 * Lists of `ids` choose which records each teaser shows — edit them to
 * change what Home highlights; unknown ids are skipped (and reported by
 * the build's content check).
 */

/** One of the five interactive "I build. / I lead. …" lines. */
export interface DefiningThing {
  text: string;
  /** Where the line goes — always a paths.* route. */
  href: string;
  /** Short line revealed on hover/focus/tap, saying where it leads. */
  hint: string;
}

export interface HomeSectionCopy {
  /** Stable anchor id, e.g. "snapshot" → /#snapshot. */
  id?: string;
  kicker: string;
  heading?: string;
  intro?: string;
  cta?: CopyLink;
}

export interface HomeCopy {
  hero: {
    /** The primary "Enter" action — scrolls to the first section. */
    enter: CopyLink;
    scrollCue: string;
  };
  snapshot: HomeSectionCopy & { id: string };
  definingThings: DefiningThing[];
  /** Accessible name for the defining-things list. */
  definingThingsLabel: string;
  current: HomeSectionCopy & { count: number };
  featuredWork: HomeSectionCopy & { ids: string[] };
  /**
   * Teaser cards: each shows only its question — the answer lives on Me,
   * and the card opens that exact card (/me/#fact-<id>).
   */
  personal: HomeSectionCopy & { ids: string[]; answerLabel: string };
  /** Titles only — the notes live on Me (What I care about). */
  care: HomeSectionCopy & { ids: string[] };
  journey: HomeSectionCopy;
  finale: { heading: string; links: CopyLink[] };
}

const SNAPSHOT_ID = "snapshot";

export const home: HomeCopy = {
  hero: {
    enter: { label: "Enter", href: `#${SNAPSHOT_ID}` },
    scrollCue: "Scroll to explore",
  },

  snapshot: {
    id: SNAPSHOT_ID,
    kicker: "Who I am",
    // The paragraph itself is site.bioShort.
  },

  definingThings: [
    { text: "I build.", href: paths.work("built"), hint: "See what I've built" },
    { text: "I lead.", href: paths.work("did", "leadership"), hint: "Where I've led" },
    { text: "I compete.", href: paths.work("recognized"), hint: "What it's earned" },
    { text: "I make things.", href: paths.work("all"), hint: "Everything I've made and done" },
    { text: "I stay curious.", href: paths.me("care-about"), hint: "What I care about" },
  ],
  definingThingsLabel: "Five things that define me",

  current: {
    kicker: "Right now",
    // Shows the first `count` items from now.ts.
    count: 3,
    cta: { label: "See everything that's alive right now", href: paths.beyond("now") },
  },

  featuredWork: {
    kicker: "Work",
    heading: "A few things worth your time",
    ids: ["wizmo", "digital-opportunity", "innoventure", "bits-pilani-bootcamp"],
    cta: { label: "See all the work", href: paths.work("all") },
  },

  personal: {
    kicker: "Beyond the work",
    heading: "A few quick questions",
    // Questions from personal.ts; each card links to its answer on Me.
    ids: ["favourite-time-pass-game", "mornings-or-late-nights", "song-on-repeat"],
    answerLabel: "See my answer",
    cta: { label: "More about me", href: paths.me("personal-details") },
  },

  care: {
    kicker: "What I care about",
    heading: "Curiosities I keep returning to",
    ids: ["artificial-intelligence", "economics-entrepreneurship", "horse-riding"],
    cta: { label: "Everything I care about", href: paths.me("care-about") },
  },

  journey: {
    kicker: "My story",
    heading: "A short version of a longer story",
    // Shows the Story moments marked isTurningPoint.
    cta: { label: "Read the full story", href: paths.story() },
  },

  finale: {
    heading: "That's the surface. There's a lot more underneath.",
    links: [
      { label: "See the full body of work", href: paths.work() },
      { label: "See what's next", href: paths.beyond("next") },
      { label: "Choose your own lens", href: paths.explore() },
      { label: "Enter the archive", href: paths.archive() },
    ],
  },
};
