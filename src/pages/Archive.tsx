import { ArchiveView } from "@/components/archive/ArchiveView";
import { PageHero } from "@/components/ui";
import { pages } from "@/lib/content";

/**
 * /archive/ — everything, organized: every project, event and story
 * moment on one searchable, filterable list, derived from the content
 * files (see src/components/archive/archiveModel.ts). Copy lives in
 * src/content/pages.ts (`pages.archive`, `archiveCopy`); styles in
 * src/styles/archive.css. <title>/meta come from App's <Meta/>.
 */
export default function ArchivePage() {
  const copy = pages.archive;
  return (
    <div className="archive-page">
      <PageHero
        variant="compact"
        className="ar-hero"
        kicker={copy.kicker}
        kickerTone="quiet"
        title={copy.heading ?? copy.title}
        intro={copy.intro}
        headingId="archive-title"
      />
      <ArchiveView />
    </div>
  );
}
