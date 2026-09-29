import { Fragment, useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useTransform } from "framer-motion";
import { Reveal, Stagger, StaggerItem, TextReveal, useDepthEnabled, useSectionProgress } from "@/animations";
import { ExternalLink, Tag } from "@/components/ui";
import { detailCopy, recognitionCategories } from "@/lib/content";
import { cn } from "@/lib/cn";
import { paths } from "@/routing/paths";
import type { ExternalLink as ExternalLinkRecord, Project, WorkEvent } from "@/types/content";
import {
  distinctRecognition,
  eventSections,
  isShortRole,
  pad2,
  projectSections,
  type ProjectField,
  type ProjectSectionSpec,
  type SectionSpec,
} from "./model";
import { RecognitionMark, RecognitionNote } from "./RecognitionMark";

type ScrollOffsets = Exclude<Parameters<typeof useSectionProgress>[1], string | undefined>;

/** The reading rule fills while the section passes through the middle of the screen. */
const READ_RANGE: ScrollOffsets = ["start 0.75", "end 0.45"];
/** The process line draws as the steps arrive. */
const STEPS_RANGE: ScrollOffsets = ["start 0.9", "center 0.5"];

/* ------------------------------------------------------------------ */
/* Section shells                                                      */
/* ------------------------------------------------------------------ */

interface SectionRowProps {
  spec: SectionSpec;
  /** 0-based position among the record's sections (shown as 01, 02…). */
  index: number;
  /** Styling hook for the body ("lead", "statement", "list", "quote", "text", "outcome"…). */
  variant: string;
  children: ReactNode;
}

/**
 * One numbered section: the label column stays in view (sticky) while its
 * text scrolls past, and a thin rule beside the text fills as it's read —
 * tied to scroll, so it empties again going back up.
 */
function SectionRow({ spec, index, variant, children }: SectionRowProps) {
  const ref = useRef<HTMLElement>(null);
  const depth = useDepthEnabled();
  const progress = useSectionProgress(ref, READ_RANGE);
  const scaleY = useTransform(progress, [0, 1], [0, 1]);
  const titleId = `${spec.id}-title`;
  return (
    <section ref={ref} id={spec.id} className="dt-sec" data-variant={variant} aria-labelledby={titleId}>
      <div className="dt-sec__head">
        <Reveal variant="fade" className="dt-sec__label">
          <span className="dt-sec__num font-display" aria-hidden="true">
            {pad2(index + 1)}
          </span>
          <h2 id={titleId} className="dt-sec__title">
            {spec.label}
          </h2>
        </Reveal>
      </div>
      <div className="dt-sec__rule" aria-hidden="true">
        <motion.span className="dt-sec__rule-fill" style={depth ? { scaleY } : undefined} />
      </div>
      <div className="dt-sec__body">{children}</div>
    </section>
  );
}

interface PairPart {
  spec: SectionSpec;
  index: number;
  node: ReactNode;
}

/** Two short sections side by side (the brief; outcome + impact; tools + links), splitting apart as they arrive. */
function PairRow({ parts, variant }: { parts: PairPart[]; variant: string }) {
  return (
    <div className="dt-pair" data-variant={variant}>
      {parts.map(({ spec, index, node }, i) => (
        <section key={spec.id} id={spec.id} className="dt-pair__item" aria-labelledby={`${spec.id}-title`}>
          <Reveal variant="fade" className="dt-pair__head">
            <span className="dt-sec__num font-display" aria-hidden="true">
              {pad2(index + 1)}
            </span>
            <h2 id={`${spec.id}-title`} className="dt-sec__title">
              {spec.label}
            </h2>
          </Reveal>
          <Reveal variant={i === 0 ? "split-left" : "split-right"} delay={0.06 * i} className="dt-pair__body">
            {node}
          </Reveal>
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Content pieces                                                      */
/* ------------------------------------------------------------------ */

const Lead = ({ children }: { children: ReactNode }) => (
  <Reveal>
    <p className="dt-lead">{children}</p>
  </Reveal>
);

const Text = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Reveal>
    <p className={cn("dt-text", className)}>{children}</p>
  </Reveal>
);

/** Something learned, set large — the part of the page worth slowing down for. */
const Insight = ({ children }: { children: string }) => (
  <Reveal variant="mask" duration={0.9}>
    <p className="dt-insight font-display">
      <span className="dt-insight__mark" aria-hidden="true">
        “
      </span>
      {children}
    </p>
  </Reveal>
);

function Actions({ actions }: { actions: string[] }) {
  return (
    <Stagger as="ol" className="dt-actions" gap={0.07}>
      {actions.map((action, i) => (
        <StaggerItem as="li" key={i} className="dt-actions__item">
          <span className="dt-actions__num font-display" aria-hidden="true">
            {pad2(i + 1)}
          </span>
          <span className="dt-actions__text">{action}</span>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function LinkList({ links }: { links: ExternalLinkRecord[] }) {
  return (
    <Stagger as="ul" className="dt-linklist" gap={0.06}>
      {links.map((link) => (
        <StaggerItem as="li" key={link.url}>
          <ExternalLink href={link.url} className="dt-linklist__link">
            {link.label}
          </ExternalLink>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Numbered steps on one line, joined by a rule that draws itself with scroll (and undraws going back). */
function ProcessSteps({ steps }: { steps: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const depth = useDepthEnabled();
  const progress = useSectionProgress(ref, STEPS_RANGE);
  return (
    <div ref={ref} className="dt-steps" style={{ "--dt-steps": steps.length } as CSSProperties}>
      <span className="dt-steps__line" aria-hidden="true">
        <motion.span className="dt-steps__line-fill" style={depth ? { scaleX: progress } : undefined} />
      </span>
      <Stagger as="ol" className="dt-steps__list" gap={0.1}>
        {steps.map((step, i) => (
          <StaggerItem as="li" key={i} className="dt-steps__item">
            <span className="dt-steps__dot" aria-hidden="true">
              <span className="font-display">{pad2(i + 1)}</span>
            </span>
            <span className="dt-steps__text">{step}</span>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

function Tools({ tools }: { tools: string[] }) {
  return (
    <Stagger as="ul" className="dt-tools" gap={0.05}>
      {tools.map((tool) => (
        <StaggerItem as="li" key={tool}>
          <Tag>{tool}</Tag>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/* ------------------------------------------------------------------ */
/* Event body                                                          */
/* ------------------------------------------------------------------ */

export interface BodyProps {
  /** The media section, placed after the opening section. */
  media?: ReactNode;
}

/**
 * An event, told in order: what it was, my role, what I did, what I
 * learned, why it mattered, the outcome — each only when the record has
 * it. Short roles ("Rider", "Emcee") read as a statement, not a sentence.
 */
export function EventBody({ event, media }: BodyProps & { event: WorkEvent }) {
  const sections = eventSections(event);
  const render = (spec: SectionSpec, index: number): ReactNode => {
    switch (spec.id) {
      case "what-it-was":
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant="lead">
            <Lead>{event.description}</Lead>
          </SectionRow>
        );
      case "role": {
        const role = event.role ?? "";
        const short = isShortRole(role);
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant={short ? "statement" : "text"}>
            {short ? (
              <TextReveal as="p" text={role} className="dt-statement font-display" />
            ) : (
              <Text>{role}</Text>
            )}
          </SectionRow>
        );
      }
      case "what-i-did":
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant="list">
            <Actions actions={event.actions ?? []} />
          </SectionRow>
        );
      case "what-i-learned":
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant="insight">
            <Insight>{event.learning ?? ""}</Insight>
          </SectionRow>
        );
      case "why-it-mattered":
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant="text">
            <Text className="dt-text--large">{event.whyItMattered}</Text>
          </SectionRow>
        );
      case "outcome": {
        const recognition = event.recognition;
        // An award whose result is its own title gets a compact note, not the title again at display size.
        const restated = recognition !== undefined && distinctRecognition(event) === undefined;
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant={restated ? "outcome-note" : "outcome"}>
            <div className="dt-outcome">
              {recognition && restated && (
                <Reveal variant="fade">
                  <RecognitionNote
                    recognition={recognition}
                    label={detailCopy.event.recognition}
                    year={recognition.year ?? event.year}
                    filed={{
                      label: recognitionCategories[recognition.category].label,
                      href: paths.work("recognized", recognition.category),
                    }}
                  />
                </Reveal>
              )}
              {recognition && !restated && (
                <Reveal variant="scale">
                  <RecognitionMark recognition={recognition} variant="display" label={detailCopy.event.recognition} />
                </Reveal>
              )}
              {event.outcome && <Text>{event.outcome}</Text>}
            </div>
          </SectionRow>
        );
      }
      case "links":
        return (
          <SectionRow key={spec.id} spec={spec} index={index} variant="links">
            <LinkList links={event.links ?? []} />
          </SectionRow>
        );
      default:
        return null;
    }
  };

  // Photos/footage follow the opening section ("what it was"), or lead when there isn't one.
  const mediaAfter = sections[0]?.id === "what-it-was" ? 0 : -1;
  return (
    <div className="dt-sections dt-sections--event">
      {mediaAfter < 0 && media}
      {sections.map((spec, i) => (
        <Fragment key={spec.id}>
          {render(spec, i)}
          {i === mediaAfter && media}
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Project body                                                        */
/* ------------------------------------------------------------------ */

/** Fields that sit side by side when both exist. */
const PAIRS: [ProjectField, ProjectField, string][] = [
  ["problem", "motivation", "brief"],
  ["outcome", "impact", "result"],
  ["tools", "links", "kit"],
];

/**
 * A project as a case study: the brief (problem + why I built it), the
 * idea as a statement, my role, the process as numbered steps on a line,
 * what got in the way, what happened + why it matters, the lesson, then
 * tools and links.
 */
export function ProjectBody({ project, media }: BodyProps & { project: Project }) {
  const sections = projectSections(project);
  const indexOf = (field: ProjectField) => sections.findIndex((s) => s.field === field);

  const content = (spec: ProjectSectionSpec): { node: ReactNode; variant: string } => {
    switch (spec.field) {
      case "problem":
        return { node: <p className="dt-lead">{project.problem}</p>, variant: "lead" };
      case "motivation":
        return { node: <p className="dt-text dt-text--large">{project.motivation}</p>, variant: "text" };
      case "concept":
        return {
          node: <TextReveal as="p" text={project.concept ?? ""} className="dt-statement dt-statement--idea font-display" />,
          variant: "statement",
        };
      case "role":
        return { node: <Text>{project.role}</Text>, variant: "text" };
      case "process":
        return { node: <ProcessSteps steps={project.process ?? []} />, variant: "steps" };
      case "challenges":
        return { node: <Text className="dt-text--flag">{project.challenges}</Text>, variant: "flag" };
      case "outcome":
        return { node: <p className="dt-lead">{project.outcome}</p>, variant: "lead" };
      case "impact":
        return { node: <p className="dt-text dt-text--large">{project.impact}</p>, variant: "text" };
      case "lessons":
        return { node: <Insight>{project.lessons ?? ""}</Insight>, variant: "insight" };
      case "tools":
        return { node: <Tools tools={project.tools ?? []} />, variant: "tools" };
      case "links":
        return { node: <LinkList links={project.links ?? []} />, variant: "links" };
    }
  };

  const rows: ReactNode[] = [];
  const consumed = new Set<ProjectField>();
  sections.forEach((spec, index) => {
    if (consumed.has(spec.field)) return;
    const pair = PAIRS.find(([a]) => a === spec.field);
    const partnerIndex = pair ? indexOf(pair[1]) : -1;
    if (pair && partnerIndex >= 0) {
      const partner = sections[partnerIndex];
      consumed.add(partner.field);
      rows.push(
        <PairRow
          key={spec.id}
          variant={pair[2]}
          parts={[
            { spec, index, node: content(spec).node },
            { spec: partner, index: partnerIndex, node: content(partner).node },
          ]}
        />
      );
    } else {
      const { node, variant } = content(spec);
      // Pair halves standing alone are bare paragraphs: give them the standard reveal.
      const wrapped = PAIRS.some(([a, b]) => (a === spec.field || b === spec.field) && a !== "tools") ? (
        <Reveal>{node}</Reveal>
      ) : (
        node
      );
      rows.push(
        <SectionRow key={spec.id} spec={spec} index={index} variant={variant}>
          {wrapped}
        </SectionRow>
      );
    }
    // Media (screenshots) follow the brief.
    if (index === 0 && media) rows.push(<Fragment key="media">{media}</Fragment>);
  });
  if (sections.length === 0 && media) rows.push(<Fragment key="media">{media}</Fragment>);

  return <div className="dt-sections dt-sections--project">{rows}</div>;
}
