import manifestJson from "@/content/generated/media-manifest.json";
import { site, easterEgg, navigation } from "@/content/site";
import {
  pages,
  storyCopy,
  workLenses,
  workCopy,
  detailCopy,
  meCopy,
  beyondModes,
  beyondCopy,
  exploreLenses,
  exploreCopy,
  archiveCopy,
  notFoundCopy,
} from "@/content/pages";
import { home } from "@/content/home";
import { projects } from "@/content/projects";
import { events } from "@/content/events";
import { story } from "@/content/story";
import { skills } from "@/content/skills";
import { interests } from "@/content/interests";
import { personalDetails } from "@/content/personal";
import { now } from "@/content/now";
import { futureGoals } from "@/content/next";
import { labIdeas } from "@/content/lab";
import {
  eventCategories,
  eventTypes,
  horizonLabels,
  importanceLabels,
  labStatusLabels,
  nowLabels,
  projectCategories,
  projectStatusLabels,
  recognitionCategories,
  skillCategories,
  type TaxonomyLabel,
} from "@/content/taxonomy";
import { isExternalHref, normalizeHref, paths } from "@/routing/paths";
import type {
  ExploreLensKey,
  FutureGoal,
  Horizon,
  ImageInfo,
  Importance,
  Interest,
  LabIdea,
  MediaConfig,
  MediaImageOverride,
  MediaLayout,
  MediaManifest,
  MediaManifestFile,
  MediaVideoOverride,
  NowItem,
  PageKey,
  PersonalDetail,
  Project,
  Recognition,
  ResolvedImage,
  ResolvedMedia,
  ResolvedVideo,
  Skill,
  StoryMoment,
  WorkEvent,
} from "@/types/content";

/**
 * CONTENT QUERY API
 *
 * The one place the UI reads content from. Records live in
 * `src/content/`; everything derived from them — sorting, filters,
 * relationships in both directions, resolved media, the archive, Explore
 * lenses — is computed here, so every page shows the same record the
 * same way and a record added/removed in one file shows up (or
 * disappears) everywhere without broken links.
 *
 * Everything is pure and deterministic (safe during prerender and
 * hydration). Derived lists are computed once and memoized; list
 * functions return fresh shallow copies so callers may sort/filter
 * freely. Relationship ids that point at nothing are skipped here and
 * reported by `validateContent()`, which fails the build.
 */

export {
  site,
  easterEgg,
  navigation,
  pages,
  home,
  projects,
  events,
  story,
  skills,
  interests,
  personalDetails,
  now,
  futureGoals,
  labIdeas,
  storyCopy,
  workLenses,
  workCopy,
  detailCopy,
  meCopy,
  beyondModes,
  beyondCopy,
  exploreLenses,
  exploreCopy,
  archiveCopy,
  notFoundCopy,
};
export * from "@/content/taxonomy";
export type { ExploreLensKey, PageKey } from "@/types/content";
export type { LensCopy, ExploreLensCopy } from "@/content/pages";
export type { DefiningThing, HomeCopy, HomeSectionCopy } from "@/content/home";

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export type WorkItem = { kind: "project"; item: Project } | { kind: "event"; item: WorkEvent };

/** Unified card model: All lens, Home previews, Explore, related lists. */
export interface WorkEntry {
  kind: "project" | "event";
  id: string;
  title: string;
  year?: number;
  dateLabel?: string;
  importance: Importance;
  category: string;
  categoryLabel: string;
  /** "Project", or the event type ("Competition", "Workshop"…). */
  typeLabel: string;
  summary: string;
  /** Canonical detail route: paths.workItem(id). */
  href: string;
  cover?: ResolvedImage;
  mediaCount: number;
  recognition?: Recognition;
  organization?: string;
  role?: string;
  /** Projects only, e.g. "Shipped". */
  statusLabel?: string;
}

export interface RecognitionEntry {
  event: WorkEvent;
  recognition: Recognition;
  /** recognition.year, falling back to the event's year. */
  year?: number;
  categoryLabel: string;
  href: string;
  cover?: ResolvedImage;
}

/** Archive rows: every project, event and story moment. */
export interface ArchiveEntry extends Omit<WorkEntry, "kind"> {
  kind: "project" | "event" | "story";
  /** "Project" / "Event" / "Story moment". */
  kindLabel: string;
  /** Story moments only: the chapter name. */
  era?: string;
  /** Lower-cased text for the archive search box. */
  searchText: string;
}

export interface RelatedContent {
  skills: Skill[];
  projects: Project[];
  events: WorkEvent[];
  story: StoryMoment[];
}

export interface SkillEvidence {
  projects: Project[];
  /** Related events WITHOUT a recognition (those are in `recognitions`). */
  events: WorkEvent[];
  story: StoryMoment[];
  /** Related events that carry a recognition. Disjoint from `events`. */
  recognitions: RecognitionEntry[];
  /** projects + events + recognitions — the "proof points" count. */
  proofCount: number;
}

export interface FilterOption {
  id: string;
  label: string;
  short?: string;
  count: number;
}

export interface EventYearGroup {
  /** null = undated. */
  year: number | null;
  /** "2025", or "Along the way" for undated events. */
  label: string;
  events: WorkEvent[];
}

export interface StoryChapter {
  /** Stable anchor, e.g. "chapter-technology-and-ai" (/story/#…). */
  id: string;
  /** 1-based chapter number. */
  number: number;
  era: string;
  /** "2022", or "2025 — 2026" when the chapter spans years. */
  yearLabel: string;
  moments: StoryMoment[];
}

export interface ExploreLensResult {
  key: ExploreLensKey;
  label: string;
  headline: string;
  description: string;
  entries: WorkEntry[];
  story?: StoryMoment[];
  interests?: Interest[];
  lab?: LabIdea[];
  recognitions?: RecognitionEntry[];
}

export interface HorizonGroup {
  horizon: Horizon;
  label: string;
  description?: string;
  goals: FutureGoal[];
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

/** Compute once, on first use. */
function lazy<T>(compute: () => T): () => T {
  let cache: { value: T } | undefined;
  return () => (cache ??= { value: compute() }).value;
}

/** Drop keys whose value is undefined (keeps resolved objects tidy). */
function compact<T extends object>(obj: T): T {
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] === undefined) delete obj[key];
  }
  return obj;
}

function indexById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) if (!map.has(item.id)) map.set(item.id, item);
  return map;
}

/** Resolve ids against an index, skipping unknown ids and duplicates. */
function resolveIds<T extends { id: string }>(
  ids: readonly string[] | undefined,
  index: Map<string, T>,
  exclude?: string
): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of ids ?? []) {
    const item = index.get(id);
    if (!item || id === exclude || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)));
}

const IMPORTANCE_RANK: Record<Importance, number> = { featured: 0, significant: 1, archive: 2 };
const LEVEL_RANK: Record<Recognition["level"], number> = { major: 0, minor: 1 };

/** Newest first; undated last. */
function compareYearDesc(a: number | null | undefined, b: number | null | undefined): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

function labelFor<K extends string>(labels: Record<K, TaxonomyLabel>, id: string): string {
  return (labels as Record<string, TaxonomyLabel | undefined>)[id]?.label ?? id;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const projectIndex = lazy(() => indexById(projects));
const eventIndex = lazy(() => indexById(events));
const storyIndex = lazy(() => indexById(story));
const skillIndex = lazy(() => indexById(skills));

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export const getProject = (id: string): Project | undefined => projectIndex().get(id);
export const getEvent = (id: string): WorkEvent | undefined => eventIndex().get(id);
export const getStoryMoment = (id: string): StoryMoment | undefined => storyIndex().get(id);
export const getSkill = (id: string): Skill | undefined => skillIndex().get(id);

/** A project or event by id (they share the /work/<id>/ namespace). */
export function getWorkItem(id: string): WorkItem | undefined {
  const project = getProject(id);
  if (project) return { kind: "project", item: project };
  const event = getEvent(id);
  if (event) return { kind: "event", item: event };
  return undefined;
}

/** Every /work/<id>/ page: projects then events. */
export function getAllWorkIds(): string[] {
  return [...projectIndex().keys(), ...eventIndex().keys()];
}

/** Old slugs that redirect to a record's page. */
export function getAliases(): { from: string; to: string }[] {
  return [...projects, ...events].flatMap((record) =>
    (record.aliases ?? []).map((alias) => ({ from: alias, to: record.id }))
  );
}

/** The current id for an old slug, if it is one. */
export function resolveAlias(slug: string): string | undefined {
  return getAliases().find((alias) => alias.from === slug)?.to;
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

const manifest = manifestJson as unknown as MediaManifest;
type MediaOwner = "project" | "event";
const COLLECTION: Record<MediaOwner, keyof MediaManifest> = {
  project: "projects",
  event: "events",
};

const mediaPath = (collection: keyof MediaManifest, id: string, file: string) =>
  `/media/${collection}/${id}/${file}`;

function autoLayout(imageCount: number, videoCount: number): Exclude<MediaLayout, "auto"> {
  if (videoCount > 0) return "stage";
  if (imageCount <= 1) return "hero";
  if (imageCount <= 3) return "split";
  if (imageCount <= 5) return "mosaic";
  return "filmstrip";
}

/**
 * Put a record's media in display order: files listed in the config
 * first (in that order), then the rest of the folder in folder order;
 * hidden files dropped. When the manifest has an entry for the record,
 * listed files that aren't in the folder are skipped (validateContent
 * reports them); without an entry the config is trusted as-is.
 */
function orderMedia<O extends { file: string }>(
  kind: MediaManifestFile["kind"],
  folder: MediaManifestFile[] | undefined,
  overrides: readonly O[] | undefined,
  hidden: ReadonlySet<string>
): { file: string; meta?: MediaManifestFile; override?: O }[] {
  const byFile = new Map((folder ?? []).map((f) => [f.file, f]));
  const out: { file: string; meta?: MediaManifestFile; override?: O }[] = [];
  const seen = new Set<string>();
  for (const override of overrides ?? []) {
    if (seen.has(override.file) || hidden.has(override.file)) continue;
    const meta = byFile.get(override.file);
    if (folder && meta?.kind !== kind) continue;
    seen.add(override.file);
    out.push({ file: override.file, meta, override });
  }
  for (const meta of folder ?? []) {
    if (meta.kind !== kind || seen.has(meta.file) || hidden.has(meta.file)) continue;
    seen.add(meta.file);
    out.push({ file: meta.file, meta });
  }
  return out;
}

/**
 * Merge the auto-discovered media folder of a record with its `media`
 * overrides. Web paths are root-relative ("/media/events/<id>/1.png");
 * media components pass them through `asset()` for file mode.
 */
export function resolveMedia(
  kind: MediaOwner,
  id: string,
  config?: MediaConfig,
  title?: string
): ResolvedMedia {
  const collection = COLLECTION[kind];
  const folder = manifest[collection]?.[id];
  const hidden = new Set(config?.hide ?? []);
  const name = title ?? id;

  const orderedImages = orderMedia<MediaImageOverride>("image", folder, config?.images, hidden);
  const images: ResolvedImage[] = orderedImages.map(({ file, meta, override }, i) =>
    compact({
      src: mediaPath(collection, id, file),
      alt: override?.alt ?? `${name} — photo ${i + 1} of ${orderedImages.length}`,
      caption: override?.caption,
      width: meta?.width,
      height: meta?.height,
      focus: override?.focus,
    })
  );

  const orderedVideos = orderMedia<MediaVideoOverride>("video", folder, config?.videos, hidden);
  const videos: ResolvedVideo[] = orderedVideos.map(({ file, meta, override }) =>
    compact({
      src: mediaPath(collection, id, file),
      caption: override?.caption ?? config?.videoCaption,
      poster: override?.poster ? mediaPath(collection, id, override.poster) : undefined,
      width: meta?.width,
      height: meta?.height,
    })
  );

  let cover: ResolvedImage | undefined;
  if (config?.cover) {
    const src = mediaPath(collection, id, config.cover);
    cover = images.find((image) => image.src === src);
    if (!cover) {
      // The cover may be hidden from the gallery but still used on cards.
      const meta = folder?.find((f) => f.file === config.cover);
      if (!folder || meta?.kind === "image") {
        cover = compact({ src, alt: name, width: meta?.width, height: meta?.height });
      }
    }
  }
  cover ??= images[0];

  const layout =
    config?.layout && config.layout !== "auto"
      ? config.layout
      : autoLayout(images.length, videos.length);

  return compact({ images, videos, cover, layout });
}

/* Responsive copies ----------------------------------------------- */

let imageIndex: Map<string, ImageInfo> | undefined;

/** Every image the manifest knows, by web path ("/media/events/x/1.png", "/images/profile/headshot.png"). */
function imageIndexOf(): Map<string, ImageInfo> {
  if (imageIndex) return imageIndex;
  const index = new Map<string, ImageInfo>();
  const add = (dir: string, files: readonly MediaManifestFile[]) => {
    for (const f of files) {
      if (f.kind !== "image") continue;
      index.set(`${dir}/${f.file}`, {
        width: f.width,
        height: f.height,
        variants: (f.variants ?? []).map((v) => ({ src: `${dir}/${v.file}`, width: v.width })),
      });
    }
  };
  for (const collection of Object.values(COLLECTION)) {
    for (const [id, files] of Object.entries(manifest[collection] ?? {})) add(`/media/${collection}/${id}`, files);
  }
  for (const [folder, files] of Object.entries(manifest.site ?? {})) add(`/${folder}`, files);
  imageIndex = index;
  return index;
}

/**
 * Intrinsic size and responsive copies of an image, by its web path
 * (as in ResolvedImage.src). Undefined for images the build doesn't know
 * (external URLs, blob: previews) — those render as they are.
 */
export function getImageInfo(src: string): ImageInfo | undefined {
  const index = imageIndexOf();
  const found = index.get(src);
  if (found || !src.includes("%")) return found;
  try {
    return index.get(decodeURI(src));
  } catch {
    return undefined;
  }
}

/**
 * Web path of a small responsive copy of an image — the smallest copy at
 * least `minWidth` px wide (else the largest copy), or `src` itself when
 * the build made none. For blurred, decorative duplicates of a photo
 * (ambient glows), which never need the full file:
 *   <img src={mediaUrl(getImageCopy(image.src, 320))} alt="" aria-hidden … />
 */
export function getImageCopy(src: string, minWidth: number): string {
  const copies = getImageInfo(src)?.variants;
  if (!copies?.length) return src;
  return (copies.find((copy) => copy.width >= minWidth) ?? copies[copies.length - 1]).src;
}

const mediaCache = new Map<string, ResolvedMedia>();

/** Resolved media for a project/event (memoized). */
export function getWorkMedia(work: WorkItem): ResolvedMedia {
  const key = `${work.kind}:${work.item.id}`;
  let media = mediaCache.get(key);
  if (!media) {
    media = resolveMedia(work.kind, work.item.id, work.item.media, work.item.title);
    mediaCache.set(key, media);
  }
  return media;
}

/* ------------------------------------------------------------------ */
/* Work: cards, sorting, filters                                       */
/* ------------------------------------------------------------------ */

const entryCache = new Map<string, WorkEntry>();

/** Card model for a project or event (memoized). */
export function toWorkEntry(work: WorkItem): WorkEntry {
  const cached = entryCache.get(work.item.id);
  if (cached && cached.kind === work.kind) return cached;

  const media = getWorkMedia(work);
  const shared = {
    id: work.item.id,
    title: work.item.title,
    year: work.item.year,
    dateLabel: work.item.dateLabel,
    importance: work.item.importance,
    summary: work.item.summary,
    href: paths.workItem(work.item.id),
    cover: media.cover,
    mediaCount: media.images.length + media.videos.length,
    role: work.item.role,
  };

  const entry: WorkEntry =
    work.kind === "project"
      ? compact({
          ...shared,
          kind: "project",
          category: work.item.category,
          categoryLabel: labelFor(projectCategories, work.item.category),
          typeLabel: "Project",
          statusLabel: labelFor(projectStatusLabels, work.item.status),
        })
      : compact({
          ...shared,
          kind: "event",
          category: work.item.category,
          categoryLabel: labelFor(eventCategories, work.item.category),
          typeLabel: labelFor(eventTypes, work.item.type),
          recognition: work.item.recognition,
          organization: work.item.organization,
        });

  entryCache.set(work.item.id, entry);
  return entry;
}

/** Card model by id; undefined for unknown ids. */
export function getWorkEntry(id: string): WorkEntry | undefined {
  const work = getWorkItem(id);
  return work ? toWorkEntry(work) : undefined;
}

const sortedProjects = lazy(() =>
  [...projects].sort(
    (a, b) =>
      IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance] || compareYearDesc(a.year, b.year)
  )
);

/** Built lens order: featured → significant → archive, newest first within each. */
export const getProjects = (): Project[] => [...sortedProjects()];

const sortedEvents = lazy(() =>
  [...events].sort(
    (a, b) =>
      compareYearDesc(a.year, b.year) || IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance]
  )
);

/** All events, newest first; undated events last. */
export const getEvents = (): WorkEvent[] => [...sortedEvents()];

/** Did lens: every event except pure awards (those live under Recognized). */
export const getDidEvents = (): WorkEvent[] => sortedEvents().filter((e) => e.type !== "award");

/** Group events (already in display order) by year; undated → "Along the way". */
export function groupEventsByYear(list: readonly WorkEvent[]): EventYearGroup[] {
  const groups = new Map<number | null, WorkEvent[]>();
  for (const event of list) {
    const year = event.year ?? null;
    const group = groups.get(year);
    if (group) group.push(event);
    else groups.set(year, [event]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compareYearDesc(a, b))
    .map(([year, grouped]) => ({
      year,
      label: year === null ? workCopy.undatedGroup : String(year),
      events: grouped,
    }));
}

function toRecognitionEntry(event: WorkEvent, recognition: Recognition): RecognitionEntry {
  return compact({
    event,
    recognition,
    year: recognition.year ?? event.year,
    categoryLabel: labelFor(recognitionCategories, recognition.category),
    href: paths.workItem(event.id),
    cover: getWorkMedia({ kind: "event", item: event }).cover,
  });
}

const sortedRecognitions = lazy(() =>
  events
    .filter((event): event is WorkEvent & { recognition: Recognition } => Boolean(event.recognition))
    .map((event) => toRecognitionEntry(event, event.recognition))
    .sort(
      (a, b) =>
        compareYearDesc(a.year, b.year) ||
        LEVEL_RANK[a.recognition.level] - LEVEL_RANK[b.recognition.level] ||
        IMPORTANCE_RANK[a.event.importance] - IMPORTANCE_RANK[b.event.importance]
    )
);

/** Recognized lens: newest first; major results first within a year. */
export const getRecognitions = (): RecognitionEntry[] => [...sortedRecognitions()];

const allWork = lazy(() =>
  [
    ...projects.map((item) => toWorkEntry({ kind: "project", item })),
    ...events.map((item) => toWorkEntry({ kind: "event", item })),
  ].sort(
    (a, b) =>
      compareYearDesc(a.year, b.year) ||
      IMPORTANCE_RANK[a.importance] - IMPORTANCE_RANK[b.importance] ||
      (a.kind === b.kind ? 0 : a.kind === "project" ? -1 : 1)
  )
);

/** All lens: every project and event as cards, newest first. */
export const getAllWork = (): WorkEntry[] => [...allWork()];

/** Filter chips in taxonomy order, with counts; empty categories omitted. */
function buildFilters(labels: Record<string, TaxonomyLabel>, values: readonly string[]): FilterOption[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.entries(labels)
    .filter(([id]) => (counts.get(id) ?? 0) > 0)
    .map(([id, label]) => compact({ id, label: label.label, short: label.short, count: counts.get(id) ?? 0 }));
}

export const getProjectFilters = (): FilterOption[] =>
  buildFilters(projectCategories, projects.map((p) => p.category));

export const getEventFilters = (): FilterOption[] =>
  buildFilters(eventCategories, getDidEvents().map((e) => e.category));

export const getRecognitionFilters = (): FilterOption[] =>
  buildFilters(recognitionCategories, sortedRecognitions().map((r) => r.recognition.category));

/* ------------------------------------------------------------------ */
/* Relationships                                                       */
/* ------------------------------------------------------------------ */

const isStoryMoment = (source: WorkItem | StoryMoment): source is StoryMoment => "era" in source;

/** What a record itself links to (forward relations). Unknown ids are skipped. */
export function getRelated(source: WorkItem | StoryMoment): RelatedContent {
  if (isStoryMoment(source)) {
    return {
      skills: [],
      projects: resolveIds(source.relatedProjects, projectIndex()),
      events: resolveIds(source.relatedEvents, eventIndex()),
      story: [],
    };
  }
  const { item } = source;
  return {
    skills: resolveIds(item.relatedSkills, skillIndex()),
    projects: source.kind === "event" ? resolveIds(source.item.relatedProjects, projectIndex(), item.id) : [],
    events: resolveIds(item.relatedEvents, eventIndex(), item.id),
    story: resolveIds(item.relatedStory, storyIndex()),
  };
}

const includes = (ids: readonly string[] | undefined, id: string) => Boolean(ids?.includes(id));

/** Records that point AT the given id (reverse relations). */
export function getBacklinks(id: string): RelatedContent {
  const isWork = getWorkItem(id) !== undefined;
  const isStory = getStoryMoment(id) !== undefined;
  const isSkill = getSkill(id) !== undefined;

  return {
    skills: skills.filter(
      (s) =>
        (isWork && (includes(s.relatedProjects, id) || includes(s.relatedEvents, id))) ||
        (isStory && includes(s.relatedStory, id))
    ),
    projects: projects.filter(
      (p) =>
        p.id !== id &&
        ((isWork && includes(p.relatedEvents, id)) ||
          (isStory && includes(p.relatedStory, id)) ||
          (isSkill && includes(p.relatedSkills, id)))
    ),
    events: events.filter(
      (e) =>
        e.id !== id &&
        ((isWork && (includes(e.relatedProjects, id) || includes(e.relatedEvents, id))) ||
          (isStory && includes(e.relatedStory, id)) ||
          (isSkill && includes(e.relatedSkills, id)))
    ),
    story: story.filter(
      (m) => isWork && (includes(m.relatedProjects, id) || includes(m.relatedEvents, id))
    ),
  };
}

/** Forward + reverse relations merged and de-duplicated (forward first). */
export function getConnections(source: WorkItem | StoryMoment): RelatedContent {
  const id = isStoryMoment(source) ? source.id : source.item.id;
  const forward = getRelated(source);
  const backward = getBacklinks(id);
  return {
    skills: uniqueById([...forward.skills, ...backward.skills]),
    projects: uniqueById([...forward.projects, ...backward.projects]),
    events: uniqueById([...forward.events, ...backward.events]),
    story: uniqueById([...forward.story, ...backward.story]),
  };
}

const evidenceCache = new Map<string, SkillEvidence>();

/**
 * Proof for a skill: the skill's own related* ids UNION every project/
 * event whose relatedSkills include it. Sorted like the Work lenses.
 */
export function getSkillEvidence(skill: Skill): SkillEvidence {
  const cached = evidenceCache.get(skill.id);
  if (cached) return cached;

  const projectIds = new Set([
    ...(skill.relatedProjects ?? []),
    ...projects.filter((p) => includes(p.relatedSkills, skill.id)).map((p) => p.id),
  ]);
  const eventIds = new Set([
    ...(skill.relatedEvents ?? []),
    ...events.filter((e) => includes(e.relatedSkills, skill.id)).map((e) => e.id),
  ]);

  const evidenceProjects = sortedProjects().filter((p) => projectIds.has(p.id));
  const evidenceEvents = sortedEvents().filter((e) => eventIds.has(e.id) && !e.recognition);
  const recognitions = sortedRecognitions().filter((r) => eventIds.has(r.event.id));
  const evidence: SkillEvidence = {
    projects: evidenceProjects,
    events: evidenceEvents,
    story: resolveIds(skill.relatedStory, storyIndex()),
    recognitions,
    proofCount: evidenceProjects.length + evidenceEvents.length + recognitions.length,
  };
  evidenceCache.set(skill.id, evidence);
  return evidence;
}

/* ------------------------------------------------------------------ */
/* Story                                                               */
/* ------------------------------------------------------------------ */

const chronologicalStory = lazy(() => [...story].sort((a, b) => a.year - b.year));

/** Story moments, oldest first. */
export const getStoryMoments = (): StoryMoment[] => [...chronologicalStory()];

/** Moments marked isTurningPoint, oldest first. */
export const getTurningPoints = (): StoryMoment[] =>
  chronologicalStory().filter((m) => m.isTurningPoint);

const storyChapters = lazy(() => {
  const chapters: StoryChapter[] = [];
  const usedIds = new Set<string>();
  for (const moment of chronologicalStory()) {
    const last = chapters[chapters.length - 1];
    if (last && last.era === moment.era) {
      last.moments.push(moment);
      continue;
    }
    let id = `chapter-${slugify(moment.era)}`;
    for (let n = 2; usedIds.has(id); n++) id = `chapter-${slugify(moment.era)}-${n}`;
    usedIds.add(id);
    chapters.push({ id, number: chapters.length + 1, era: moment.era, yearLabel: "", moments: [moment] });
  }
  for (const chapter of chapters) {
    const first = chapter.moments[0].year;
    const last = chapter.moments[chapter.moments.length - 1].year;
    chapter.yearLabel = first === last ? String(first) : `${first} — ${last}`;
  }
  return chapters;
});

/** Consecutive moments sharing an era form one chapter. */
export const getStoryChapters = (): StoryChapter[] =>
  storyChapters().map((chapter) => ({ ...chapter, moments: [...chapter.moments] }));

/** The photo illustrating a moment: the cover of its `mediaFrom` event. */
export function getStoryImage(moment: StoryMoment): ResolvedImage | undefined {
  const event = moment.mediaFrom ? getEvent(moment.mediaFrom) : undefined;
  if (!event) return undefined;
  const cover = getWorkMedia({ kind: "event", item: event }).cover;
  return cover && { ...cover, caption: cover.caption ?? event.title };
}

/* ------------------------------------------------------------------ */
/* Me, Beyond, Home helpers                                            */
/* ------------------------------------------------------------------ */

/** Pick records by id, in the order of `ids`, skipping unknown ids. */
function pick<T extends { id: string }>(items: readonly T[], ids: readonly string[]): T[] {
  return resolveIds(ids, indexById(items));
}

/** Home → "A few things worth your time" cards. Falls back to featured projects. */
export function getHomeFeatured(): WorkEntry[] {
  const chosen = home.featuredWork.ids
    .map(getWorkEntry)
    .filter((entry): entry is WorkEntry => Boolean(entry));
  if (chosen.length > 0) return chosen;
  return sortedProjects()
    .filter((p) => p.importance === "featured")
    .map((item) => toWorkEntry({ kind: "project", item }));
}

export const getHomePersonalDetails = (): PersonalDetail[] => pick(personalDetails, home.personal.ids);
export const getHomeInterests = (): Interest[] => pick(interests, home.care.ids);

/** Now items in content order; pass a limit for the homepage snapshot. */
export const getNowItems = (limit?: number): NowItem[] =>
  limit === undefined ? [...now] : now.slice(0, limit);

/** Most recent `updatedAt` across Now items (ISO date), if any. */
export function getLatestNowUpdate(): string | undefined {
  return now.reduce<string | undefined>(
    (latest, item) => (!latest || item.updatedAt > latest ? item.updatedAt : latest),
    undefined
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-08-27" → "August 2026". Locale/timezone independent (hydration-safe). */
export function formatMonthYear(iso: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${match[1]}` : iso;
}

/** Next → goals grouped by horizon (now → someday); empty horizons omitted. */
export function getFutureByHorizon(): HorizonGroup[] {
  return (Object.keys(horizonLabels) as Horizon[])
    .map((horizon) =>
      compact({
        horizon,
        label: horizonLabels[horizon].label,
        description: horizonLabels[horizon].description,
        goals: futureGoals.filter((goal) => goal.horizon === horizon),
      })
    )
    .filter((group) => group.goals.length > 0);
}

const sortedLab = lazy(() => [...labIdeas].sort((a, b) => b.year - a.year));

/** Lab ideas, newest first. */
export const getLabIdeas = (): LabIdea[] => [...sortedLab()];

export const getLabFilters = (): FilterOption[] =>
  buildFilters(labStatusLabels, labIdeas.map((idea) => idea.status));

/* ------------------------------------------------------------------ */
/* Archive + Explore                                                   */
/* ------------------------------------------------------------------ */

function searchTextOf(parts: (string | number | undefined)[]): string {
  return parts
    .filter((part) => part !== undefined && part !== "")
    .join(" ")
    .toLowerCase();
}

const archive = lazy((): ArchiveEntry[] => {
  const workRows = allWork().map(
    (entry): ArchiveEntry => ({
      ...entry,
      kindLabel: archiveCopy.kindLabels[entry.kind],
      searchText: searchTextOf([
        entry.title,
        entry.summary,
        entry.categoryLabel,
        entry.typeLabel,
        entry.organization,
        entry.role,
        entry.recognition?.result,
        entry.dateLabel,
        entry.year,
      ]),
    })
  );
  const storyRows = chronologicalStory().map((moment): ArchiveEntry => {
    const cover = getStoryImage(moment);
    return compact({
      kind: "story",
      kindLabel: archiveCopy.kindLabels.story,
      id: moment.id,
      title: moment.title,
      year: moment.year,
      dateLabel: moment.dateLabel,
      importance: moment.isTurningPoint ? "significant" : "archive",
      category: "story",
      categoryLabel: "Story",
      typeLabel: moment.isTurningPoint ? storyCopy.turningPoint : archiveCopy.kindLabels.story,
      summary: moment.summary,
      href: paths.story(moment.id),
      cover,
      mediaCount: 0,
      era: moment.era,
      searchText: searchTextOf([moment.title, moment.summary, moment.era, moment.dateLabel, moment.year]),
    });
  });
  const kindRank = { project: 0, event: 1, story: 2 } as const;
  // One shared collator: localeCompare(…, "en") builds a new one per call.
  const byTitle = new Intl.Collator("en").compare;
  return [...workRows, ...storyRows].sort(
    (a, b) =>
      compareYearDesc(a.year, b.year) ||
      kindRank[a.kind] - kindRank[b.kind] ||
      byTitle(a.title, b.title)
  );
});

/** Every project, event and story moment, newest first. */
export const getArchive = (): ArchiveEntry[] => [...archive()];

/** Years that have at least one archive entry, newest first. */
export const getArchiveYears = (): number[] =>
  [...new Set(archive().flatMap((e) => (e.year === undefined ? [] : [e.year])))].sort((a, b) => b - a);

/** Categories present in the archive: project categories, event categories, then Story. */
export function getArchiveCategories(): { id: string; label: string }[] {
  const present = new Set(archive().map((e) => e.category));
  const ordered: { id: string; label: string }[] = [
    ...Object.entries(projectCategories).map(([id, l]) => ({ id, label: l.label })),
    ...Object.entries(eventCategories).map(([id, l]) => ({ id, label: l.label })),
    { id: "story", label: "Story" },
  ];
  return ordered.filter((c) => present.has(c.id));
}

/** Skills that suggest an event involved making something. */
const BUILDING_SKILLS = new Set(["product-thinking", "frontend-development", "design"]);

function involvedBuilding(event: WorkEvent): boolean {
  return (
    event.category === "entrepreneurship" ||
    (event.relatedProjects?.length ?? 0) > 0 ||
    projects.some((p) => includes(p.relatedEvents, event.id)) ||
    Boolean(event.relatedSkills?.some((s) => BUILDING_SKILLS.has(s)))
  );
}

const entriesFor = (ids: readonly string[]): WorkEntry[] =>
  [...new Set(ids)].map(getWorkEntry).filter((entry): entry is WorkEntry => Boolean(entry));

function computeLens(key: ExploreLensKey): ExploreLensResult {
  const copy = exploreLenses[key];
  const base = { key, label: copy.label, headline: copy.headline, description: copy.description };

  switch (key) {
    case "built": {
      const builtEvents = sortedEvents().filter(
        (e) =>
          (e.type === "competition" || e.type === "programme") &&
          e.importance !== "archive" &&
          involvedBuilding(e)
      );
      return {
        ...base,
        entries: entriesFor([...sortedProjects().map((p) => p.id), ...builtEvents.map((e) => e.id)]),
      };
    }
    case "grown": {
      const turning = chronologicalStory().filter((m) => m.isTurningPoint);
      const ids = turning.flatMap((moment) => {
        const back = getBacklinks(moment.id);
        return [
          ...(moment.relatedProjects ?? []),
          ...(moment.relatedEvents ?? []),
          ...back.projects.map((p) => p.id),
          ...back.events.map((e) => e.id),
        ];
      });
      return { ...base, entries: entriesFor(ids), story: turning };
    }
    case "tried":
      return {
        ...base,
        entries: allWork().filter((entry) => entry.importance === "archive"),
        lab: [...sortedLab()],
      };
    case "care": {
      const ids = interests.flatMap((i) => [...(i.relatedProjects ?? []), ...(i.relatedEvents ?? [])]);
      return { ...base, entries: entriesFor(ids), interests: [...interests] };
    }
    case "proud": {
      const recognitions = [...sortedRecognitions()].sort(
        (a, b) => LEVEL_RANK[a.recognition.level] - LEVEL_RANK[b.recognition.level]
      );
      const underneath = recognitions.flatMap(({ event }) => [
        ...(event.relatedProjects ?? []),
        ...projects.filter((p) => includes(p.relatedEvents, event.id)).map((p) => p.id),
      ]);
      return {
        ...base,
        entries: entriesFor([...recognitions.map((r) => r.event.id), ...underneath]),
        recognitions,
      };
    }
  }
}

const lensCache = new Map<ExploreLensKey, ExploreLensResult>();

/** An Explore lens: headline, description and the records it assembles. */
export function getLens(key: ExploreLensKey): ExploreLensResult {
  let lens = lensCache.get(key);
  if (!lens) {
    lens = computeLens(key);
    lensCache.set(key, lens);
  }
  return {
    ...lens,
    entries: [...lens.entries],
    story: lens.story && [...lens.story],
    interests: lens.interests && [...lens.interests],
    lab: lens.lab && [...lens.lab],
    recognitions: lens.recognitions && [...lens.recognitions],
  };
}

/** Explore lens keys in display order. */
export const getLensKeys = (): ExploreLensKey[] => Object.keys(exploreLenses) as ExploreLensKey[];

/** Everything "Surprise me" may land on. Pick randomly inside an event handler, never during render. */
export const getSurprisePool = (): ArchiveEntry[] => [...archive()];

/* ------------------------------------------------------------------ */
/* Pages + metadata                                                    */
/* ------------------------------------------------------------------ */

/** Full document title: "<page> — Tanushh Lath", or "Tanushh Lath — <tagline>" for Home. */
export function formatTitle(pageTitle?: string | null): string {
  return pageTitle ? `${pageTitle} — ${site.name}` : `${site.name} — ${site.tagline}`;
}

/** Full document title for a static page. */
export const getPageTitle = (key: PageKey): string =>
  key === "home" ? formatTitle() : formatTitle(pages[key].title);

/* ------------------------------------------------------------------ */
/* Validation (run by the build; any problem fails it)                 */
/* ------------------------------------------------------------------ */

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATIC_ROUTES = new Set(["/", "/story/", "/work/", "/me/", "/beyond/", "/archive/", "/explore/"]);

/**
 * Check every content file for mistakes that would break a page or a
 * link. Returns human-readable problems (empty = all good). The build
 * prints them and stops, so fix the record named in the message.
 */
export function validateContent(): string[] {
  const problems: string[] = [];
  const report = (message: string): void => {
    problems.push(message);
  };

  const workIds = new Set(getAllWorkIds());
  const storyIds = new Set(story.map((m) => m.id));
  const skillIds = new Set(skills.map((s) => s.id));
  const chapterIds = new Set(storyChapters().map((c) => c.id));
  const meAnchors = new Set([meCopy.intro.id, meCopy.careAbout.id, meCopy.personal.id, meCopy.skills.id]);

  /* ids: kebab-case and unique ------------------------------------ */
  const checkIds = (label: string, items: readonly { id: string }[]) => {
    const seen = new Set<string>();
    for (const { id } of items) {
      if (!KEBAB.test(id)) report(`${label} "${id}": id must be lowercase-kebab-case (e.g. "my-event-2024").`);
      if (seen.has(id)) report(`${label} "${id}": this id is used more than once.`);
      seen.add(id);
    }
  };
  checkIds("Project", projects);
  checkIds("Event", events);
  checkIds("Story moment", story);
  checkIds("Skill", skills);
  checkIds("Interest", interests);
  checkIds("Personal detail", personalDetails);
  checkIds("Now item", now);
  checkIds("Next goal", futureGoals);
  checkIds("Lab idea", labIdeas);
  for (const project of projects) {
    if (eventIndex().has(project.id)) {
      report(`"${project.id}" is both a project and an event — /work/${project.id}/ can only be one of them.`);
    }
  }

  /* aliases ------------------------------------------------------- */
  const aliasOwner = new Map<string, string>();
  for (const { from, to } of getAliases()) {
    if (!KEBAB.test(from)) report(`"${to}": alias "${from}" must be lowercase-kebab-case.`);
    if (workIds.has(from)) report(`"${to}": alias "${from}" is also a real record id — remove the alias.`);
    const owner = aliasOwner.get(from);
    if (owner) report(`Alias "${from}" is claimed by both "${owner}" and "${to}".`);
    aliasOwner.set(from, to);
  }

  /* links ---------------------------------------------------------- */
  const checkFragment = (path: string, fragment: string, where: string) => {
    const [first, second] = fragment.split("/");
    const known = (labels: Record<string, unknown>, value: string | undefined) =>
      value === undefined || value in labels;
    let ok = true;
    if (path === "/work/") {
      const filterLabels =
        first === "built"
          ? projectCategories
          : first === "did"
            ? eventCategories
            : first === "recognized"
              ? recognitionCategories
              : { ...projectCategories, ...eventCategories, ...recognitionCategories };
      ok = first in workLenses && known(filterLabels, second);
    } else if (path === "/beyond/") ok = first in beyondModes && second === undefined;
    else if (path === "/explore/") ok = first in exploreLenses && second === undefined;
    else if (path === "/me/") ok = meAnchors.has(fragment);
    else if (path === "/story/") ok = storyIds.has(fragment) || chapterIds.has(fragment);
    if (!ok) report(`${where}: "${path}#${fragment}" points at a tab/section that doesn't exist.`);
  };

  const checkHref = (href: string | undefined, where: string) => {
    if (!href) return report(`${where}: link is empty.`);
    if (isExternalHref(href)) {
      if (href.startsWith("http://")) report(`${where}: "${href}" should use https://.`);
      return;
    }
    if (href.startsWith("#")) return; // same-page anchor
    if (!href.startsWith("/")) return report(`${where}: "${href}" must start with "/" — build it with paths.*.`);
    const [beforeHash, fragment] = href.split("#", 2);
    if (beforeHash.includes("?")) return report(`${where}: "${href}" uses a ?query — put UI state in the #fragment.`);
    const canonical = normalizeHref(beforeHash);
    if (canonical !== beforeHash) return report(`${where}: "${href}" isn't canonical — use "${canonical}".`);
    const workMatch = /^\/work\/([^/]+)\/$/.exec(canonical);
    if (!STATIC_ROUTES.has(canonical) && !(workMatch && workIds.has(workMatch[1]))) {
      return report(`${where}: "${href}" doesn't match any page.`);
    }
    if (fragment) checkFragment(canonical, fragment, where);
  };

  const checkRefs = (where: string, field: string, ids: readonly string[] | undefined, valid: Set<string>, selfId?: string) => {
    for (const id of ids ?? []) {
      if (id === selfId) report(`${where}: ${field} lists the record itself.`);
      else if (!valid.has(id)) report(`${where}: ${field} contains "${id}", which doesn't exist.`);
    }
  };
  const projectIds = new Set(projects.map((p) => p.id));
  const eventIds = new Set(events.map((e) => e.id));

  /* projects ------------------------------------------------------- */
  for (const p of projects) {
    const where = `Project "${p.id}"`;
    if (!p.title?.trim()) report(`${where}: title is empty.`);
    if (!p.summary?.trim()) report(`${where}: summary is empty.`);
    if (!(p.category in projectCategories)) report(`${where}: category "${p.category}" isn't one of: ${Object.keys(projectCategories).join(", ")}.`);
    if (!(p.status in projectStatusLabels)) report(`${where}: status "${p.status}" isn't one of: ${Object.keys(projectStatusLabels).join(", ")}.`);
    if (!(p.importance in importanceLabels)) report(`${where}: importance "${p.importance}" must be featured, significant or archive.`);
    checkYear(p.year, where, report, true);
    checkRefs(where, "relatedSkills", p.relatedSkills, skillIds);
    checkRefs(where, "relatedEvents", p.relatedEvents, eventIds);
    checkRefs(where, "relatedStory", p.relatedStory, storyIds);
    for (const link of p.links ?? []) checkHref(link.url, `${where} link "${link.label}"`);
  }

  /* events --------------------------------------------------------- */
  for (const e of events) {
    const where = `Event "${e.id}"`;
    if (!e.title?.trim()) report(`${where}: title is empty.`);
    if (!e.summary?.trim()) report(`${where}: summary is empty.`);
    if (!(e.category in eventCategories)) report(`${where}: category "${e.category}" isn't one of: ${Object.keys(eventCategories).join(", ")}.`);
    if (!(e.type in eventTypes)) report(`${where}: type "${e.type}" isn't one of: ${Object.keys(eventTypes).join(", ")}.`);
    if (!(e.importance in importanceLabels)) report(`${where}: importance "${e.importance}" must be featured, significant or archive.`);
    checkYear(e.year, where, report, false);
    if (e.recognition) {
      const r = e.recognition;
      if (!r.result?.trim()) report(`${where}: recognition.result is empty.`);
      if (!(r.category in recognitionCategories)) report(`${where}: recognition.category "${r.category}" isn't one of: ${Object.keys(recognitionCategories).join(", ")}.`);
      if (r.level !== "major" && r.level !== "minor") report(`${where}: recognition.level must be "major" or "minor".`);
      checkYear(r.year, `${where} recognition`, report, false);
    } else if (e.type === "award") {
      report(`${where}: type "award" needs a recognition — without one it appears in neither Did nor Recognized.`);
    }
    checkRefs(where, "relatedSkills", e.relatedSkills, skillIds);
    checkRefs(where, "relatedProjects", e.relatedProjects, projectIds);
    checkRefs(where, "relatedEvents", e.relatedEvents, eventIds, e.id);
    checkRefs(where, "relatedStory", e.relatedStory, storyIds);
    for (const link of e.links ?? []) checkHref(link.url, `${where} link "${link.label}"`);
  }

  /* story, skills, Me, Beyond ------------------------------------- */
  for (const m of story) {
    const where = `Story moment "${m.id}"`;
    if (!m.title?.trim()) report(`${where}: title is empty.`);
    if (!m.summary?.trim()) report(`${where}: summary is empty.`);
    if (!m.era?.trim()) report(`${where}: era (chapter name) is empty.`);
    checkYear(m.year, where, report, true);
    checkRefs(where, "relatedProjects", m.relatedProjects, projectIds);
    checkRefs(where, "relatedEvents", m.relatedEvents, eventIds);
    if (m.mediaFrom && !eventIds.has(m.mediaFrom)) report(`${where}: mediaFrom "${m.mediaFrom}" isn't an event id.`);
  }
  for (const s of skills) {
    const where = `Skill "${s.id}"`;
    if (!s.name?.trim()) report(`${where}: name is empty.`);
    if (!(s.category in skillCategories)) report(`${where}: category "${s.category}" isn't one of: ${Object.keys(skillCategories).join(", ")}.`);
    checkRefs(where, "relatedProjects", s.relatedProjects, projectIds);
    checkRefs(where, "relatedEvents", s.relatedEvents, eventIds);
    checkRefs(where, "relatedStory", s.relatedStory, storyIds);
  }
  for (const i of interests) {
    const where = `Interest "${i.id}"`;
    if (!i.title?.trim() || !i.note?.trim()) report(`${where}: title and note are required.`);
    checkRefs(where, "relatedProjects", i.relatedProjects, projectIds);
    checkRefs(where, "relatedEvents", i.relatedEvents, eventIds);
    if (i.link) checkHref(i.link.href, `${where} link`);
  }
  for (const d of personalDetails) {
    const where = `Personal detail "${d.id}"`;
    if (!d.prompt?.trim() || !d.answer?.trim()) report(`${where}: prompt and answer are required.`);
    if (d.link) checkHref(d.link.href, `${where} link`);
  }
  for (const item of now) {
    const where = `Now item "${item.id}"`;
    if (!(item.label in nowLabels)) report(`${where}: label "${item.label}" isn't one of: ${Object.keys(nowLabels).join(", ")}.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt)) report(`${where}: updatedAt must be a date like "2026-09-27".`);
    checkRefs(where, "relatedProjects", item.relatedProjects, projectIds);
    checkRefs(where, "relatedEvents", item.relatedEvents, eventIds);
  }
  for (const goal of futureGoals) {
    if (!(goal.horizon in horizonLabels)) report(`Next goal "${goal.id}": horizon "${goal.horizon}" must be now, next, later or someday.`);
  }
  for (const idea of labIdeas) {
    const where = `Lab idea "${idea.id}"`;
    if (!(idea.status in labStatusLabels)) report(`${where}: status "${idea.status}" isn't one of: ${Object.keys(labStatusLabels).join(", ")}.`);
    if (idea.href) checkHref(idea.href, `${where} link`);
  }

  /* site, menu, page copy ----------------------------------------- */
  checkHref(navigation.home.href, "Menu → Home");
  for (const item of [...navigation.primary, ...navigation.secondary]) checkHref(item.href, `Menu → ${item.label}`);
  checkHref(easterEgg.afterLink.href, "Easter egg link");
  for (const thing of home.definingThings) checkHref(thing.href, `Home "${thing.text}"`);
  for (const section of [home.current, home.featuredWork, home.personal, home.care, home.journey]) {
    if (section.cta) checkHref(section.cta.href, `Home "${section.cta.label}"`);
  }
  for (const link of home.finale.links) checkHref(link.href, `Home "${link.label}"`);
  checkRefs("home.ts featuredWork", "ids", home.featuredWork.ids, workIds);
  checkRefs("home.ts personal", "ids", home.personal.ids, new Set(personalDetails.map((d) => d.id)));
  checkRefs("home.ts care", "ids", home.care.ids, new Set(interests.map((i) => i.id)));
  for (const link of [...meCopy.closing.links, ...notFoundCopy.links, workCopy.archiveLink, detailCopy.back]) {
    checkHref(link.href, `Page link "${link.label}"`);
  }

  /* media ---------------------------------------------------------- */
  const checkMedia = (owner: MediaOwner, id: string, config: MediaConfig | undefined) => {
    const folder = manifest[COLLECTION[owner]]?.[id];
    if (!config || !folder) return;
    const where = `${owner === "project" ? "Project" : "Event"} "${id}" media`;
    const dir = `public/media/${COLLECTION[owner]}/${id}/`;
    const kinds = new Map(folder.map((f) => [f.file, f.kind]));
    const expect = (file: string | undefined, kind: MediaManifestFile["kind"] | "any", field: string) => {
      if (!file) return;
      const found = kinds.get(file);
      if (!found) report(`${where}: ${field} "${file}" isn't in ${dir}.`);
      else if (kind !== "any" && found !== kind) report(`${where}: ${field} "${file}" is a ${found}, not an ${kind}.`);
    };
    for (const image of config.images ?? []) expect(image.file, "image", "images");
    for (const video of config.videos ?? []) {
      expect(video.file, "video", "videos");
      expect(video.poster, "image", "poster");
    }
    expect(config.cover, "image", "cover");
    for (const file of config.hide ?? []) expect(file, "any", "hide");
  };
  for (const p of projects) checkMedia("project", p.id, p.media);
  for (const e of events) checkMedia("event", e.id, e.media);

  for (const id of Object.keys(manifest.events ?? {})) {
    if (!eventIds.has(id)) report(`Media folder public/media/events/${id}/ has no event with id "${id}" — rename the folder or the event.`);
  }
  for (const id of Object.keys(manifest.projects ?? {})) {
    if (!projectIds.has(id)) report(`Media folder public/media/projects/${id}/ has no project with id "${id}" — rename the folder or the project.`);
  }

  return problems;
}

function checkYear(year: number | undefined, where: string, report: (m: string) => void, required: boolean) {
  if (year === undefined) {
    if (required) report(`${where}: year is required.`);
    return;
  }
  if (!Number.isInteger(year) || year < 1990 || year > 2100) report(`${where}: year "${year}" doesn't look like a year.`);
}
