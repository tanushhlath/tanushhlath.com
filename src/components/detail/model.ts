import {
  detailCopy,
  getConnections,
  getEvents,
  getProjects,
  getWorkMedia,
  toWorkEntry,
  type WorkEntry,
  type WorkItem,
} from "@/lib/content";
import { paths, type WorkLens } from "@/routing/paths";
import type { Project, ResolvedMedia, Skill, StoryMoment, WorkEvent } from "@/types/content";

/**
 * DETAIL MODEL — pure, deterministic helpers for /work/<id>/ pages
 * (safe during prerender and hydration). Everything the detail page
 * shows is derived here from the content API; the components only lay
 * it out.
 */

/** Small interface words (labels and verbs, not page copy). Section names come from `detailCopy`. */
export const DETAIL_UI = {
  when: "When",
  with: "With",
  status: "Status",
  backTo: "Back to",
  back: "Back",
  previous: "Previous",
  next: "Next",
  expand: "Expand",
  more: "More work",
  viewLarger: "view larger",
} as const;

/** "2023 & 2024", "2025", or undefined for an undated record. */
export function dateOf(record: { dateLabel?: string; year?: number }): string | undefined {
  return record.dateLabel ?? (record.year !== undefined ? String(record.year) : undefined);
}

/** Two-digit index: 3 → "03". */
export const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * Split a result so its leading number can be set apart:
 * "1st Runner-Up" → { num: "1", suffix: "st", rest: "Runner-Up" },
 * "4 Gold Medals" → { num: "4", rest: "Gold Medals" },
 * "Grand National Finale" → { rest: "Grand National Finale" }.
 */
export function splitResult(result: string): { num?: string; suffix?: string; rest: string } {
  const match = /^(\d+)(st|nd|rd|th)?\s+(.+)$/i.exec(result.trim());
  if (!match) return { rest: result.trim() };
  return { num: match[1], suffix: match[2], rest: match[3] };
}

/** A role short enough to read as a statement ("Rider", "Emcee") rather than a paragraph. */
export const isShortRole = (role: string): boolean => role.length <= 60 && !/[.!?]\s/.test(role);

/** The Work lens a record belongs to when there's no history to go back through. */
export function homeLens(work: WorkItem): WorkLens {
  if (work.kind === "project") return "built";
  return work.item.type === "award" ? "recognized" : "did";
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

/** A numbered body section. `id` is the stable anchor (/work/<id>/#<section>). */
export interface SectionSpec {
  id: string;
  label: string;
}

/** The event's sections in reading order, only for fields that exist. */
export function eventSections(event: WorkEvent): SectionSpec[] {
  const copy = detailCopy.event;
  const out: SectionSpec[] = [];
  if (event.description) out.push({ id: "what-it-was", label: copy.description });
  if (event.role) out.push({ id: "role", label: copy.role });
  if (event.actions?.length) out.push({ id: "what-i-did", label: copy.actions });
  if (event.learning) out.push({ id: "what-i-learned", label: copy.learning });
  if (event.whyItMattered) out.push({ id: "why-it-mattered", label: copy.whyItMattered });
  if (event.outcome || event.recognition) out.push({ id: "outcome", label: copy.outcome });
  if (event.links?.length) out.push({ id: "links", label: copy.links });
  return out;
}

export type ProjectField =
  | "problem"
  | "motivation"
  | "concept"
  | "role"
  | "process"
  | "challenges"
  | "outcome"
  | "impact"
  | "lessons"
  | "tools"
  | "links";

export interface ProjectSectionSpec extends SectionSpec {
  field: ProjectField;
}

const PROJECT_ANCHORS: Record<ProjectField, string> = {
  problem: "problem",
  motivation: "why-i-built-it",
  concept: "the-idea",
  role: "role",
  process: "process",
  challenges: "challenges",
  outcome: "what-happened",
  impact: "why-it-matters",
  lessons: "what-i-learned",
  tools: "tools",
  links: "links",
};

/** The project's sections in reading order, only for fields that exist. */
export function projectSections(project: Project): ProjectSectionSpec[] {
  const copy = detailCopy.project;
  const present: Record<ProjectField, boolean> = {
    problem: Boolean(project.problem),
    motivation: Boolean(project.motivation),
    concept: Boolean(project.concept),
    role: Boolean(project.role),
    process: Boolean(project.process?.length),
    challenges: Boolean(project.challenges),
    outcome: Boolean(project.outcome),
    impact: Boolean(project.impact),
    lessons: Boolean(project.lessons),
    tools: Boolean(project.tools?.length),
    links: Boolean(project.links?.length),
  };
  return (Object.keys(PROJECT_ANCHORS) as ProjectField[])
    .filter((field) => present[field])
    .map((field) => ({ field, id: PROJECT_ANCHORS[field], label: copy[field] }));
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export interface DetailMediaPlan {
  /**
   * Everything the record has. `media.images` is the record's one photo
   * sequence: the hero's viewer and the gallery's tiles and viewer all
   * number and page through it ("01 / 03", "02 / 03"…).
   */
  media: ResolvedMedia;
  /**
   * What the gallery below the hero shows: everything except the photo the
   * hero already shows large — with or without footage, so no photo
   * appears twice on the page.
   */
  stage: ResolvedMedia;
  /** Index of the hero cover inside `media.images` (-1 when it isn't one of them). */
  coverIndex: number;
  /** The gallery section below the hero is worth showing (more than the hero already shows). */
  showStage: boolean;
  hasPhotos: boolean;
  hasVideos: boolean;
}

export function mediaPlan(work: WorkItem): DetailMediaPlan {
  const media = getWorkMedia(work);
  const coverIndex = media.cover ? media.images.findIndex((img) => img.src === media.cover?.src) : -1;
  const hasVideos = media.videos.length > 0;
  const hasPhotos = media.images.length > 0;
  const stage = coverIndex < 0 ? media : { ...media, images: media.images.filter((_, i) => i !== coverIndex) };
  // A single photo is already the hero (and opens the viewer from there).
  const showStage = hasVideos || stage.images.length > 0;
  return { media, stage, coverIndex, showStage, hasPhotos, hasVideos };
}

/**
 * The recognition when it adds something the title doesn't already say:
 * "1st Runner-Up" on the BITS bootcamp, yes; "Best Boarder Award" on the
 * Best Boarder Award, no (the hero's seal and the outcome's headline would
 * only repeat the title).
 */
export function distinctRecognition(event: WorkEvent): WorkEvent["recognition"] {
  const recognition = event.recognition;
  if (!recognition) return undefined;
  return event.title.toLowerCase().includes(recognition.result.trim().toLowerCase()) ? undefined : recognition;
}

/* ------------------------------------------------------------------ */
/* Connections                                                         */
/* ------------------------------------------------------------------ */

export interface ConnectionCard {
  key: string;
  href: string;
  title: string;
  meta: string;
  kind: "project" | "event" | "story";
  /** Work records only: the card model (cover, category, recognition…). */
  entry?: WorkEntry;
  /** Story moments only. */
  moment?: StoryMoment;
}

export interface ConnectionGroup {
  id: string;
  /** Lead-in shown above the group ("This grew out of", "Part of the story"…). */
  lead: string;
  cards: ConnectionCard[];
}

export interface DetailConnections {
  skills: Skill[];
  groups: ConnectionGroup[];
  count: number;
}

const workCard = (entry: WorkEntry): ConnectionCard => ({
  key: `${entry.kind}-${entry.id}`,
  href: entry.href,
  title: entry.title,
  meta: [entry.typeLabel, dateOf(entry)].filter(Boolean).join(" · "),
  kind: entry.kind,
  entry,
});

const storyCard = (moment: StoryMoment): ConnectionCard => ({
  key: `story-${moment.id}`,
  href: paths.story(moment.id),
  title: moment.title,
  meta: [moment.era, dateOf(moment)].filter(Boolean).join(" · "),
  kind: "story",
  moment,
});

/**
 * Everything this record connects to, in both directions (getConnections),
 * grouped with the lead-ins from `detailCopy.threads` / `detailCopy.related`:
 *   project → events "This grew out of", story "Part of the story"
 *   event   → projects "It led to", events "Experiences", story "Part of the story"
 */
export function detailConnections(work: WorkItem): DetailConnections {
  const related = getConnections(work);
  const { threads } = detailCopy;
  const groups: ConnectionGroup[] = [];

  const projects = related.projects.map((p: Project) => workCard(toWorkEntry({ kind: "project", item: p })));
  const events = related.events.map((e: WorkEvent) => workCard(toWorkEntry({ kind: "event", item: e })));
  const story = related.story.map(storyCard);

  if (work.kind === "project") {
    if (events.length) groups.push({ id: "grew-out-of", lead: threads.grewOutOf, cards: events });
    if (projects.length) groups.push({ id: "projects", lead: detailCopy.related.projects, cards: projects });
  } else {
    if (projects.length) groups.push({ id: "led-to", lead: threads.ledTo, cards: projects });
    if (events.length) groups.push({ id: "experiences", lead: detailCopy.related.events, cards: events });
  }
  if (story.length) groups.push({ id: "in-the-story", lead: threads.inStory, cards: story });

  const count = related.skills.length + groups.reduce((n, g) => n + g.cards.length, 0);
  return { skills: related.skills, groups, count };
}

/* ------------------------------------------------------------------ */
/* Previous / next                                                     */
/* ------------------------------------------------------------------ */

export interface Neighbors {
  prev?: WorkEntry;
  next?: WorkEntry;
}

/**
 * The records either side of this one in its own collection, in the
 * order the Work lenses show them (projects: Built order; events: newest
 * first). Links are built from the neighbours' ids. Wraps around, so the
 * first and last records still offer a way on.
 */
export function neighborsOf(work: WorkItem): Neighbors {
  const ids =
    work.kind === "project" ? getProjects().map((p) => p.id) : getEvents().map((e) => e.id);
  const index = ids.indexOf(work.item.id);
  if (index < 0 || ids.length < 2) return {};
  const entryAt = (i: number): WorkEntry => {
    const id = ids[(i + ids.length) % ids.length];
    return work.kind === "project"
      ? toWorkEntry({ kind: "project", item: getProjects().find((p) => p.id === id) as Project })
      : toWorkEntry({ kind: "event", item: getEvents().find((e) => e.id === id) as WorkEvent });
  };
  if (ids.length === 2) return { next: entryAt(index + 1) };
  return { prev: entryAt(index - 1), next: entryAt(index + 1) };
}
