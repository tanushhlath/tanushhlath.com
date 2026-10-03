import {
  exploreLenses,
  formatMonthYear,
  getArchive,
  getArchiveYears,
  getHomeFeatured,
  getLensKeys,
  getNowItems,
  getStoryImage,
  getStoryMoments,
  getTurningPoints,
  getWorkEntry,
  archiveCopy,
  navigation,
  nowLabels,
  site,
} from "@/lib/content";
import { pathOf, routeFamily } from "@/routing/paths";
import { pageFamily } from "@/routing/pageFamily";
import type { MenuItem, ResolvedImage } from "@/types/content";

/**
 * MENU MODEL — everything the top bar and the menu overlay show, derived
 * from `navigation` / `site` in src/content/site.ts (labels, descriptions,
 * order) and from the content queries (preview images). Nothing here is
 * hand-written copy: rename a menu item or change its description in
 * site.ts and the menu, the section indicator and the previews follow.
 */

/** The seven destinations the menu knows about (their route family). */
export type MenuKey = "home" | "story" | "work" | "me" | "beyond" | "archive" | "explore";

const MENU_KEYS: readonly MenuKey[] = ["home", "story", "work", "me", "beyond", "archive", "explore"];

/**
 * A small visual that appears beside the menu when an item is hovered or
 * focused. Content-driven: a real photo where the route has one, a quiet
 * typographic card where it doesn't.
 */
export type MenuPreview =
  | { kind: "image"; image: ResolvedImage; caption: string; meta?: string }
  | { kind: "identity"; kicker: string; name: string; line: string }
  | { kind: "now"; lead: string; value: string; meta?: string }
  | { kind: "count"; value: string; unit: string; meta?: string }
  | { kind: "lenses"; items: string[] };

export interface MenuEntry {
  key: MenuKey;
  href: string;
  label: string;
  description: string;
  group: "home" | "primary" | "secondary";
  /** "01"…"04" for the numbered primary routes. */
  index?: string;
  preview?: MenuPreview;
}

const pad = (n: number) => String(n).padStart(2, "0");

function keyFor(item: MenuItem): MenuKey | undefined {
  const family = routeFamily(item.href);
  return (MENU_KEYS as readonly string[]).includes(family) ? (family as MenuKey) : undefined;
}

/* ------------------------------------------------------------------ */
/* Previews (built on first use — content is static)                  */
/* ------------------------------------------------------------------ */

function storyPreview(): MenuPreview | undefined {
  // A turning point with a photo first, then any moment with one.
  const candidates = [...getTurningPoints(), ...getStoryMoments()];
  for (const moment of candidates) {
    const image = getStoryImage(moment);
    if (image) return { kind: "image", image, caption: moment.title, meta: String(moment.year) };
  }
  return undefined;
}

function workPreview(): MenuPreview | undefined {
  const entry = getHomeFeatured().find((e) => e.cover);
  if (!entry?.cover) return undefined;
  return {
    kind: "image",
    image: entry.cover,
    caption: entry.title,
    meta: entry.recognition?.result ?? entry.categoryLabel,
  };
}

function mePreview(): MenuPreview {
  return {
    kind: "image",
    image: {
      src: site.photo.small ?? site.photo.src,
      alt: site.photo.alt,
      width: 640,
      height: 479,
      // The face sits a little left of centre, in the upper third.
      focus: "48% 30%",
    },
    caption: site.name,
    meta: site.location.home,
  };
}

function beyondPreview(): MenuPreview | undefined {
  const [item] = getNowItems(1);
  if (!item) return undefined;
  return {
    kind: "now",
    lead: nowLabels[item.label]?.lead ?? nowLabels[item.label]?.label ?? "",
    value: item.value,
    meta: formatMonthYear(item.updatedAt),
  };
}

function archivePreview(): MenuPreview {
  const total = getArchive().length;
  const years = getArchiveYears();
  const span = years.length > 0 ? `${Math.min(...years)} — ${Math.max(...years)}` : undefined;
  return {
    kind: "count",
    value: String(total),
    unit: total === 1 ? archiveCopy.count.one : archiveCopy.count.many,
    meta: span,
  };
}

function explorePreview(): MenuPreview {
  return { kind: "lenses", items: getLensKeys().map((key) => exploreLenses[key].short) };
}

function homePreview(): MenuPreview {
  return { kind: "identity", kicker: site.heroKicker, name: site.name, line: site.tagline };
}

const PREVIEWS: Record<MenuKey, () => MenuPreview | undefined> = {
  home: homePreview,
  story: storyPreview,
  work: workPreview,
  me: mePreview,
  beyond: beyondPreview,
  archive: archivePreview,
  explore: explorePreview,
};

/* ------------------------------------------------------------------ */
/* Entries                                                             */
/* ------------------------------------------------------------------ */

function toEntry(item: MenuItem, group: MenuEntry["group"], index?: string): MenuEntry {
  const key = keyFor(item) ?? "home";
  // Previews are only needed once the menu opens, but the top bar reads the
  // menu on every page's first render — so build each preview on first use
  // (the archive/story previews walk a lot of content).
  let preview: MenuPreview | undefined;
  let built = false;
  return {
    key,
    href: pathOf(item.href),
    label: item.label,
    description: item.description,
    group,
    index,
    get preview() {
      if (!built) {
        preview = PREVIEWS[key]?.();
        built = true;
      }
      return preview;
    },
  };
}

let cache: { home: MenuEntry; primary: MenuEntry[]; secondary: MenuEntry[]; all: MenuEntry[] } | null = null;

/** Menu entries in display order (Home, 01–04, then Archive / Explore). */
export function getMenu() {
  if (!cache) {
    const home = toEntry(navigation.home, "home");
    const primary = navigation.primary.map((item, i) => toEntry(item, "primary", pad(i + 1)));
    const secondary = navigation.secondary.map((item) => toEntry(item, "secondary"));
    cache = { home, primary, secondary, all: [home, ...primary, ...secondary] };
  }
  return cache;
}

/* ------------------------------------------------------------------ */
/* Where am I?                                                         */
/* ------------------------------------------------------------------ */

/** The menu entry a pathname belongs to (detail pages belong to Work); null on the 404. */
export function menuKeyFor(pathname: string): MenuKey | null {
  const family = pageFamily(pathname);
  if (family === "work-item") return "work";
  return (MENU_KEYS as readonly string[]).includes(family) ? (family as MenuKey) : null;
}

export interface SectionLabel {
  key: MenuKey;
  /** "01 / 04" on the numbered routes. */
  count?: string;
  label: string;
  /** Detail pages: the record's type ("Competition", "Project"…). */
  sub?: string;
}

/**
 * The top bar's "where am I" label:
 *   /story/          → 01 / 04 · Story
 *   /work/wizmo/     → 02 · Work · Project
 *   /archive/        → Archive
 *   /                → Home
 * Numbers match the menu's numbering, so the two never disagree.
 */
export function sectionLabelFor(pathname: string): SectionLabel | null {
  const key = menuKeyFor(pathname);
  if (!key) return null;
  const { all, primary } = getMenu();
  const entry = all.find((e) => e.key === key);
  if (!entry) return null;

  if (pageFamily(pathname) === "work-item") {
    return { key, count: entry.index, label: entry.label, sub: workRecordFor(pathname)?.typeLabel };
  }
  return {
    key,
    count: entry.index ? `${entry.index} / ${pad(primary.length)}` : undefined,
    label: entry.label,
  };
}

/**
 * What the menu's "Back to …" control names: the page you're on, since it
 * only closes the menu. A section's label on its own page ("Story"), a
 * Work record's title on its detail page ("Wizmo"); null on the 404.
 */
export function backLabelFor(pathname: string): string | null {
  const key = menuKeyFor(pathname);
  if (!key) return null;
  if (pageFamily(pathname) === "work-item") {
    const title = workRecordFor(pathname)?.title;
    if (title) return title;
  }
  return getMenu().all.find((e) => e.key === key)?.label ?? null;
}

/** The Work record a detail page shows (/work/<id>/). */
function workRecordFor(pathname: string) {
  const id = pathOf(pathname).split("/").filter(Boolean)[1] ?? "";
  return getWorkEntry(id);
}
