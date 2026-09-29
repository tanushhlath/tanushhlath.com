/**
 * CANONICAL PATHS
 *
 * Every internal link on the site is built from these helpers, so every
 * URL is the one canonical form: origin https://tanushhlath.com, always a
 * trailing slash, UI state (tabs, lenses, filters) in the #fragment —
 * never in ?query strings, which would read as separate documents.
 *
 *   paths.work()                 → /work/
 *   paths.work("did")            → /work/#did
 *   paths.work("did", "sports")  → /work/#did/sports
 *   paths.workItem("wizmo")      → /work/wizmo/
 *   paths.story("taking-the-stage") → /story/#taking-the-stage
 */

import type { ExploreLensKey } from "@/types/content";

export const SITE_URL = "https://tanushhlath.com";

/** Work lenses, in tab order: /work/#<lens> or /work/#<lens>/<filter>. */
export const WORK_LENSES = ["built", "did", "recognized", "all"] as const;
export type WorkLens = (typeof WORK_LENSES)[number];

/** Beyond modes, in tab order: /beyond/#<mode>. */
export const BEYOND_MODES = ["now", "next", "lab"] as const;
export type BeyondMode = (typeof BEYOND_MODES)[number];

/** Explore lenses: /explore/#<lens>. */
export const EXPLORE_LENSES = ["built", "grown", "tried", "care", "proud"] as const satisfies readonly ExploreLensKey[];

const withAnchor = (base: string, anchor?: string) => (anchor ? `${base}#${anchor}` : base);

export const paths = {
  home: (anchor?: string) => withAnchor("/", anchor),
  story: (anchor?: string) => withAnchor("/story/", anchor),
  work: (lens?: WorkLens, filter?: string) =>
    lens ? `/work/#${lens}${filter ? `/${filter}` : ""}` : "/work/",
  workItem: (id: string, anchor?: string) => withAnchor(`/work/${id}/`, anchor),
  me: (anchor?: string) => withAnchor("/me/", anchor),
  beyond: (mode?: BeyondMode) => withAnchor("/beyond/", mode),
  archive: (anchor?: string) => withAnchor("/archive/", anchor),
  explore: (lens?: string) => withAnchor("/explore/", lens),
};

/** True for http(s)://, mailto:, tel: and protocol-relative links. */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);
}

/**
 * Normalize an internal href to canonical form: path gets a trailing
 * slash (unless it points at a file like /sitemap.xml), hash is kept,
 * query strings are kept only if present (they shouldn't be).
 *   "/work"           → "/work/"
 *   "/work#did"       → "/work/#did"
 *   "/work/wizmo"     → "/work/wizmo/"
 *   "#skills"         → "#skills" (same-page anchor, untouched)
 */
export function normalizeHref(href: string): string {
  if (!href || isExternalHref(href) || href.startsWith("#")) return href;
  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const queryIndex = beforeHash.indexOf("?");
  let path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  if (!path) path = "/";
  const lastSegment = path.split("/").pop() ?? "";
  if (!path.endsWith("/") && !lastSegment.includes(".")) path += "/";
  return `${path}${query}${hash}`;
}

/** True when an internal path points at a file ("/sitemap.xml", "/media/x/1.png") rather than a page. */
export function isFileHref(href: string): boolean {
  const lastSegment = splitHref(href).pathname.split("/").pop() ?? "";
  return lastSegment.includes(".");
}

/** Absolute canonical URL for a path (hash and query stripped). */
export function canonicalUrl(path: string): string {
  return `${SITE_URL}${pathOf(path)}`;
}

/**
 * Split an internal href into its parts. `search` keeps its "?", `hash`
 * is the fragment WITHOUT "#" (still URL-encoded).
 *   "/work/?tab=did#x" → { pathname: "/work/", search: "?tab=did", hash: "x" }
 */
export function splitHref(href: string): { pathname: string; search: string; hash: string } {
  const hashIndex = href.indexOf("#");
  const beforeHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const hash = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
  const queryIndex = beforeHash.indexOf("?");
  const pathname = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const search = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  return { pathname, search, hash };
}

/** Canonical pathname only (trailing slash; no query, no hash). "/work#did" → "/work/". */
export function pathOf(href: string): string {
  return normalizeHref(splitHref(href).pathname || "/");
}

/**
 * True when `fragment` on `pathname` is UI state (a Work lens/filter, a
 * Beyond mode, an Explore lens) rather than a section to scroll to. The
 * scroll manager leaves the scroll position alone for these, and the
 * link audit doesn't expect an element with that id.
 *   isStateFragment("/work/", "did/sports") → true
 *   isStateFragment("/me/", "skills")       → false
 */
export function isStateFragment(pathname: string, fragment: string): boolean {
  const value = fragment.replace(/^#/, "");
  if (!value) return false;
  const includes = (list: readonly string[], item: string) => list.includes(item);
  switch (pathOf(pathname)) {
    case "/work/": {
      const [lens, filter, ...rest] = value.split("/");
      return includes(WORK_LENSES, lens) && rest.length === 0 && (filter === undefined || filter.length > 0);
    }
    case "/beyond/":
      return includes(BEYOND_MODES, value);
    case "/explore/":
      return includes(EXPLORE_LENSES, value);
    default:
      return false;
  }
}

/**
 * Route family used for transitions and per-route atmosphere.
 *   "/" → "home", "/work/" → "work", "/work/wizmo/" → "work-item" …
 */
export type RouteFamily =
  | "home"
  | "story"
  | "work"
  | "work-item"
  | "me"
  | "beyond"
  | "archive"
  | "explore"
  | "not-found";

export function routeFamily(pathname: string): RouteFamily {
  const p = pathOf(pathname);
  if (p === "/") return "home";
  const parts = p.split("/").filter(Boolean);
  const [first, second] = parts;
  // Deeper than any real page (/story/x/, /work/a/b/) → the 404 page.
  if (parts.length > (first === "work" ? 2 : 1)) return "not-found";
  switch (first) {
    case "story":
      return "story";
    case "work":
      return second ? "work-item" : "work";
    case "me":
      return "me";
    case "beyond":
      return "beyond";
    case "archive":
      return "archive";
    case "explore":
      return "explore";
    default:
      return "not-found";
  }
}
