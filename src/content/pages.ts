import type { CopyLink, ExploreLensKey, PageCopy, PageKey } from "@/types/content";
import { paths, type BeyondMode, type WorkLens } from "@/routing/paths";

/**
 * PAGE COPY
 *
 * Every page's metadata (<title> + meta description, also baked into the
 * static HTML at build time) and the words at the top of each page:
 * kicker (small label), heading and intro. Below that, per-page copy
 * objects hold section headings, tab/lens names, buttons and empty
 * states, so no page has sentences hard-coded in its components.
 *
 *   title       → short page name; the browser tab shows
 *                 "<title> — Tanushh Lath" (Home shows name — tagline)
 *   description → search/social snippet, keep it under 160 characters
 *
 * Homepage section copy lives in `home.ts`; identity (name, tagline, bio,
 * location, school) lives in `site.ts`.
 */
export const pages: Record<PageKey, PageCopy> = {
  home: {
    title: "Home",
    description:
      "Tanushh Lath — a student from Dubai, schooling in Jaipur, who builds AI and social-impact projects, leads, competes and keeps asking better questions.",
    // The hero's kicker, name and statement come from site.ts.
  },
  story: {
    title: "My Story",
    description:
      "How I got here: from my first pitch deck in 2022 to building with AI and planning a rural digital-skills initiative — the chapters and turning points.",
    kicker: "My story",
    heading: "How I got here",
    intro:
      "Not a résumé timeline — the actual shape of it, including the parts that didn't look like progress at the time. Open any moment for the fuller version.",
  },
  work: {
    title: "Work",
    description:
      "What I've built, done and been recognized for — Wizmo, InnoVenture, BITS Pilani, Master's Union, theatre, equestrian and more, in one place.",
    kicker: "Work",
    heading: "What I build, do, and earn",
    intro: "Three lenses on the same body of work — pick one, or see all of it at once.",
  },
  me: {
    title: "Me",
    description:
      "Who I am beyond the work: born and brought up in Dubai, schooling in Jaipur — my interests, a few personal details, and skills backed by proof.",
    kicker: "Who I am",
    heading: "The person underneath",
  },
  beyond: {
    title: "Beyond",
    description:
      "What I'm working on right now, where I'm headed next, and the half-formed ideas in between — updated as things change, not on a schedule.",
    kicker: "Beyond",
    heading: "What's alive, and what's next",
    intro: "Not a repeat of Work — this is the living, forward-looking side of things.",
  },
  archive: {
    title: "Archive",
    description:
      "Every project, event, recognition and story moment on one searchable list — filter by type, year, category or importance.",
    kicker: "Archive",
    heading: "Everything, organized",
    intro:
      "The featured pages show what matters most. This shows all of it — search, or filter by type, year or category to find something specific.",
  },
  explore: {
    title: "Explore",
    description:
      "A different way in: choose a lens — what I've built, how I've grown, what I've tried, what I care about, what I'm proud of — or be surprised.",
    kicker: "Explore",
    heading: "A different way in",
    intro:
      "Choose how you want to discover me. Pick a lens and the site pulls together whatever's relevant — projects, events, recognitions, story moments and ideas.",
  },
  notFound: {
    title: "Page not found",
    description:
      "This page doesn't exist — but there's plenty everywhere else on Tanushh Lath's site. Head home, or explore a different way in.",
    kicker: "404",
    heading: "This page doesn't exist.",
    intro: "Nothing here — but there's plenty everywhere else. Try exploring instead.",
  },
};

/* ------------------------------------------------------------------ */
/* Per-page copy                                                       */
/* ------------------------------------------------------------------ */

/** Name + short hint for a tab/lens, plus the line shown when it's open. */
export interface LensCopy {
  label: string;
  hint: string;
  heading?: string;
  intro: string;
}

export const storyCopy = {
  chapterNavLabel: "Jump to chapter",
  chapterLabel: "Chapter",
  turningPoint: "Turning point",
  expand: "More",
  collapse: "Less",
  relatedLabel: "Connected to this moment",
  /** Closing hand-off to the project the story leads to. */
  continueLead: "This is where the story led",
  /** Label above the onward links at the end of the page. */
  onward: "Keep going",
};

/** Work lenses, in tab order. Also the /work/#<lens> fragment. */
export const workLenses: Record<WorkLens, LensCopy> = {
  built: {
    label: "Built",
    hint: "things I made",
    intro: "Things I've made — from a shipped AI product to research projects and websites.",
  },
  did: {
    label: "Did",
    hint: "where I showed up",
    intro: "Places I showed up — led, competed, performed, volunteered, contributed.",
  },
  recognized: {
    label: "Recognized",
    hint: "what it earned",
    intro: "Recognition and results — each tied back to the work behind it.",
  },
  all: {
    label: "All",
    hint: "everything at once",
    intro: "The same body of work, unfiltered — every project and event in one view.",
  },
};

export const workCopy = {
  allFilter: "All",
  emptyFilter: "Nothing in this category yet.",
  undatedGroup: "Along the way",
  /** Heading above the compact list of smaller (minor) recognitions. */
  moreRecognition: "More recognition",
  archiveLink: {
    label: "See the complete, unfiltered record in the archive",
    href: paths.archive(),
  } satisfies CopyLink,
};

/** Section labels on /work/<id>/ detail pages. */
export const detailCopy = {
  back: { label: "Back to Work", href: paths.work() } satisfies CopyLink,
  project: {
    problem: "The problem",
    motivation: "Why I built it",
    concept: "The idea",
    role: "My role",
    process: "How I approached it",
    challenges: "What got in the way",
    outcome: "What happened",
    impact: "Why it matters",
    lessons: "What I learned",
    tools: "Tools",
    links: "Links",
  },
  event: {
    description: "What it was",
    role: "My role",
    actions: "What I did",
    learning: "What I learned",
    whyItMattered: "Why it mattered",
    outcome: "Outcome",
    recognition: "Recognition",
    links: "Links",
  },
  media: {
    photos: "Photos",
    videos: "Video",
  },
  related: {
    heading: "Connected",
    skills: "Skills",
    projects: "Projects",
    events: "Experiences",
    story: "In the story",
  },
  /** Lead-ins for the "continue the thread" links at the end of a page. */
  threads: {
    grewOutOf: "This grew out of",
    ledTo: "It led to",
    recognizedWith: "It was recognized with",
    inStory: "Part of the story",
  },
};

/** Me page sections. `id`s are the stable anchors (/me/#<id>). */
export const meCopy = {
  intro: { id: "who-i-am", kicker: "Who I am" },
  schoolLabel: "School",
  locationLabel: "Where I'm from",
  /** Label for the five "I build. / I lead. …" lines (text in home.ts). */
  definingThings: { kicker: "Defining things" },
  careAbout: {
    id: "care-about",
    kicker: "What I care about",
    intro: "Not a generic interests list — open anything below for why it actually holds my attention.",
  },
  personal: {
    id: "personal-details",
    kicker: "A few things about me",
    revealLabel: "Reveal",
  },
  skills: {
    id: "skills",
    kicker: "Skills",
    heading: "Proof, not percentages",
    intro: "Open a skill and see exactly where it came from.",
    /** Button/cursor label for opening a skill's evidence. */
    open: "See proof",
    proofPoint: { one: "proof point", many: "proof points" },
    empty: "No evidence linked yet.",
  },
  closing: {
    heading: "Want the longer version?",
    links: [
      { label: "Read my story", href: paths.story() },
      { label: "See what's happening now", href: paths.beyond("now") },
    ] satisfies CopyLink[],
  },
};

/** Beyond modes, in tab order. Also the /beyond/#<mode> fragment. */
export const beyondModes: Record<BeyondMode, LensCopy> = {
  now: {
    label: "Now",
    hint: "what's happening",
    heading: "Right now, not last year",
    intro: "Live — updated as things change, not on a schedule.",
  },
  next: {
    label: "Next",
    hint: "where I'm headed",
    heading: "Where I'm headed",
    intro: "Grouped by horizon rather than date, since ambitions don't have deadlines the way projects do.",
  },
  lab: {
    label: "Lab",
    hint: "unfinished thinking",
    heading: "Half-formed ideas, on purpose",
    intro: "Unfinished, speculative and deliberately looser than the projects. Not everything here has to ship.",
  },
};

export const beyondCopy = {
  updatedPrefix: "Updated",
  freshest: "Freshest",
  allStatuses: "All",
};

/** Explore lenses, in display order. Also the /explore/#<lens> fragment. */
export interface ExploreLensCopy {
  /** The button text, e.g. "Show me what I've built". */
  label: string;
  /** One-word form for chips and the URL-state indicator. */
  short: string;
  headline: string;
  description: string;
}

export const exploreLenses: Record<ExploreLensKey, ExploreLensCopy> = {
  built: {
    label: "Show me what I've built",
    short: "Built",
    headline: "The things I've made.",
    description: "Projects, plus the competitions and programmes where I built something and put it in front of people.",
  },
  grown: {
    label: "Show me how I've grown",
    short: "Grown",
    headline: "The moments that actually changed direction.",
    description: "The turning points in my story, and the experiences around them.",
  },
  tried: {
    label: "Show me what I've tried",
    short: "Tried",
    headline: "Experiments and half-finished ideas — not everything has to ship.",
    description: "Lab ideas, early experiments and the smaller things I tried along the way.",
  },
  care: {
    label: "Show me what I care about",
    short: "Care",
    headline: "What actually holds my attention.",
    description: "Curiosities, causes, values and hobbies — and the work they've led to.",
  },
  proud: {
    label: "Show me what I'm proud of",
    short: "Proud",
    headline: "Recognition, and the work underneath it.",
    description: "Results and recognition, each tied back to the work behind it.",
  },
};

export const exploreCopy = {
  lensPrompt: "Pick a lens",
  surprise: {
    label: "Surprise me",
    again: "Another surprise",
    lead: "Found in the archive",
    open: "Explore this",
  },
  sections: {
    work: "Work",
    story: "Turning points",
    interests: "What I care about",
    lab: "Lab",
    recognitions: "Recognition",
  },
};

export const archiveCopy = {
  searchLabel: "Search the archive",
  searchPlaceholder: "Search titles and summaries…",
  filters: {
    type: "Type",
    year: "Year",
    category: "Category",
    importance: "Importance",
    sort: "Sort",
  },
  all: "Everything",
  allYears: "All years",
  allCategories: "All categories",
  kindLabels: { project: "Project", event: "Event", story: "Story moment" },
  sortLabels: { newest: "Newest first", oldest: "Oldest first", az: "A → Z" },
  count: { one: "entry", many: "entries" },
  empty: "Nothing matches those filters yet.",
  undated: "Undated",
};

export const notFoundCopy = {
  links: [
    { label: "Go home", href: paths.home() },
    { label: "Explore instead", href: paths.explore() },
  ] satisfies CopyLink[],
};
