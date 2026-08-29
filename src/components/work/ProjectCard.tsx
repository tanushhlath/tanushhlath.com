import Link from "@/lib/Link";
import Image from "@/lib/Image";
import { Project } from "@/types/content";
import { Tag, TierTag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";

export function FeaturedProjectCard({ project }: { project: Project }) {
  const image = project.images?.[0];
  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor="view"
      data-cursor-label="View"
      className="group relative block overflow-hidden rounded-3xl border border-ink-line bg-ink-raised transition-[border-color,box-shadow] duration-300 hover:border-azure-soft/40 hover:shadow-[0_0_60px_-20px_var(--color-azure-dim)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="h-full w-full bg-ink-line" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <TierTag tier={project.tier} />
          <Tag>{project.category}</Tag>
          <Tag>{project.dateLabel ?? project.year}</Tag>
        </div>
        <h3 className="mt-4 font-display text-2xl sm:text-3xl text-paper transition-colors duration-200 group-hover:text-azure-soft">
          {project.title}
        </h3>
        <p className="mt-2 max-w-md text-paper-dim">{project.summary}</p>
        <span className="mt-5 flex items-center gap-2 text-sm text-azure-soft opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          View case study
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
        <span className="mt-3 block h-px w-0 bg-azure-soft transition-[width] duration-300 ease-out group-hover:w-16" />
      </div>
    </Link>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      data-cursor="view"
      data-cursor-label="View"
      className="group flex h-full flex-col justify-between rounded-2xl border border-ink-line p-6 transition-all duration-200 hover:-translate-y-1 hover:border-azure-soft/60 hover:bg-ink-raised/60"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag>{project.category}</Tag>
          <Tag>{project.year}</Tag>
        </div>
        <h3 className="mt-4 font-display text-xl text-paper transition-colors duration-200 group-hover:text-azure-soft">
          {project.title}
        </h3>
        <p className="mt-2 text-sm text-paper-dim">{project.summary}</p>
      </div>
      <div className="mt-6">
        <span className="inline-flex items-center gap-2 text-sm text-paper-faint group-hover:text-azure-soft">
          Explore
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </span>
        <span className="mt-2 block h-px w-6 bg-ink-line-strong transition-all duration-300 group-hover:w-12 group-hover:bg-azure-soft" />
      </div>
    </Link>
  );
}

export function ArchiveRow({
  title,
  meta,
  href,
  className,
}: {
  title: string;
  meta: string;
  href?: string;
  className?: string;
}) {
  const Comp = href ? Link : "div";
  return (
    <Comp
      href={href as string}
      data-cursor={href ? "view" : undefined}
      data-cursor-label="Open"
      className={cn(
        "group flex items-center justify-between gap-4 border-b border-ink-line py-4 text-left",
        href && "hover:bg-ink-raised/40 transition-colors duration-150",
        className
      )}
    >
      <span className="text-paper group-hover:text-azure-soft transition-colors duration-150">
        {title}
      </span>
      <span className="shrink-0 text-xs uppercase tracking-wide text-paper-faint">{meta}</span>
    </Comp>
  );
}
