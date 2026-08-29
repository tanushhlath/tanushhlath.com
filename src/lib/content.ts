import { projects } from "@/content/projects";
import { experiences } from "@/content/experiences";
import { achievements } from "@/content/achievements";
import { timeline } from "@/content/timeline";
import { skills } from "@/content/skills";
import { interests } from "@/content/interests";
import { currently } from "@/content/currently";
import { futureGoals } from "@/content/future";
import { labIdeas } from "@/content/lab";
import { personalDetails } from "@/content/personal";
import { site } from "@/content/site";
import {
  Achievement,
  Experience,
  Interest,
  LabIdea,
  Project,
  Skill,
  Tier,
  TimelineEvent,
} from "@/types/content";

/**
 * Everything a page needs to read content lives here. Pages should not
 * import from `@/content/*` directly for anything that needs relations,
 * sorting, or filtering resolved — that logic lives once, in this file.
 */

export {
  projects,
  experiences,
  achievements,
  timeline,
  skills,
  interests,
  currently,
  futureGoals,
  labIdeas,
  personalDetails,
  site,
};

const tierOrder: Record<Tier, number> = { featured: 0, significant: 1, archive: 2 };
export function byTier<T extends { tier: Tier }>(items: T[]): T[] {
  return [...items].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
}
export function byYearDesc<T extends { year: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.year - a.year);
}

export const getProjectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug);
export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);
export const getExperienceBySlug = (slug: string): Experience | undefined =>
  experiences.find((e) => e.slug === slug);
export const getExperienceById = (id: string): Experience | undefined =>
  experiences.find((e) => e.id === id);
export const getAchievementBySlug = (slug: string): Achievement | undefined =>
  achievements.find((a) => a.slug === slug);
export const getAchievementById = (id: string): Achievement | undefined =>
  achievements.find((a) => a.id === id);
export const getSkillById = (id: string): Skill | undefined =>
  skills.find((s) => s.id === id);

/** ---- Unified WORK lookup: a project and an experience can share a route
 * (`/work/[slug]`) without the page needing to know which collection a
 * slug came from. ---- */
export type WorkItem =
  | { kind: "project"; item: Project }
  | { kind: "experience"; item: Experience };

export function getWorkItemBySlug(slug: string): WorkItem | undefined {
  const project = getProjectBySlug(slug);
  if (project) return { kind: "project", item: project };
  const experience = getExperienceBySlug(slug);
  if (experience) return { kind: "experience", item: experience };
  return undefined;
}

export function getAllWorkSlugs(): string[] {
  return [...projects.map((p) => p.slug), ...experiences.map((e) => e.slug)];
}

export function resolveProjects(ids: string[] = []): Project[] {
  return ids.map(getProjectById).filter((p): p is Project => Boolean(p));
}
export function resolveExperiences(ids: string[] = []): Experience[] {
  return ids.map(getExperienceById).filter((e): e is Experience => Boolean(e));
}
export function resolveAchievements(ids: string[] = []): Achievement[] {
  return ids.map(getAchievementById).filter((a): a is Achievement => Boolean(a));
}

/** All evidence linked to a skill — used on /skills to prove, not claim. */
export function getSkillEvidence(skill: Skill) {
  return {
    projects: resolveProjects(skill.relatedProjects),
    experiences: resolveExperiences(skill.relatedExperiences),
    achievements: resolveAchievements(skill.relatedAchievements),
  };
}

/** Every skill that references a given project/experience — reverse lookup. */
export function getSkillsFor(entityId: string): Skill[] {
  return skills.filter(
    (s) =>
      s.relatedProjects?.includes(entityId) ||
      s.relatedExperiences?.includes(entityId) ||
      s.relatedAchievements?.includes(entityId)
  );
}

export function resolveTimelineLinks(event: TimelineEvent) {
  return {
    projects: resolveProjects(event.relatedProjects),
    experiences: resolveExperiences(event.relatedExperiences),
    achievements: resolveAchievements(event.relatedAchievements),
  };
}

/** ---- Unified archive: every content type, one shape, fully filterable ---- */

export type ArchiveKind = "project" | "experience" | "achievement" | "timeline";

export interface ArchiveEntry {
  kind: ArchiveKind;
  id: string;
  slug?: string;
  title: string;
  year: number;
  tier: Tier;
  category: string;
  summary: string;
  href?: string;
}

export function getArchive(): ArchiveEntry[] {
  const fromProjects: ArchiveEntry[] = projects.map((p) => ({
    kind: "project",
    id: p.id,
    slug: p.slug,
    title: p.title,
    year: p.year,
    tier: p.tier,
    category: p.category,
    summary: p.summary,
    href: `/work/${p.slug}`,
  }));
  const fromExperiences: ArchiveEntry[] = experiences.map((e) => ({
    kind: "experience",
    id: e.id,
    slug: e.slug,
    title: e.title,
    year: e.year,
    tier: e.tier,
    category: e.category,
    summary: e.summary,
    href: `/work/${e.slug}`,
  }));
  const fromAchievements: ArchiveEntry[] = achievements.map((a) => ({
    kind: "achievement",
    id: a.id,
    slug: a.slug,
    title: a.title,
    year: a.year,
    tier: a.tier,
    category: a.category,
    summary: a.summary,
    href: `/work?tab=recognized#${a.slug}`,
  }));
  const fromTimeline: ArchiveEntry[] = timeline.map((t) => ({
    kind: "timeline",
    id: t.id,
    title: t.title,
    year: t.year,
    tier: t.isTurningPoint ? "significant" : "archive",
    category: t.era,
    summary: t.summary,
    href: `/story#${t.id}`,
  }));
  return byYearDesc([
    ...fromProjects,
    ...fromExperiences,
    ...fromAchievements,
    ...fromTimeline,
  ]);
}

export function getAllYears(): number[] {
  const years = new Set(getArchive().map((e) => e.year));
  return Array.from(years).sort((a, b) => b - a);
}

export function getAllCategories(): string[] {
  const cats = new Set(getArchive().map((e) => e.category));
  return Array.from(cats).sort();
}

/** ---- Explore lenses: cross-section assemblies, not just a filter ---- */

export type ExploreLensKey = "built" | "grown" | "tried" | "care" | "proud";

export interface LensResult {
  headline: string;
  projects?: Project[];
  experiences?: Experience[];
  achievements?: Achievement[];
  timelineEvents?: TimelineEvent[];
  interests?: Interest[];
  labIdeas?: LabIdea[];
}

export function getLens(key: ExploreLensKey): LensResult {
  switch (key) {
    case "built":
      return {
        headline: "The things I've made.",
        projects: byYearDesc(byTier(projects).filter((p) => p.tier !== "archive")),
      };
    case "grown": {
      const turning = timeline.filter((t) => t.isTurningPoint);
      return {
        headline: "The moments that actually changed direction.",
        timelineEvents: turning,
        experiences: byYearDesc(turning.flatMap((t) => resolveExperiences(t.relatedExperiences))),
        achievements: byYearDesc(turning.flatMap((t) => resolveAchievements(t.relatedAchievements))),
      };
    }
    case "tried":
      return {
        headline: "Experiments and half-finished ideas — not everything has to ship.",
        labIdeas,
        projects: byYearDesc(projects.filter((p) => p.tier === "archive")),
      };
    case "care":
      return {
        headline: "What actually holds my attention.",
        interests,
      };
    case "proud": {
      const featured = byYearDesc(achievements.filter((a) => a.tier !== "archive"));
      return {
        headline: "Recognition, and the work underneath it.",
        achievements: featured,
        projects: byYearDesc(featured.flatMap((a) => resolveProjects(a.relatedProjects))),
      };
    }
  }
}

export function getRandomArchiveEntry(excludeHref?: string): ArchiveEntry {
  const all = getArchive().filter((e) => e.href && e.href !== excludeHref);
  return all[Math.floor(Math.random() * all.length)];
}
