import { ExploreView } from "@/components/explore/ExploreView";

/**
 * /explore/ — "A different way in": five lenses (/explore/#built,
 * #grown, #tried, #care, #proud) over the same content, plus "Surprise
 * me". Everything lives in src/components/explore/ (see ExploreView);
 * copy in src/content/pages.ts (`pages.explore`, `exploreLenses`,
 * `exploreCopy`); styles in src/styles/explore.css. <title>/meta come
 * from App's <Meta/>.
 */
export default function ExplorePage() {
  return <ExploreView />;
}
