/**
 * CONTENT SCHEMAS
 *
 * Every piece of content on the site is a typed record in `src/content/`.
 * The UI never hard-codes content — it reads these records through the
 * query functions in `src/lib/content.ts`, so one record shows up
 * everywhere it belongs (Work, Archive, Explore, Skills, Story…) without
 * being copied.
 *
 * IDs: every record's `id` is also its URL slug (lowercase-kebab-case).
 * Relationship fields (`relatedSkills`, `relatedEvents`, …) always hold
 * these ids — never titles, never array positions.
 *
 * See EDITING_GUIDE.md for how to add/edit/remove content.
 */

/** Visual importance. Controls layout weight, not visibility. */
export type Importance = "featured" | "significant" | "archive";

export interface ExternalLink {
  label: string;
  /** Absolute URL (https://…) or mailto:. Internal links use `href` fields. */
  url: string;
}

/* ------------------------------------------------------------------ */
/* MEDIA                                                               */
/* ------------------------------------------------------------------ */

/**
 * Media lives in `public/media/<collection>/<id>/` (e.g.
 * `public/media/events/innoventure/1.png`). Files are auto-discovered at
 * build time (`scripts/media-manifest.mjs` → `src/content/generated/`),
 * ordered numerically (1.png, 2.png, 3.png…). A record only needs a
 * `media` field to override that: reorder, add captions/alt text, hide a
 * file, force a layout, or pick a cover.
 */
export interface MediaImageOverride {
  /** Filename inside the record's media folder, e.g. "2.png". */
  file: string;
  alt?: string;
  caption?: string;
  /** CSS object-position for crops, e.g. "50% 30%". */
  focus?: string;
}

export interface MediaVideoOverride {
  file: string;
  caption?: string;
  /** Optional poster image filename from the same folder. */
  poster?: string;
}

export type MediaLayout =
  | "auto"
  | "hero"
  | "split"
  | "mosaic"
  | "filmstrip"
  | "stack"
  | "stage";

export interface MediaConfig {
  /**
   * Order/captions/alt text/crop for specific images. Listed files come
   * first, in this order; every other image in the folder follows in
   * folder order (use `hide` to drop one). Omit to use folder order.
   */
  images?: MediaImageOverride[];
  /** Order/captions for specific videos (same rules as `images`). */
  videos?: MediaVideoOverride[];
  /** Caption applied to every video that doesn't have its own. */
  videoCaption?: string;
  /** Files in the folder to ignore entirely. */
  hide?: string[];
  /** Filename to use as the card/cover image (defaults to the first image). */
  cover?: string;
  layout?: MediaLayout;
}

/** A fully-resolved image, ready to render (produced by lib/content.ts). */
export interface ResolvedImage {
  src: string; // web path, e.g. "/media/events/innoventure/1.png"
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  focus?: string;
}

export interface ResolvedVideo {
  src: string;
  caption?: string;
  poster?: string;
  width?: number;
  height?: number;
}

export interface ResolvedMedia {
  images: ResolvedImage[];
  videos: ResolvedVideo[];
  cover?: ResolvedImage;
  layout: Exclude<MediaLayout, "auto">;
}

/**
 * Shape of `src/content/generated/media-manifest.json`, written by
 * `scripts/media-manifest.mjs` from the files in `public/media/`.
 * Never edit the JSON by hand — it is regenerated on every dev/build.
 */
export interface MediaManifestFile {
  file: string;
  kind: "image" | "video";
  width?: number;
  height?: number;
  /**
   * Responsive copies of an image, smallest first (written by the build
   * into the folder's `_w/`; see scripts/lib/media-variants.mjs). Absent
   * when none could be made — the original is then used everywhere.
   */
  variants?: MediaVariant[];
}

/** A smaller (or re-encoded) copy of an image, made at build time. */
export interface MediaVariant {
  /** Pixel width; the height follows the image's own aspect ratio. */
  width: number;
  /** Path relative to the image's folder, e.g. "_w/3-320.1a2b3c4d.jpg". */
  file: string;
}

export interface MediaManifest {
  /** Keyed by event id (= folder name in public/media/events/). */
  events: Record<string, MediaManifestFile[]>;
  /** Keyed by project id (= folder name in public/media/projects/). */
  projects: Record<string, MediaManifestFile[]>;
  /** Site images outside public/media (the profile photo), keyed by folder relative to public/: "images/profile". */
  site?: Record<string, MediaManifestFile[]>;
}

/**
 * What the build knows about one image, looked up by its web path
 * (`getImageInfo(src)` in lib/content.ts) — <ProtectedImage> uses it to
 * offer the browser the responsive copies through srcset.
 */
export interface ImageInfo {
  width?: number;
  height?: number;
  /** Responsive copies as web paths, smallest first: [{ src: "/media/…/_w/3-320.1a2b3c4d.jpg", width: 320 }]. */
  variants: readonly { src: string; width: number }[];
}

/* ------------------------------------------------------------------ */
/* CONTENT BLOCKS — structured sections you can add without code       */
/* ------------------------------------------------------------------ */

export type Block =
  | { type: "heading"; text: string; kicker?: string }
  | { type: "text"; text: string; lead?: boolean }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "gallery"; images: { src: string; alt: string; caption?: string }[] }
  | { type: "video"; src: string; caption?: string; poster?: string }
  | { type: "cards"; cards: { title: string; text: string; href?: string }[] }
  | { type: "timeline"; items: { label: string; title: string; text?: string }[] }
  | { type: "stat"; stats: { value: string; label: string }[] }
  | { type: "callout"; title?: string; text: string; tone?: "accent" | "warm" | "quiet" }
  | { type: "link"; label: string; href: string; description?: string }
  | { type: "embed"; url: string; title: string; aspect?: string };

/* ------------------------------------------------------------------ */
/* WORK: PROJECTS ("Built")                                            */
/* ------------------------------------------------------------------ */

export type ProjectStatus =
  | "concept"
  | "in-progress"
  | "shipped"
  | "completed"
  | "paused"
  | "archived";

/** Filter categories for the Built lens. */
export type ProjectCategory =
  | "ai"
  | "social-impact"
  | "web"
  | "research"
  | "product";

export interface Project {
  id: string;
  title: string;
  /** Optional shorter title for the browser tab / search results (when `title` is long). */
  seoTitle?: string;
  year: number;
  dateLabel?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  importance: Importance;
  summary: string;
  problem?: string;
  motivation?: string;
  concept?: string;
  role?: string;
  process?: string[];
  challenges?: string;
  outcome?: string;
  impact?: string;
  lessons?: string;
  tools?: string[];
  links?: ExternalLink[];
  media?: MediaConfig;
  /** Optional extra sections rendered at the end of the detail page. */
  body?: Block[];
  relatedSkills?: string[];
  relatedEvents?: string[];
  relatedStory?: string[];
  /** Old slugs that should redirect to this record's page. */
  aliases?: string[];
  /** Private note for yourself — never rendered. */
  detailsToAdd?: string;
}

/* ------------------------------------------------------------------ */
/* WORK: EVENTS ("Did") + RECOGNITION ("Recognized")                   */
/* ------------------------------------------------------------------ */

/** Filter categories for the Did lens (one per event). */
export type EventCategory =
  | "entrepreneurship"
  | "leadership"
  | "academic"
  | "global"
  | "communication"
  | "writing"
  | "arts"
  | "sports"
  | "school";

export type EventType =
  | "competition"
  | "workshop"
  | "programme"
  | "role"
  | "performance"
  | "conference"
  | "event"
  | "assessment"
  | "award"
  | "service";

/** Filter categories for the Recognized lens. */
export type RecognitionCategory =
  | "entrepreneurship"
  | "academic"
  | "arts"
  | "sports"
  | "other";

/**
 * A result attached to an event. The event is the one canonical record;
 * the Recognized lens is generated from every event that has one of these.
 */
export interface Recognition {
  /** Big typographic outcome, e.g. "1st Runner-Up", "4 Gold Medals". */
  result: string;
  /** Optional one-line context under the result. */
  detail?: string;
  category: RecognitionCategory;
  /** "major" gets the large treatment in the Recognized lens. */
  level: "major" | "minor";
  /** Defaults to the event's year. */
  year?: number;
}

export interface WorkEvent {
  id: string;
  title: string;
  /** Optional shorter title for the browser tab / search results (when `title` is long). */
  seoTitle?: string;
  organization?: string;
  /** Primary year used for sorting. Omit only if genuinely unknown. */
  year?: number;
  /** Shown instead of `year` when set, e.g. "2023 & 2024". */
  dateLabel?: string;
  category: EventCategory;
  type: EventType;
  importance: Importance;
  /** One line. Used on cards and in lists. */
  summary: string;
  /** What it was — what the event/programme actually involved. */
  description?: string;
  /** Your role, as known. */
  role?: string;
  /** What you did — only documented actions. */
  actions?: string[];
  /** What you learned. */
  learning?: string;
  /** Why it mattered. */
  whyItMattered?: string;
  /** Non-award outcome: certificate, completion, selection… */
  outcome?: string;
  recognition?: Recognition;
  links?: ExternalLink[];
  media?: MediaConfig;
  body?: Block[];
  relatedSkills?: string[];
  relatedProjects?: string[];
  relatedEvents?: string[];
  relatedStory?: string[];
  aliases?: string[];
  /** Private note for yourself — never rendered. */
  detailsToAdd?: string;
}

/* ------------------------------------------------------------------ */
/* STORY                                                               */
/* ------------------------------------------------------------------ */

export interface StoryMoment {
  /** Also the anchor: /story/#<id> */
  id: string;
  year: number;
  dateLabel?: string;
  /** Chapter name; consecutive moments with the same era form a chapter. */
  era: string;
  title: string;
  summary: string;
  narrative?: string;
  isTurningPoint?: boolean;
  quote?: string;
  /** Event whose photos illustrate this moment (first image is used). */
  mediaFrom?: string;
  relatedProjects?: string[];
  relatedEvents?: string[];
}

/* ------------------------------------------------------------------ */
/* SKILLS                                                              */
/* ------------------------------------------------------------------ */

export type SkillCategory =
  | "technical"
  | "creative"
  | "leadership"
  | "communication"
  | "analytical";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  blurb: string;
  relatedProjects?: string[];
  relatedEvents?: string[];
  relatedStory?: string[];
}

/* ------------------------------------------------------------------ */
/* ME                                                                  */
/* ------------------------------------------------------------------ */

export interface Interest {
  id: string;
  title: string;
  category: string;
  note: string;
  /** Explicit destination for "See more". Always a canonical path. */
  link?: { label: string; href: string };
  relatedProjects?: string[];
  relatedEvents?: string[];
}

export interface PersonalDetail {
  id: string;
  category: string;
  prompt: string;
  answer: string;
  /** Hidden until the visitor clicks "Reveal". */
  hidden?: boolean;
  /** Optional link, e.g. an external "Play Slope 3D ↗". */
  link?: { label: string; href: string; external?: boolean };
  /** Visual hint for the card, purely cosmetic. */
  accent?: "number" | "game" | "place" | "music" | "default";
}

/* ------------------------------------------------------------------ */
/* BEYOND                                                              */
/* ------------------------------------------------------------------ */

export type NowLabel =
  | "building"
  | "learning"
  | "reading"
  | "exploring"
  | "goal"
  | "challenge";

export interface NowItem {
  id: string;
  label: NowLabel;
  value: string;
  note?: string;
  updatedAt: string; // ISO date, e.g. "2026-09-26"
  relatedProjects?: string[];
  relatedEvents?: string[];
}

export type Horizon = "now" | "next" | "later" | "someday";

export interface FutureGoal {
  id: string;
  horizon: Horizon;
  title: string;
  description: string;
}

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
  /** Optional link to the related project/event page. */
  href?: string;
}

/* ------------------------------------------------------------------ */
/* SITE CONFIG                                                         */
/* ------------------------------------------------------------------ */

export interface SiteConfig {
  name: string;
  shortName: string;
  url: string; // canonical origin, no trailing slash
  tagline: string;
  /** Tiny label above the name on the homepage hero. */
  heroKicker: string;
  bioShort: string;
  bioLong: string[];
  school: string;
  location: {
    short: string; // e.g. "Born & brought up in Dubai, UAE · Schooling in Jaipur, India"
    long: string; // full sentence for the Me page
    home: string; // "Dubai, UAE"
    school: string; // "Jaipur, India"
  };
  email: string;
  social: ExternalLink[];
  photo: { src: string; alt: string; small?: string };
  /** One-line footer sentence under the name. */
  footerLine: string;
  /** The deliberately tiny footer hint for the Easter egg. */
  easterEggHint: string;
}

export interface EasterEggConfig {
  title: string;
  subtitle: string;
  /** The hint the visitor can reveal. The password itself is NOT here. */
  hint: string;
  /** Shown after a wrong password while the hint is still hidden. */
  wrongPassword: string;
  /** Shown after a wrong password once the hint is revealed (falls back to `wrongPassword`). */
  wrongPasswordWithHint?: string;
  /** Where the link under the video goes. */
  afterLink: { label: string; href: string };
  /** Caption shown under the video. */
  caption?: string;
  /** Optional short personal line shown after the video, near `afterLink`. */
  signoff?: string;
}

export interface MenuItem {
  href: string;
  label: string;
  description: string;
}

export interface NavigationConfig {
  home: MenuItem;
  primary: MenuItem[]; // Story, Work, Me, Beyond (numbered 01–04)
  secondary: MenuItem[]; // Archive, Explore
}

/** Every page with its own copy in `src/content/pages.ts`. */
export type PageKey =
  | "home"
  | "story"
  | "work"
  | "me"
  | "beyond"
  | "archive"
  | "explore"
  | "notFound";

/** The five Explore lenses (also the /explore/#<lens> fragment). */
export type ExploreLensKey = "built" | "grown" | "tried" | "care" | "proud";

/** A labelled internal (paths.*) or external link used in page copy. */
export interface CopyLink {
  label: string;
  href: string;
}

export interface PageCopy {
  /** Short page name. The full <title> is "<title> — <site name>" (Home: name — tagline). */
  title: string;
  /** Meta description (≤ 160 characters). */
  description: string;
  kicker?: string;
  heading?: string;
  intro?: string;
  /** Extra sections appended to the page, built from blocks. */
  sections?: Block[];
}
