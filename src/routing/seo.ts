import {
  formatTitle,
  getAliases,
  getAllWorkIds,
  getPageTitle,
  getWorkItem,
  pages,
  site,
  toWorkEntry,
  type WorkEntry,
  type WorkItem,
} from "@/lib/content";
import type { PageKey, ResolvedImage } from "@/types/content";
import { SITE_URL, canonicalUrl, pathOf, paths } from "./paths";

/**
 * PAGE METADATA — what every page says about itself: <title>, meta
 * description, social card and structured data.
 *
 * One table, two readers:
 * - the build (scripts/prerender.mjs, via entry-server's
 *   getPrerenderRoutes()) bakes it into each page's static HTML;
 * - <Meta> (src/routing/Meta.tsx) applies the same values on client-side
 *   navigation, so the head never disagrees with the prerendered page.
 *
 * The words come from the content: page titles/descriptions from
 * src/content/pages.ts, detail pages from each record's title, summary
 * and cover. Nothing here needs editing to add a page or a record.
 */

export type PageType = "website" | "article" | "profile";
export type JsonLd = Record<string, unknown>;

/** One prerendered page (the shape scripts/prerender.mjs consumes). */
export interface PrerenderRoute {
  /** Canonical path with trailing slash, e.g. "/work/wizmo/". */
  path: string;
  /** Full <title>. */
  title: string;
  /** og:title / twitter:title. */
  ogTitle: string;
  /** Meta description, ≤ 160 characters, never empty. */
  description: string;
  /** Root-relative social image ("/media/events/x/1.png" or the default card). */
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  type: PageType;
  /** Structured data, one <script type="application/ld+json"> per object. */
  jsonLd?: JsonLd[];
  /** Keep out of search results and the sitemap (404 only). */
  noindex?: boolean;
}

/** The site-wide link-preview card (1200×630, scripts/generate-icons.ps1). */
export const DEFAULT_SOCIAL_IMAGE = { src: "/images/branding/og-image.png", width: 1200, height: 630 } as const;

/**
 * A record's cover is used as its link preview only when it is large
 * enough and not an extreme crop; otherwise the default card is used.
 * (scripts/prerender.mjs applies the same rule to the real files.)
 */
const SOCIAL_IMAGE_RULES = { minWidth: 600, minHeight: 315, minRatio: 1, maxRatio: 2.2 } as const;

const DESCRIPTION_MAX = 160;
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

type StaticPageKey = Exclude<PageKey, "notFound">;

/** Every static page, in sitemap order. */
const STATIC_PAGES: Record<StaticPageKey, string> = {
  home: paths.home(),
  story: paths.story(),
  work: paths.work(),
  me: paths.me(),
  beyond: paths.beyond(),
  archive: paths.archive(),
  explore: paths.explore(),
};

const PAGE_TYPES: Partial<Record<StaticPageKey, PageType>> = { me: "profile" };

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Shorten to `max` characters at a word boundary, ending with "…". */
function clamp(text: string, max = DESCRIPTION_MAX): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

const endsSentence = (text: string) => /[.!?…]$/.test(text);

/**
 * A detail page's description: the record's one-line summary, followed
 * by as many known facts (type · organisation · category · date) as fit
 * in 160 characters.
 */
function describeWork(entry: WorkEntry): string {
  const summary = entry.summary.replace(/\s+/g, " ").trim();
  const lead = endsSentence(summary) ? summary : `${summary}.`;
  const when = entry.dateLabel ?? (entry.year ? String(entry.year) : undefined);
  const factSets = [
    [entry.typeLabel, entry.organization, entry.categoryLabel, when],
    [entry.typeLabel, entry.organization, when],
    [entry.typeLabel, when],
  ];
  for (const facts of factSets) {
    const line = facts.filter(Boolean).join(" · ");
    const text = line ? `${lead} ${line}.` : lead;
    if (text.length <= DESCRIPTION_MAX) return text;
  }
  return clamp(summary);
}

/* ------------------------------------------------------------------ */
/* Social image                                                        */
/* ------------------------------------------------------------------ */

function socialImage(cover: ResolvedImage | undefined, alt: string) {
  if (cover?.width && cover.height) {
    const ratio = cover.width / cover.height;
    const { minWidth, minHeight, minRatio, maxRatio } = SOCIAL_IMAGE_RULES;
    if (cover.width >= minWidth && cover.height >= minHeight && ratio >= minRatio && ratio <= maxRatio) {
      return { image: cover.src, imageWidth: cover.width, imageHeight: cover.height, imageAlt: alt };
    }
  }
  return {
    image: DEFAULT_SOCIAL_IMAGE.src,
    imageWidth: DEFAULT_SOCIAL_IMAGE.width,
    imageHeight: DEFAULT_SOCIAL_IMAGE.height,
    imageAlt: `${site.name} — ${site.tagline}`,
  };
}

/* ------------------------------------------------------------------ */
/* Structured data                                                     */
/* ------------------------------------------------------------------ */

const withContext = (data: JsonLd): JsonLd => ({ "@context": "https://schema.org", ...data });

/** Who the site is about — built entirely from src/content/site.ts. */
function person(): JsonLd {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: site.name,
    url: canonicalUrl(paths.home()),
    image: `${SITE_URL}${site.photo.src}`,
    description: site.bioShort,
    email: `mailto:${site.email}`,
    affiliation: { "@type": "EducationalOrganization", name: site.school, location: site.location.school },
    homeLocation: { "@type": "Place", name: site.location.home },
    sameAs: site.social.map((link) => link.url).filter((url) => url.startsWith("https://")),
  };
}

function website(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: canonicalUrl(paths.home()),
    name: site.name,
    description: clamp(pages.home.description),
    inLanguage: "en",
    author: { "@id": PERSON_ID },
  };
}

function breadcrumbs(trail: readonly { name: string; path: string }[]): JsonLd {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  });
}

const HOME_CRUMB = { name: pages.home.title, path: paths.home() };

/* ------------------------------------------------------------------ */
/* Routes                                                              */
/* ------------------------------------------------------------------ */

function pageRoute(key: StaticPageKey): PrerenderRoute {
  const copy = pages[key];
  const path = STATIC_PAGES[key];
  const title = getPageTitle(key);
  const ogTitle =
    key === "home"
      ? title
      : `${copy.heading && copy.heading !== copy.title ? `${copy.title}: ${copy.heading}` : copy.title} — ${site.name}`;

  let jsonLd: JsonLd[];
  if (key === "home") {
    jsonLd = [withContext(person()), withContext(website())];
  } else {
    const trail = breadcrumbs([HOME_CRUMB, { name: copy.title, path }]);
    jsonLd =
      key === "me"
        ? [withContext({ "@type": "ProfilePage", url: canonicalUrl(path), name: title, mainEntity: person() }), trail]
        : [trail];
  }

  return {
    path,
    title,
    ogTitle,
    description: clamp(copy.description || site.bioShort),
    ...socialImage(undefined, ogTitle),
    type: PAGE_TYPES[key] ?? "website",
    jsonLd,
  };
}

function workRoute(work: WorkItem): PrerenderRoute {
  const entry = toWorkEntry(work);
  const path = paths.workItem(entry.id);
  // A long record title can set a shorter `seoTitle` for the tab and search results.
  const name = work.item.seoTitle ?? entry.title;
  const result = entry.recognition?.result;
  const ogTitle =
    result && !name.toLowerCase().includes(result.toLowerCase())
      ? `${name}: ${result} — ${site.name}`
      : formatTitle(name);
  return {
    path,
    title: formatTitle(name),
    ogTitle,
    description: describeWork(entry),
    ...socialImage(entry.cover, ogTitle),
    type: "article",
    jsonLd: [
      breadcrumbs([HOME_CRUMB, { name: pages.work.title, path: paths.work() }, { name: entry.title, path }]),
    ],
  };
}

const PAGE_BY_PATH = new Map<string, StaticPageKey>(
  (Object.keys(STATIC_PAGES) as StaticPageKey[]).map((key) => [STATIC_PAGES[key], key])
);
const WORK_PATH = /^\/work\/([^/]+)\/$/;
const routeCache = new Map<string, PrerenderRoute | null>();

/**
 * Metadata for any path ("/work", "/work/wizmo/#media"…), or undefined
 * when no page lives there (a 404).
 */
export function getRouteMeta(path: string): PrerenderRoute | undefined {
  const canonical = pathOf(path);
  let route = routeCache.get(canonical);
  if (route === undefined) {
    const key = PAGE_BY_PATH.get(canonical);
    const slug = key ? undefined : WORK_PATH.exec(canonical)?.[1];
    const work = slug ? getWorkItem(slug) : undefined;
    route = key ? pageRoute(key) : work ? workRoute(work) : null;
    routeCache.set(canonical, route);
  }
  return route ?? undefined;
}

/** Every page the build writes: the seven static pages, then every project and event. */
export function getPrerenderRoutes(): PrerenderRoute[] {
  const pagePaths = Object.values(STATIC_PAGES);
  const workPaths = getAllWorkIds().map((id) => paths.workItem(id));
  return [...pagePaths, ...workPaths].map((path) => {
    const route = getRouteMeta(path);
    if (!route) throw new Error(`No page metadata for ${path}`);
    return route;
  });
}

/** Metadata for 404.html and any unknown path (noindex, no canonical). */
export function getNotFoundRoute(): PrerenderRoute {
  const copy = pages.notFound;
  const title = formatTitle(copy.title);
  return {
    path: "/404/",
    title,
    ogTitle: title,
    description: clamp(copy.description || site.bioShort),
    ...socialImage(undefined, title),
    type: "website",
    noindex: true,
  };
}

/**
 * Old URLs that now live elsewhere, from the records' `aliases` fields:
 * { from: "/work/equestrian/", to: "/work/inter-school-horse-riding/" }.
 * The build writes a tiny redirect page at each `from`.
 */
export function getRedirects(): { from: string; to: string }[] {
  return getAliases().map(({ from, to }) => ({ from: paths.workItem(from), to: paths.workItem(to) }));
}
