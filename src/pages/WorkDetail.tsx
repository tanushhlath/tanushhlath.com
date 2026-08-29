import { useParams } from "react-router-dom";
import { Meta } from "@/lib/Meta";
import { getWorkItemBySlug } from "@/lib/content";
import { ProjectDetail } from "@/components/work/ProjectDetail";
import { ExperienceDetail } from "@/components/do/ExperienceDetail";
import NotFoundPage from "@/pages/NotFound";

export default function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const work = slug ? getWorkItemBySlug(slug) : undefined;

  if (!work) return <NotFoundPage />;

  return (
    <>
      <Meta title={work.item.title} description={work.item.summary} />
      {work.kind === "project" ? (
        <ProjectDetail project={work.item} />
      ) : (
        <ExperienceDetail experience={work.item} />
      )}
    </>
  );
}
