import { useMemo, useState } from "react";
import { Blocks } from "@/components/blocks/Blocks";
import { Lightbox } from "@/components/media";
import { toWorkEntry, type WorkItem } from "@/lib/content";
import { DetailConnections } from "./DetailConnections";
import { DetailHero } from "./DetailHero";
import { DetailMedia } from "./DetailMedia";
import { DetailPager } from "./DetailPager";
import { EventBody, ProjectBody } from "./DetailSections";
import { detailConnections, mediaPlan, neighborsOf } from "./model";
import { useReturnTrail } from "./returnTrail";

export interface WorkDetailViewProps {
  work: WorkItem;
}

/**
 * One project or event, /work/<id>/:
 *
 *   hero         back control · type / field · title · summary · facts ·
 *                cover (shared element with the Work card) · recognition seal
 *   body         events: what it was → media → role → what I did → learned →
 *                why it mattered → outcome;  projects: brief → media → idea →
 *                role → process → challenges → outcome/impact → lesson → tools/links
 *   blocks       the record's optional `body` blocks
 *   connections  skills, related projects/events (both directions), story moments
 *   pager        previous / next in the same collection + the explicit way back
 *
 * Only sections whose fields exist are rendered; `detailsToAdd` never is.
 */
export function WorkDetailView({ work }: WorkDetailViewProps) {
  const id = work.item.id;
  const entry = toWorkEntry(work);
  const trail = useReturnTrail(work);
  const [viewing, setViewing] = useState<number | null>(null);

  // Deterministic derivations from the content (same on server and client).
  // Pass a stable `work` (the page memoizes it per slug).
  const { plan, connections, neighbors } = useMemo(
    () => ({ plan: mediaPlan(work), connections: detailConnections(work), neighbors: neighborsOf(work) }),
    [work]
  );

  const media = plan.showStage ? <DetailMedia plan={plan} title={work.item.title} /> : undefined;
  const blocks = work.item.body;

  return (
    <article
      className="dt-page"
      data-kind={work.kind}
      data-importance={entry.importance}
      data-media={plan.hasPhotos || plan.hasVideos ? "yes" : "none"}
      aria-labelledby="detail-title"
    >
      <DetailHero
        work={work}
        entry={entry}
        plan={plan}
        trail={trail}
        onOpenCover={() => setViewing(plan.coverIndex >= 0 ? plan.coverIndex : null)}
      />

      <div className="dt-shell dt-body">
        {work.kind === "event" ? (
          <EventBody event={work.item} media={media} />
        ) : (
          <ProjectBody project={work.item} media={media} />
        )}
        {blocks && blocks.length > 0 && (
          <div className="dt-blocks">
            <Blocks blocks={blocks} title={work.item.title} idPrefix={id} />
          </div>
        )}
      </div>

      <DetailConnections connections={connections} linkState={trail.branchState} />
      <DetailPager neighbors={neighbors} trail={trail} />

      {plan.coverIndex >= 0 && (
        <Lightbox
          images={plan.media.images}
          index={viewing}
          onClose={() => setViewing(null)}
          onIndexChange={setViewing}
          title={work.item.title}
        />
      )}
    </article>
  );
}
