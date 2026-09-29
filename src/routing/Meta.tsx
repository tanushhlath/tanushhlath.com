import { useEffect } from "react";
import { formatTitle } from "@/lib/content";
import { usePathname } from "./navigation";
import { SITE_URL, canonicalUrl, pathOf } from "./paths";
import { getNotFoundRoute, getRouteMeta, type PrerenderRoute } from "./seo";

export interface MetaProps {
  /** Short page title for a page without its own entry in routing/seo.ts (formatted "<title> — Tanushh Lath"). */
  title?: string;
  /** Description for a page without its own entry. */
  description?: string;
  /** The page's path; defaults to the current location. */
  path?: string;
  /** Root-relative social image for a page without its own entry. */
  image?: string;
}

/**
 * Keeps <head> in step with client-side navigation: title, description,
 * canonical, robots, Open Graph and Twitter tags. App mounts one for
 * every route, so pages don't need their own; rendering one in a page is
 * harmless (and `<Meta title description />` from older pages still works).
 *
 * Known routes always use the metadata table in routing/seo.ts — the
 * same values the build baked into the static HTML — so the head can
 * never disagree with the prerendered page. The props only fill in for
 * paths without an entry (the 404 page). Structured data is left as
 * prerendered: crawlers read each page from its own static file.
 */
export function Meta({ title, description, path, image }: MetaProps): null {
  const pathname = usePathname();
  const target = pathOf(path ?? pathname);

  useEffect(() => {
    const known = getRouteMeta(target);
    if (known) {
      applyHeadMeta(known, canonicalUrl(target));
      return;
    }
    const fallback = getNotFoundRoute();
    const pageTitle = title ? formatTitle(title) : fallback.title;
    applyHeadMeta(
      {
        ...fallback,
        title: pageTitle,
        ogTitle: pageTitle,
        description: description || fallback.description,
        ...(image ? { image, imageWidth: 0, imageHeight: 0, imageAlt: pageTitle } : {}),
      },
      null
    );
  }, [target, title, description, image]);

  return null;
}

/* ------------------------------------------------------------------ */
/* <head> writers                                                      */
/* ------------------------------------------------------------------ */

type MetaAttribute = "name" | "property";

/** Set (or with `null`, remove) a <meta name|property="key" content="…">. */
function setMeta(attribute: MetaAttribute, key: string, content: string | null): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (content === null) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  if (tag.content !== content) tag.content = content;
}

function setCanonical(href: string | null): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === null) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

/** Absolute https URL for a root-relative image path. */
const absolute = (src: string) => (/^https?:\/\//i.test(src) ? src : `${SITE_URL}${src}`);

function applyHeadMeta(route: PrerenderRoute, canonical: string | null): void {
  if (document.title !== route.title) document.title = route.title;
  setMeta("name", "description", route.description);
  setCanonical(canonical);
  setMeta("name", "robots", route.noindex ? "noindex,follow" : "index,follow,max-image-preview:large");

  setMeta("property", "og:type", route.type);
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:title", route.ogTitle);
  setMeta("property", "og:description", route.description);
  setMeta("name", "twitter:title", route.ogTitle);
  setMeta("name", "twitter:description", route.description);

  // Touch the image tags only when the image changes, so the dimensions
  // the build measured from the real file stay as they are on first load.
  const imageUrl = absolute(route.image);
  const current = document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  if (current?.content !== imageUrl) {
    const known = route.imageWidth > 0 && route.imageHeight > 0;
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:image:width", known ? String(route.imageWidth) : null);
    setMeta("property", "og:image:height", known ? String(route.imageHeight) : null);
    setMeta("property", "og:image:alt", route.imageAlt);
    setMeta("name", "twitter:image", imageUrl);
    setMeta("name", "twitter:image:alt", route.imageAlt);
  }
}
