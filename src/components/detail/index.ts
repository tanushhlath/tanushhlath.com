/**
 * WORK DETAIL — /work/<id>/ for every project and event.
 *
 *   <WorkDetailView work={getWorkItem(id)} />   the whole page body (pages/WorkDetail.tsx)
 *
 * Pieces (all driven by src/lib/content.ts; styles in src/styles/detail.css, prefix `dt-`):
 *   DetailHero         back control, title, facts, cover with depth + shared-element name, recognition seal
 *   EventBody / ProjectBody   numbered sections, only for fields that exist
 *   DetailMedia        MediaStage (photos + footage, layouts from the data)
 *   DetailConnections  skills → /me/#skill-<id>, related records both ways, story moments
 *   DetailPager        previous / next in the same collection + the way back
 *   useReturnTrail     where "Back" goes (history-aware; see returnTrail.ts)
 *
 * Section anchors (stable): events #what-it-was #role #what-i-did #what-i-learned
 * #why-it-mattered #outcome #links; projects #problem #why-i-built-it #the-idea #role
 * #process #challenges #what-happened #why-it-matters #what-i-learned #tools #links;
 * shared #media #connections.
 */
export { WorkDetailView, type WorkDetailViewProps } from "./WorkDetailView";
export { useReturnTrail, readDetailTrail, trailState, type DetailTrail, type ReturnTrail } from "./returnTrail";
