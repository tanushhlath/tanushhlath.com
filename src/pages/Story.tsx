import { StoryHero } from "@/components/story/StoryHero";
import { StoryOnward } from "@/components/story/StoryOnward";
import { StoryTimeline } from "@/components/story/StoryTimeline";
import { getStoryModel } from "@/components/story/storyModel";

/**
 * STORY — how I got here, as a narrative timeline.
 *
 *   #story-intro     heading + the chapters as a row of date markers
 *   #story-timeline  sticky year marker, a spine that fills with scroll,
 *                    chapters (#chapter-…) opening out of their date
 *                    markers, moments (#<moment-id>) and quote moments
 *   #story-onward    the project it led to, then Work / Me / Beyond
 *
 * Content: src/content/story.ts (moments, chapters = consecutive `era`s)
 * and src/content/pages.ts (`pages.story`, `storyCopy`).
 * Styles: src/styles/story.css. <title>/meta come from App's <Meta/>.
 */
export default function Story() {
  const model = getStoryModel();
  return (
    <div className="story-page">
      <StoryHero chapters={model.chapters} pageIndex={model.pageIndex} />
      <StoryTimeline model={model} />
      <StoryOnward model={model} />
    </div>
  );
}
