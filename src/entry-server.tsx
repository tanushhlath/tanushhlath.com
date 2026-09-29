/* eslint-disable react-refresh/only-export-components -- build-time entry, never hot-reloaded */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";

/**
 * Prerender entry — compiled to dist-ssr/entry-server.js and used only by
 * scripts/prerender.mjs at build time (never shipped).
 *
 *   render(url)            the app's HTML for one route
 *   getPrerenderRoutes()   every page to write, with its title, description,
 *                          social image and structured data (routing/seo.ts)
 *   getNotFoundRoute()     metadata for 404.html
 *   getRedirects()         old slugs → current pages ({ from, to } paths)
 *   validateContent()      content problems that must stop the build
 *   site, SITE_URL         identity and canonical origin
 */

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}

export { getNotFoundRoute, getPrerenderRoutes, getRedirects } from "@/routing/seo";
export type { PrerenderRoute } from "@/routing/seo";
export { site, validateContent } from "@/lib/content";
export { SITE_URL } from "@/routing/paths";
