import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllWorkSlugs, getWorkItemBySlug } from "@/lib/content";
import { ProjectDetail } from "@/components/work/ProjectDetail";
import { ExperienceDetail } from "@/components/do/ExperienceDetail";

export function generateStaticParams() {
  return getAllWorkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = getWorkItemBySlug(slug);
  if (!work) return {};
  return { title: work.item.title, description: work.item.summary };
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = getWorkItemBySlug(slug);
  if (!work) notFound();

  if (work.kind === "project") return <ProjectDetail project={work.item} />;
  return <ExperienceDetail experience={work.item} />;
}
