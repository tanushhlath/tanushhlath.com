import type { ResolvedImage, StoryMoment } from "@/types/content";
import {
  getConnections,
  getEvent,
  getStoryChapters,
  getStoryImage,
  getWorkEntry,
  navigation,
  type StoryChapter,
  type WorkEntry,
} from "@/lib/content";
import { paths } from "@/routing/paths";

/**
 * STORY VIEW MODEL
 *
 * Everything the Story page renders, derived once from the content API
 * (src/lib/content.ts → src/content/story.ts). Components never compute
 * links or look records up themselves; they read this model.
 *
 * `index` values are only used for the page's own scroll state (which
 * moment is active). Every link is built from a record id via `paths.*`.
 */

/** Number of distinct chapter tones in story.css (they repeat after this). */
const TONES = 6;

export interface StoryLink {
  id: string;
  title: string;
  href: string;
  /** "Project · 2025", "Competition · 2023 & 2024" … */
  meta: string;
  /** Recognition result, shown as a small badge ("1st Runner-Up"). */
  result?: string;
}

export interface StoryArtifact {
  image: ResolvedImage;
  /** The event the photo comes from (it links there). */
  eventId: string;
  eventTitle: string;
  href: string;
  meta?: string;
}

export interface StoryMomentView {
  moment: StoryMoment;
  /** Position in the whole story, oldest first (page scroll state only). */
  index: number;
  chapterId: string;
  chapterNumber: number;
  /** Which side the artifact sits on at desktop widths. */
  side: "left" | "right";
  /** The small date line when it says more than the year (e.g. "2025 — 2026"). */
  dateNote?: string;
  artifact?: StoryArtifact;
  links: StoryLink[];
}

export interface StoryChapterView {
  chapter: StoryChapter;
  /** "01", "02" … */
  label: string;
  /** 1…6, cycling — picks the chapter's colour in story.css. */
  tone: number;
  /** First year in the chapter — what the date marker shows before it opens. */
  startYear: number;
  moments: StoryMomentView[];
}

export interface StoryOnwardLink {
  href: string;
  label: string;
  description: string;
  /** Menu numbering, e.g. "02". */
  index: string;
}

export interface StoryModel {
  chapters: StoryChapterView[];
  moments: StoryMomentView[];
  /** "01" — Story's number in the menu. */
  pageIndex?: string;
  /** The project the story most recently led to (for the closing hand-off). */
  ledTo?: WorkEntry;
  /** Work, Me, Beyond — the onward destinations, with their menu copy. */
  onward: StoryOnwardLink[];
}

export const pad2 = (n: number): string => String(n).padStart(2, "0");

function entryMeta(entry: WorkEntry): string {
  const when = entry.dateLabel ?? (entry.year !== undefined ? String(entry.year) : undefined);
  return [entry.typeLabel, when].filter(Boolean).join(" · ");
}

function toLink(entry: WorkEntry): StoryLink {
  return {
    id: entry.id,
    title: entry.title,
    href: paths.workItem(entry.id),
    meta: entryMeta(entry),
    result: entry.recognition?.result,
  };
}

function linksFor(moment: StoryMoment): StoryLink[] {
  const related = getConnections(moment);
  const ids = [...related.projects.map((p) => p.id), ...related.events.map((e) => e.id)];
  const links: StoryLink[] = [];
  for (const id of ids) {
    const entry = getWorkEntry(id);
    if (entry && !links.some((l) => l.id === id)) links.push(toLink(entry));
  }
  for (const other of related.story) {
    if (other.id === moment.id) continue;
    links.push({
      id: other.id,
      title: other.title,
      href: paths.story(other.id),
      meta: [other.era, other.dateLabel ?? String(other.year)].join(" · "),
    });
  }
  return links;
}

function artifactFor(moment: StoryMoment): StoryArtifact | undefined {
  const image = getStoryImage(moment);
  const event = moment.mediaFrom ? getEvent(moment.mediaFrom) : undefined;
  if (!image || !event) return undefined;
  const entry = getWorkEntry(event.id);
  return {
    image,
    eventId: event.id,
    eventTitle: event.title,
    href: paths.workItem(event.id),
    meta: entry ? entryMeta(entry) : undefined,
  };
}

function build(): StoryModel {
  let index = 0;
  const chapters: StoryChapterView[] = getStoryChapters().map((chapter) => ({
    chapter,
    label: pad2(chapter.number),
    tone: ((chapter.number - 1) % TONES) + 1,
    startYear: chapter.moments[0]?.year ?? 0,
    moments: chapter.moments.map((moment) => {
      const i = index++;
      const dateNote = moment.dateLabel && moment.dateLabel !== String(moment.year) ? moment.dateLabel : undefined;
      return {
        moment,
        index: i,
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        side: i % 2 === 0 ? "right" : "left",
        dateNote,
        artifact: artifactFor(moment),
        links: linksFor(moment),
      } satisfies StoryMomentView;
    }),
  }));

  const moments = chapters.flatMap((c) => c.moments);

  // The latest moment that names a project is where the story "led".
  let ledTo: WorkEntry | undefined;
  for (let i = moments.length - 1; i >= 0 && !ledTo; i--) {
    for (const id of moments[i].moment.relatedProjects ?? []) {
      const entry = getWorkEntry(id);
      if (entry) {
        ledTo = entry;
        break;
      }
    }
  }

  const primary = navigation.primary;
  const storyPos = primary.findIndex((item) => item.href === paths.story());
  const onward = primary
    .map((item, i) => ({ ...item, index: pad2(i + 1) }))
    .filter((item) => item.href !== paths.story());

  return {
    chapters,
    moments,
    pageIndex: storyPos >= 0 ? pad2(storyPos + 1) : undefined,
    ledTo,
    onward,
  };
}

let cached: StoryModel | undefined;

/** The Story page's data (computed once; content is static). */
export function getStoryModel(): StoryModel {
  cached ??= build();
  return cached;
}
