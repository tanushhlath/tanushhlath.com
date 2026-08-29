import { useEffect } from "react";

const SITE_NAME = "Tanushh Lath";

/**
 * Replaces Next's per-page `export const metadata`. Every page renders one
 * of these; it sets the tab title and description tag on mount/update.
 *
 * This only handles the client-side (post-hydration navigation) case —
 * the *initial* HTML for each route already has the correct <title> and
 * <meta description> baked in by scripts/prerender.mjs, which imports the
 * exact same `{ title, description }` pairs from src/pageMeta.ts. One
 * source of truth, read by both the prerender step and this component.
 */
export function Meta({ title, description }: { title: string; description?: string }) {
  useEffect(() => {
    document.title = `${title} — ${SITE_NAME}`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);

  return null;
}
