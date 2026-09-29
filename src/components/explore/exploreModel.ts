import {
  beyondModes,
  exploreCopy,
  exploreLenses,
  getLens,
  getLensKeys,
  getStoryImage,
  getStoryMoment,
  getWorkEntry,
  meCopy,
  navigation,
  pages,
  type ArchiveEntry,
  type ExploreLensKey,
  type WorkEntry,
} from "@/lib/content";
import { BEYOND_MODES, EXPLORE_LENSES, pathOf, paths, splitHref, type BeyondMode } from "@/routing/paths";
import type { Interest, LabIdea, ResolvedImage, StoryMoment } from "@/types/content";

/**
 * EXPLORE MODEL — everything the lenses show comes from getLens() in
 * @/lib/content (derived from the content files); this file only shapes
 * it for the page: counts, cover fans, stable enter directions and the
 * links for interests / lab ideas / story moments.
 */

/** Interface words (verbs and tiny labels) — page copy lives in src/content/pages.ts. */
export const EXPLORE_UI = {
  open: "Open",
  read: "Read",
  close: "Close",
  things: { one: "thing", many: "things" },
  surpriseRegion: "Surprise",
} as const;

export const LENS_KEYS: ExploreLensKey[] = getLensKeys();

export function parseLens(fragment: string): ExploreLensKey | null {
  const value = fragment.trim().toLowerCase();
  return (EXPLORE_LENSES as readonly string[]).includes(value) ? (value as ExploreLensKey) : null;
}

export const serializeLens = (lens: ExploreLensKey | null): string => lens ?? "";

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const thingsLabel = (n: number): string =>
  `${n} ${n === 1 ? EXPLORE_UI.things.one : EXPLORE_UI.things.many}`;

/* ------------------------------------------------------------------ */
/* Lens shaping                                                        */
/* ------------------------------------------------------------------ */

export interface ShapedLens {
  key: ExploreLensKey;
  label: string;
  short: string;
  headline: string;
  description: string;
  /** Cards in the persistent grid. Proud keeps only the work *underneath* the results. */
  entries: WorkEntry[];
  story: (StoryMoment & { href: string; image?: ResolvedImage })[];
  interests: (Interest & { href: string; cta: string })[];
  lab: (LabIdea & { to: string; dest: Destination })[];
  recognitions: NonNullable<ReturnType<typeof getLens>["recognitions"]>;
  /** Everything the lens assembles (for the door's count). */
  total: number;
  /** Up to three covers for the door's fanned stack. */
  fan: { image?: ResolvedImage; title: string }[];
}

const shapedCache = new Map<ExploreLensKey, ShapedLens>();

export function shapeLens(key: ExploreLensKey): ShapedLens {
  const cached = shapedCache.get(key);
  if (cached) return cached;
  const lens = getLens(key);
  const copy = lensCopy(key);
  const recognitions = lens.recognitions ?? [];
  const entries = key === "proud" ? lens.entries.filter((e) => !e.recognition) : lens.entries;
  const story = (lens.story ?? []).map((moment) => ({
    ...moment,
    href: paths.story(moment.id),
    image: getStoryImage(moment),
  }));
  const interests = (lens.interests ?? []).map((interest) => ({
    ...interest,
    href: interest.link?.href ?? paths.me(meCopy.careAbout.id),
    cta: interest.link?.label ?? meCopy.careAbout.kicker,
  }));
  const lab = (lens.lab ?? []).map((idea) => {
    const to = idea.href ?? paths.beyond("lab");
    return { ...idea, to, dest: describeDestination(to, idea.title) };
  });

  const withCovers = [
    ...recognitions.map((r) => ({ image: r.cover, title: r.event.title })),
    ...story.map((m) => ({ image: m.image, title: m.title })),
    ...lens.entries.map((e) => ({ image: e.cover, title: e.title })),
  ].filter((item) => item.image);
  const seen = new Set<string>();
  const fan = withCovers.filter((item) => {
    const src = item.image?.src ?? "";
    if (seen.has(src)) return false;
    seen.add(src);
    return true;
  });

  const shaped: ShapedLens = {
    key,
    ...copy,
    entries,
    story,
    interests,
    lab,
    recognitions,
    total: entries.length + story.length + interests.length + lab.length + recognitions.length,
    fan: fan.slice(0, 3),
  };
  shapedCache.set(key, shaped);
  return shaped;
}

/**
 * Where a link leads, in words — so a card that names one thing never
 * silently opens another. `kind` is the page or record type ("Story",
 * "Project", "Beyond"); `title` names the exact destination ("The First
 * Pitch", "Digital Skills & Opportunity Initiative", "Lab"), or is left
 * out when it would only repeat the card's own title.
 */
export interface Destination {
  kind: string;
  title?: string;
}

const menuItems = [navigation.home, ...navigation.primary, ...navigation.secondary];

function describeDestination(href: string, cardTitle: string): Destination {
  const path = pathOf(href);
  const { hash } = splitHref(href);
  const page = menuItems.find((item) => pathOf(item.href) === path);
  let kind: string = page?.label ?? EXPLORE_UI.open;
  let title: string | undefined;
  const work = /^\/work\/([^/]+)\/$/.exec(path);
  const entry = work ? getWorkEntry(work[1]) : undefined;
  const moment = hash ? getStoryMoment(hash) : undefined;
  if (entry) {
    kind = entry.typeLabel;
    title = entry.title;
  } else if (moment) {
    title = moment.title;
  } else if (hash && path === paths.beyond() && (BEYOND_MODES as readonly string[]).includes(hash)) {
    title = beyondModes[hash as BeyondMode].label;
  }
  return { kind, title: title && !sameName(title, cardTitle) ? title : undefined };
}

/** "Wizmo" and "Wizmo — AI Parent Assistant" name the same thing. */
function sameName(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x === y || x.startsWith(y) || y.startsWith(x);
}

function lensCopy(key: ExploreLensKey) {
  const lens = getLens(key);
  return { label: lens.label, short: exploreLenses[key].short, headline: lens.headline, description: lens.description };
}

/* ------------------------------------------------------------------ */
/* Motion helpers                                                      */
/* ------------------------------------------------------------------ */

function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * A stable direction for an entry to arrive from (same id, same side, on
 * every visit): left, right, below or above, with a slight turn — so a
 * lens assembles from all sides instead of everything rising together.
 */
export function enterFrom(id: string): { x: number; y: number; rotate: number } {
  const h = hash(id);
  const side = h % 4;
  const spread = 36 + (h % 5) * 8;
  const rotate = ((h >>> 3) % 7) - 3;
  switch (side) {
    case 0:
      return { x: -spread * 1.6, y: 10, rotate };
    case 1:
      return { x: spread * 1.6, y: 10, rotate };
    case 2:
      return { x: 0, y: spread * 1.4, rotate };
    default:
      return { x: rotate * 6, y: -spread, rotate };
  }
}

/* ------------------------------------------------------------------ */
/* Surprise                                                            */
/* ------------------------------------------------------------------ */

export const surpriseKey = (entry: ArchiveEntry): string => `${entry.kind}:${entry.id}`;

/** "Competition · Entrepreneurship · 2024" — what it is, where it sits, when. */
export function surpriseContext(entry: ArchiveEntry): string[] {
  const date = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : undefined);
  const where = entry.kind === "story" ? entry.era : entry.categoryLabel;
  return [entry.typeLabel, where, entry.organization, date].filter((part): part is string => Boolean(part));
}

export const surpriseCopy = exploreCopy.surprise;

/** Labels used for the aux sections, in page copy. */
export const sectionLabels = {
  work: exploreCopy.sections.work,
  story: exploreCopy.sections.story,
  interests: exploreCopy.sections.interests,
  lab: exploreCopy.sections.lab,
  recognitions: exploreCopy.sections.recognitions,
  labLink: beyondModes.lab.label,
  storyPage: pages.story.title,
};
