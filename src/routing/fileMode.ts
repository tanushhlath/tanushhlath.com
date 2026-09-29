import { useSyncExternalStore } from "react";
import { isFileHref, normalizeHref, splitHref } from "./paths";

/**
 * FILE MODE — a built page opened straight from disk (file://).
 *
 * There is no web server there, so root-relative URLs ("/media/…",
 * "/work/") point at the root of the drive. Every prerendered page sets
 * `window.__ROUTE__` (e.g. "/work/wizmo/") before the app script runs;
 * from it we know how deep the page's index.html sits and can turn site
 * paths into relative ones:
 *
 *   on /work/wizmo/   asset("/media/x.png") → "../../media/x.png"
 *                     fileHref("/me/#skills") → "../../me/index.html#skills"
 *
 * Over http(s) all of these return their input unchanged.
 */

declare global {
  interface Window {
    /** The route this document was prerendered for, e.g. "/work/wizmo/". */
    __ROUTE__?: string;
  }
}

/** True when the page was opened from disk. Browser-only (false during prerender). */
export function isFileMode(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

/**
 * The route this document was prerendered for, normalized ("/work/wizmo/").
 * Falls back to the URL's own path over http, and to "/" on disk.
 */
export function getDocumentRoute(): string {
  if (typeof window === "undefined") return "/";
  const route = window.__ROUTE__;
  if (typeof route === "string" && route.startsWith("/")) return normalizeHref(splitHref(route).pathname);
  return isFileMode() ? "/" : normalizeHref(window.location.pathname);
}

/** "../" once per folder between this document and the site root ("" at the root). */
function rootPrefix(): string {
  const depth = getDocumentRoute().split("/").filter(Boolean).length;
  return "../".repeat(depth);
}

/**
 * The initial location for the in-memory router in file mode: the
 * prerendered route plus whatever query/fragment the file URL carries,
 * so /work/index.html#did opens the Did lens.
 */
export function getInitialRoute(): string {
  if (typeof window === "undefined") return "/";
  return `${getDocumentRoute()}${window.location.search}${window.location.hash}`;
}

/**
 * A real, relative link to another prerendered page for file mode:
 * "/me/#skills" → "../../me/index.html#skills". Over http(s) the
 * canonical href is returned unchanged.
 */
export function fileHref(href: string): string {
  if (!isFileMode() || !href.startsWith("/") || href.startsWith("//")) return href;
  const { pathname, search, hash } = splitHref(normalizeHref(href));
  const file = isFileHref(pathname)
    ? pathname.slice(1)
    : pathname === "/"
      ? "index.html"
      : `${pathname.slice(1)}index.html`;
  return `${rootPrefix()}${file}${search}${hash ? `#${hash}` : ""}`;
}

/**
 * Resolve a root-relative asset path ("/media/events/x/1.png",
 * "/images/…") for the current hosting mode: relative to this page in
 * file mode, unchanged otherwise (and for blob:, data:, absolute URLs).
 * Safe to call during render — the prerendered HTML already carries the
 * relative form, so file-mode hydration matches it.
 */
export function asset(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || !isFileMode()) return path;
  return `${rootPrefix()}${path.slice(1)}`;
}

const subscribeNever = () => () => {};

/**
 * Hook form of `isFileMode()`: false during prerender and hydration, the
 * real value right after — so link hrefs can switch to `fileHref()` form
 * without a hydration mismatch.
 */
export function useFileMode(): boolean {
  return useSyncExternalStore(subscribeNever, isFileMode, () => false);
}
