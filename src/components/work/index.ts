/**
 * WORK INDEX — /work/ (Built / Did / Recognized / All).
 *
 *   <WorkIndex />                         the whole page body (pages/Work.tsx)
 *   <ProjectArt category title variant /> designed artwork for a project without photos
 *                                         (also usable on a detail hero)
 *   readWorkBackState(location.state)     on a detail page: where in Work the visitor came from
 *                                         → { href: "/work/#did/leadership", lensLabel, filterLabel? }
 *   parseWorkState / serializeWorkState   the #lens/filter fragment format
 */
export { WorkIndex } from "./WorkIndex";
export { ProjectArt, type ProjectArtProps } from "./ProjectArt";
export { ProjectVisual, type ProjectVisualProps } from "./ProjectVisual";
export {
  DEFAULT_WORK_STATE,
  getLensFilters,
  parseWorkState,
  readWorkBackState,
  serializeWorkState,
  useWorkState,
  workBackState,
  type WorkBackState,
  type WorkState,
} from "./lensState";
