import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { WorkDetailView } from "@/components/detail";
import { getWorkItem, resolveAlias } from "@/lib/content";
import { Meta } from "@/routing/Meta";
import { useAppNavigate } from "@/routing/navigation";
import { paths } from "@/routing/paths";
import NotFoundPage from "@/pages/NotFound";

/**
 * /work/<id>/ — one project or event (src/components/detail/).
 *
 * The slug is the record id. An old slug listed in a record's `aliases`
 * (e.g. /work/equestrian/) shows that record and swaps the address for
 * its canonical one; the static build also writes redirect pages for
 * them. Anything else is the 404 page.
 */
export default function WorkDetailPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const canonicalId = useMemo(() => (getWorkItem(slug) ? slug : resolveAlias(slug)), [slug]);
  const work = useMemo(() => (canonicalId ? getWorkItem(canonicalId) : undefined), [canonicalId]);
  const go = useAppNavigate();
  const isAlias = Boolean(work && canonicalId !== slug);

  useEffect(() => {
    if (isAlias && canonicalId) go(paths.workItem(canonicalId), { replace: true, viewTransition: false });
  }, [isAlias, canonicalId, go]);

  if (!work) return <NotFoundPage />;

  return (
    <>
      <Meta path={paths.workItem(work.item.id)} title={work.item.title} description={work.item.summary} />
      <WorkDetailView key={work.item.id} work={work} />
    </>
  );
}
