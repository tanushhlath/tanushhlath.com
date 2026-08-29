/**
 * CONTENT SCHEMAS
 *
 * These types define the shape of every piece of content on the site.
 * They exist so the data files in `src/content/` stay consistent and so
 * the UI components can rely on fields being present.
 *
 * See CONTENT_GUIDE.md at the project root for how to add/edit content.
 */

/** Visual importance. Controls layout weight, not just visibility. */
export type Tier = "featured" | "significant" | "archive";

export type ThemeTag =
  | "building"
  | "leading"
  | "creating"
  | "competing"
  | "exploring";

export interface Links {
  label: string;
  url: string;
}

export interface MediaImage {
  src: string;
  alt: string;
  caption?: string;
}

/** ---------------- PROJECTS ("What I Build") ---------------- */

export type ProjectStatus =
  | "concept"
  | "in-progress"
  | "shipped"
  | "paused"
  | "archived";

export interface Project {
  id: string;
  slug: string;
  title: string;
  year: number;
  dateLabel?: string;
  category: string;
  status: ProjectStatus;
  tier: Tier;
  themes: ThemeTag[];
  summary: string;
  problem?: string;
  motivation?: string;
  concept?: string;
  role?: string;
  process?: string[];
  challenges?: string;
  outcome?: string;
  impact?: string;
  recognition?: string;
  lessons?: string;
  tools?: string[];
  images?: MediaImage[];
  video?: string;
  links?: Links[];
  relatedSkills?: string[];
  relatedExperiences?: string[];
  relatedAchievements?: string[];
}

/** ---------------- EXPERIENCES ("What I Do") ---------------- */

export type ExperienceCategory =
  | "leadership"
  | "competition"
  | "entrepreneurship"
  | "speaking"
  | "theatre"
  | "volunteering"
  | "community"
  | "media"
  | "school"
  | "workshop"
  | "conference"
  | "sport"
  | "other";

export interface Experience {
  id: string;
  slug: string;
  title: string;
  organization?: string;
  year: number;
  dateLabel?: string;
  category: ExperienceCategory;
  tier: Tier;
  themes: ThemeTag[];
  summary: string;
  description?: string;
  role?: string;
  highlights?: string[];
  images?: MediaImage[];
  links?: Links[];
  relatedSkills?: string[];
  relatedProjects?: string[];
  relatedAchievements?: string[];
}

/** ---------------- ACHIEVEMENTS ---------------- */

export type AchievementCategory =
  | "award"
  | "competition"
  | "recognition"
  | "certification"
  | "leadership"
  | "academic"
  | "milestone";

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  issuer?: string;
  year: number;
  dateLabel?: string;
  category: AchievementCategory;
  tier: Tier;
  summary: string;
  context?: string;
  whyItMatters?: string;
  image?: MediaImage;
  relatedProjects?: string[];
  relatedExperiences?: string[];
  relatedSkills?: string[];
}

/** ---------------- TIMELINE / STORY ---------------- */

export interface TimelineEvent {
  id: string;
  year: number;
  dateLabel?: string;
  era: string;
  title: string;
  summary: string;
  narrative?: string;
  isTurningPoint?: boolean;
  quote?: string;
  image?: MediaImage;
  relatedProjects?: string[];
  relatedExperiences?: string[];
  relatedAchievements?: string[];
}

/** ---------------- SKILLS ---------------- */

export type SkillCategory =
  | "technical"
  | "creative"
  | "leadership"
  | "communication"
  | "analytical";

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: SkillCategory;
  blurb: string;
  relatedProjects?: string[];
  relatedExperiences?: string[];
  relatedAchievements?: string[];
}

/** ---------------- INTERESTS ("What I Care About") ---------------- */

export interface Interest {
  id: string;
  title: string;
  category: string;
  note: string;
  relatedProjects?: string[];
  relatedExperiences?: string[];
}

/** ---------------- CURRENTLY ---------------- */

export type CurrentlyLabel =
  | "building"
  | "learning"
  | "reading"
  | "exploring"
  | "goal"
  | "challenge";

export interface CurrentlyItem {
  id: string;
  label: CurrentlyLabel;
  value: string;
  note?: string;
  updatedAt: string; // ISO date
  relatedProjects?: string[];
}

/** ---------------- WHAT'S NEXT ---------------- */

export type Horizon = "now" | "next" | "later" | "someday";

export interface FutureGoal {
  id: string;
  horizon: Horizon;
  title: string;
  description: string;
}

/** ---------------- LAB / IDEAS ---------------- */

export type LabStatus =
  | "idea"
  | "exploring"
  | "building"
  | "testing"
  | "paused"
  | "done";

export interface LabIdea {
  id: string;
  title: string;
  status: LabStatus;
  summary: string;
  year: number;
}

/** ---------------- PERSONAL DETAILS ---------------- */

export interface PersonalDetail {
  id: string;
  category: string;
  prompt: string;
  answer: string;
}

/** ---------------- SITE / IDENTITY CONFIG ---------------- */

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  bioShort: string;
  bioLong: string[];
  location: string;
  email: string;
  social: Links[];
  definingThings: string[];
  photo?: MediaImage;
  /** The one Easter egg: shown when the nav wordmark is held (desktop) or
   * triple-tapped (mobile). Change this whenever — it's just a string. */
  secretNote: string;
}
