import { MaskReveal, Parallax, Reveal, Stagger, StaggerItem, TextReveal, Tilt } from "@/animations";
import { ExternalLink, Tag } from "@/components/ui";
import { detailCopy, getProjects, projectCategories, toWorkEntry, workCopy } from "@/lib/content";
import type { Project } from "@/types/content";
import { WORK_UI, pad2 } from "./helpers";
import type { WorkState } from "./lensState";
import { ProjectVisual } from "./ProjectVisual";
import { OpenArrow, RecordLink } from "./shared";

/**
 * BUILT — the most immersive lens. Featured projects are told as large,
 * asymmetrical compositions (a tilting 3D stage of layered planes, a
 * parallax numeral, an animated crop, the story beats beside it),
 * alternating sides; smaller projects sit underneath as compact cards.
 */
export function BuiltLens({ state }: { state: WorkState }) {
  const all = getProjects();
  const visible = state.filter ? all.filter((p) => p.category === state.filter) : all;
  const featured = visible.filter((p) => p.importance === "featured");
  const rest = visible.filter((p) => p.importance !== "featured");

  if (visible.length === 0) return <p className="wk-empty">{workCopy.emptyFilter}</p>;

  return (
    <div className="wk-built">
      {featured.map((project, i) => (
        <FeaturedProject
          key={project.id}
          project={project}
          number={all.indexOf(project) + 1}
          side={i % 2 === 0 ? "start" : "end"}
          from={state}
        />
      ))}
      {rest.length > 0 && (
        <Stagger as="ul" className="wk-built__more" gap={0.12} variant="rise">
          {rest.map((project) => (
            <StaggerItem as="li" key={project.id} className="wk-built__item">
              <ProjectCard project={project} number={all.indexOf(project) + 1} from={state} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

interface ProjectBlockProps {
  project: Project;
  /** Display number in the full Built list ("01"). */
  number: number;
  from: WorkState;
}

function FeaturedProject({ project, number, side, from }: ProjectBlockProps & { side: "start" | "end" }) {
  const entry = toWorkEntry({ kind: "project", item: project });
  const category = projectCategories[project.category];
  const chip = [category.short ?? category.label, entry.statusLabel].filter(Boolean).join(" · ");
  const headingId = `wk-feature-${project.id}`;

  return (
    <article className="wk-feature" data-side={side} aria-labelledby={headingId}>
      <div className="wk-feature__visual">
        <Parallax speed={0.32} className="wk-feature__numeral" aria-hidden="true">
          {pad2(number)}
        </Parallax>
        <Parallax speed={-0.14} className="wk-feature__plane" aria-hidden="true" />
        <Reveal variant="scale" className="wk-feature__frame">
          <Tilt className="wk-feature__tilt" max={6} glare>
            <RecordLink id={project.id} href={entry.href} from={from} duplicate className="wk-feature__stage">
              <span className="wk-feature__cover" data-work-cover={project.id}>
                <MaskReveal as="span" direction="horizontal" className="wk-feature__mask" contentClassName="wk-feature__mask-inner">
                  <Parallax as="span" speed={-0.1} className="wk-feature__crop">
                    <ProjectVisual entry={entry} variant="stage" priority={number === 1} sizes="(min-width: 1024px) 55vw, 100vw" />
                  </Parallax>
                </MaskReveal>
              </span>
              <span className="wk-feature__chip" aria-hidden="true">
                {chip}
              </span>
            </RecordLink>
          </Tilt>
        </Reveal>
      </div>

      <div className="wk-feature__text">
        <Reveal variant="fade" className="wk-feature__meta">
          <span className="wk-feature__index" aria-hidden="true">
            {pad2(number)}
          </span>
          {entry.statusLabel && (
            <Tag tone="accent" dot>
              {entry.statusLabel}
            </Tag>
          )}
          <Tag>{category.label}</Tag>
          <Tag tone="quiet">{project.dateLabel ?? project.year}</Tag>
        </Reveal>

        <h3 id={headingId} className="wk-feature__title">
          <RecordLink
            id={project.id}
            href={entry.href}
            from={from}
            className="wk-feature__title-link"
            aria-label={project.title}
          >
            <TextReveal as="span" text={project.title} delay={0.05} srText={false} />
          </RecordLink>
        </h3>

        <Reveal as="p" delay={0.1} className="wk-feature__summary">
          {project.summary}
        </Reveal>

        {project.concept && (
          <Reveal delay={0.16} className="wk-feature__beat">
            <p className="wk-feature__beat-label">{detailCopy.project.concept}</p>
            <p className="wk-feature__beat-text">{project.concept}</p>
          </Reveal>
        )}

        {project.tools && project.tools.length > 0 && (
          <Reveal delay={0.2} className="wk-feature__tools">
            <p className="wk-feature__beat-label">{detailCopy.project.tools}</p>
            <ul className="wk-feature__tool-list">
              {project.tools.map((tool) => (
                <li key={tool}>
                  <Tag tone="quiet">{tool}</Tag>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <Reveal delay={0.24} className="wk-feature__actions">
          <RecordLink id={project.id} href={entry.href} from={from} className="wk-feature__open">
            <OpenArrow>
              {WORK_UI.open}
              <span className="sr-only"> {project.title}</span>
            </OpenArrow>
          </RecordLink>
          {project.links?.map((link) => (
            <ExternalLink key={link.url} href={link.url} className="wk-feature__ext">
              {link.label}
            </ExternalLink>
          ))}
        </Reveal>
      </div>
    </article>
  );
}

function ProjectCard({ project, number, from }: ProjectBlockProps) {
  const entry = toWorkEntry({ kind: "project", item: project });
  const category = projectCategories[project.category];
  return (
    <Tilt className="wk-pcard" max={4}>
      <RecordLink id={project.id} href={entry.href} from={from} className="wk-pcard__link">
        <span className="wk-pcard__visual" data-work-cover={project.id}>
          <ProjectVisual entry={entry} variant="card" sizes="(min-width: 768px) 40vw, 100vw" />
        </span>
        <span className="wk-pcard__body">
          <span className="wk-pcard__meta">
            <span className="wk-pcard__index" aria-hidden="true">
              {pad2(number)}
            </span>
            <span>{category.short ?? category.label}</span>
            <span>{project.dateLabel ?? project.year}</span>
            {entry.statusLabel && <span className="wk-pcard__status">{entry.statusLabel}</span>}
          </span>
          <h3 className="wk-pcard__title">{project.title}</h3>
          <span className="wk-pcard__summary">{project.summary}</span>
          <OpenArrow className="wk-pcard__open" />
        </span>
      </RecordLink>
    </Tilt>
  );
}
