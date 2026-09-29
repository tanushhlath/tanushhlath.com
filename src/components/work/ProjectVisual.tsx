import { MediaCover } from "@/components/media";
import type { WorkEntry } from "@/lib/content";
import { cn } from "@/lib/cn";
import { ProjectArt, type ProjectArtProps } from "./ProjectArt";

export interface ProjectVisualProps {
  entry: WorkEntry;
  variant?: ProjectArtProps["variant"];
  /** Caption chip on the generated art (ignored when there is a photo). */
  label?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * A project's visual: its real cover photo once one exists in
 * public/media/projects/<id>/ (MediaCover — hover zoom, crop drift,
 * protection), otherwise the category artwork. Fills its positioned
 * parent; the parent carries `data-work-cover` for the shared-element
 * hand-off into the detail page.
 */
export function ProjectVisual({ entry, variant = "card", label, priority, sizes, className }: ProjectVisualProps) {
  if (entry.cover) {
    return (
      <MediaCover
        image={entry.cover}
        title={entry.title}
        label={entry.categoryLabel}
        priority={priority}
        sizes={sizes}
        className={cn("wk-visual", className)}
      />
    );
  }
  return <ProjectArt category={entry.category} title={entry.title} label={label} variant={variant} className={className} />;
}
