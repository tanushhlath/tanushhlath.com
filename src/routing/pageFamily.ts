import { getWorkItem, resolveAlias } from "@/lib/content";
import { pathOf, routeFamily, type RouteFamily } from "./paths";

/**
 * The family of the page that actually renders at `pathname`: like
 * routeFamily(), but a /work/<id>/ URL only counts as a work item when the
 * record exists (or is an old alias that redirects to one) — otherwise the
 * 404 page renders there. Anything whose markup depends on the section
 * (top-bar label, menu, atmosphere) uses this, so the client always agrees
 * with the prerendered 404.html.
 */
export function pageFamily(pathname: string): RouteFamily {
  const family = routeFamily(pathname);
  if (family !== "work-item") return family;
  const id = pathOf(pathname).split("/").filter(Boolean)[1] ?? "";
  return getWorkItem(id) || resolveAlias(id) ? family : "not-found";
}
