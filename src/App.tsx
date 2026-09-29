import { Fragment, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Atmosphere } from "@/components/atmosphere/Atmosphere";
import { Blocks } from "@/components/blocks/Blocks";
import { Cursor } from "@/components/misc/Cursor";
import { Footer } from "@/components/nav/Footer";
import { SiteChrome } from "@/components/nav/SiteChrome";
import Link from "@/routing/Link";
import { Meta } from "@/routing/Meta";
import { usePathname } from "@/routing/navigation";
import { useResetKey } from "@/routing/routeReset";
import { ScrollManager } from "@/routing/ScrollManager";
import { useLegacyTabRedirect } from "@/routing/useHashState";
import type { RouteFamily } from "@/routing/paths";
import { pageFamily } from "@/routing/pageFamily";
import { pages } from "@/lib/content";
import type { PageKey } from "@/types/content";

/** Route family → the page whose optional `sections` (src/content/pages.ts) render after it. */
const SECTION_PAGES: Partial<Record<RouteFamily, PageKey>> = {
  home: "home",
  story: "story",
  work: "work",
  me: "me",
  beyond: "beyond",
  archive: "archive",
  explore: "explore",
};

/**
 * Extra sections built from content blocks (EDITING_GUIDE.md §13): any
 * `pages.<page>.sections` render at the end of that page, so new sections
 * can be added without touching page components.
 */
function PageSections({ pathname }: { pathname: string }) {
  const key = SECTION_PAGES[pageFamily(pathname)];
  const sections = key ? pages[key].sections : undefined;
  if (!sections?.length) return null;
  return (
    <section className="page-sections" aria-label="More">
      <Blocks blocks={sections} idPrefix={`${key}-section`} className="page-sections__blocks" />
    </section>
  );
}

/**
 * The persistent shell around every route: skip link, route atmosphere
 * (fixed background), top bar + menu, the routed page, footer, cursor,
 * and the invisible managers for scroll position and <head> metadata.
 *
 * The page is keyed by its path and the route-reset counter, so it
 * remounts when it changes — /work/a/ → /work/b/ starts fresh, and a
 * link to the page you're already on re-opens it (entrance replays,
 * tabs and expanded states reset; see routing/routeReset.ts).
 *
 * Old `?tab=` URLs (/work?tab=did, /beyond?tab=lab) are turned into
 * today's fragment state (/work/#did) in place.
 */
export default function App() {
  const pathname = usePathname();
  const resetKey = useResetKey();
  useLegacyTabRedirect();

  // Deep links with UI state: fragment-driven panels ([data-hash-panel])
  // stay hidden while html[data-hash-pending] is set (see dev.html). The
  // pages apply the fragment right after hydration; two frames later the
  // right state is on screen, so reveal them.
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-hash-pending")) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => root.removeAttribute("data-hash-pending"));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  return (
    <>
      <Link
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-azure focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </Link>
      <Atmosphere />
      <SiteChrome />
      <main id="main" className="flex-1">
        <Fragment key={`${pathname}#${resetKey}`}>
          <Outlet />
          <PageSections pathname={pathname} />
        </Fragment>
      </main>
      <Footer />
      <Cursor />
      <ScrollManager />
      <Meta />
    </>
  );
}
