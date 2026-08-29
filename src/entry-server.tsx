import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { AppRoutes } from "@/routes";

/** Called once per route by scripts/prerender.mjs. */
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}

// Re-exported so the prerender script can pull route data and per-page
// metadata from this one compiled bundle instead of resolving its own
// separate import graph.
export { getAllWorkSlugs, getWorkItemBySlug } from "@/lib/content";
export { pageMeta } from "@/pageMeta";
