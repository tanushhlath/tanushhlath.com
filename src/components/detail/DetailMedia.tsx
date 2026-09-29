import { MediaStage } from "@/components/media";
import { detailCopy } from "@/lib/content";
import type { DetailMediaPlan } from "./model";

export interface DetailMediaProps {
  plan: DetailMediaPlan;
  title: string;
}

/**
 * The record's photos and footage (anchor #media). MediaStage picks the
 * layout from the data — hero / split / mosaic / filmstrip / stack /
 * stage — labels each group ("Photographs 03", "Footage 03"), keeps
 * videos apart from photos with their captions (e.g. the Inter-House
 * Horse Riding practice-footage note), and opens every photo in the
 * viewer. Its reveals are reversible like the rest of the page.
 */
export function DetailMedia({ plan, title }: DetailMediaProps) {
  const { stage: media, hasVideos } = plan;
  // The hero shows the cover; the gallery shows the rest. Both count
  // against the record's whole photo sequence, so every viewer on the page
  // agrees ("02 / 03" here means the same photo as "02 / 03" in the hero's).
  const hasPhotos = media.images.length > 0;
  const heading = [hasVideos && detailCopy.media.videos, hasPhotos && detailCopy.media.photos]
    .filter(Boolean)
    .join(" · ");
  return (
    <section
      id="media"
      className="dt-media"
      data-layout={media.layout}
      data-videos={hasVideos ? "" : undefined}
      aria-labelledby="media-title"
    >
      <h2 id="media-title" className="sr-only">
        {heading}
      </h2>
      <MediaStage media={media} sequence={plan.media.images} title={title} className="dt-media__stage" />
    </section>
  );
}
