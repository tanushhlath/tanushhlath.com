import type {
  EventCategory,
  EventType,
  Horizon,
  Importance,
  LabStatus,
  NowLabel,
  ProjectCategory,
  ProjectStatus,
  RecognitionCategory,
  SkillCategory,
} from "@/types/content";

/**
 * LABELS
 *
 * Every category, type and status id used in the content files, with the
 * words the site shows for it. Records store the short id (e.g.
 * `category: "sports"`); the UI looks the label up here, so renaming a
 * filter or a status is a one-line change.
 *
 * The order of keys in each list is the order filters and groups appear
 * in. Filters with no matching records are hidden automatically.
 */
export interface TaxonomyLabel {
  label: string;
  /** Compact form for tight spaces (chips, card corners). */
  short?: string;
  description?: string;
}

/** Built lens filters. */
export const projectCategories: Record<ProjectCategory, TaxonomyLabel> = {
  ai: {
    label: "AI / Conversational Technology",
    short: "AI",
    description: "Things that put artificial intelligence to practical use.",
  },
  "social-impact": {
    label: "Social Impact / Digital Opportunity",
    short: "Social impact",
    description: "Projects aimed at widening access to skills, education and opportunity.",
  },
  web: {
    label: "Web Development",
    short: "Web",
    description: "Websites and digital experiences.",
  },
  research: {
    label: "Research / School Project",
    short: "Research",
    description: "Independent academic exploration and school research projects.",
  },
  product: {
    label: "Entrepreneurship / Product",
    short: "Product",
    description: "Ventures and product ideas taken beyond the pitch.",
  },
};

/** Did lens filters (one per event). */
export const eventCategories: Record<EventCategory, TaxonomyLabel> = {
  entrepreneurship: {
    label: "Entrepreneurship & Innovation",
    short: "Entrepreneurship",
    description: "Startup and innovation competitions, bootcamps, hackathons and career exploration.",
  },
  leadership: {
    label: "Leadership & Student Governance",
    short: "Leadership",
    description: "Core teams, councils, ambassador roles, mentoring and volunteering.",
  },
  academic: {
    label: "Academic & Intellectual",
    short: "Academic",
    description: "Academic competitions, assessments and academic workshops.",
  },
  global: {
    label: "Global Affairs & Cultural Exchange",
    short: "Global",
    description: "MUNs, Round Square and cultural exchange programmes.",
  },
  communication: {
    label: "Communication & Media",
    short: "Communication",
    description: "Emceeing, public speaking, reporting and podcasts.",
  },
  writing: {
    label: "Literature & Writing",
    short: "Writing",
    description: "Essay competitions, reading programmes and book discussions.",
  },
  arts: {
    label: "Arts & Performing Arts",
    short: "Arts",
    description: "Theatre, music and stage productions.",
  },
  sports: {
    label: "Equestrian & Sports",
    short: "Sports",
    description: "Horse riding shows and competitions, and inter-house sport.",
  },
  school: {
    label: "School & Community",
    short: "School",
    description: "School events, community engagement and operations.",
  },
};

/** Recognized lens filters. */
export const recognitionCategories: Record<RecognitionCategory, TaxonomyLabel> = {
  entrepreneurship: {
    label: "Entrepreneurship / Innovation",
    short: "Entrepreneurship",
  },
  academic: {
    label: "Academic",
    short: "Academic",
  },
  arts: {
    label: "Arts / Performing",
    short: "Arts",
  },
  sports: {
    label: "Equestrian / Sports",
    short: "Sports",
  },
  other: {
    label: "Other Awards & Recognition",
    short: "Other",
  },
};

/** What kind of thing an event was — shown as a small label on cards. */
export const eventTypes: Record<EventType, TaxonomyLabel> = {
  competition: { label: "Competition" },
  workshop: { label: "Workshop" },
  programme: { label: "Programme" },
  role: { label: "Role" },
  performance: { label: "Performance" },
  conference: { label: "Conference" },
  event: { label: "Event" },
  assessment: { label: "Assessment" },
  award: { label: "Award" },
  service: { label: "Service" },
};

export const projectStatusLabels: Record<ProjectStatus, TaxonomyLabel> = {
  concept: { label: "Concept", description: "Being planned; not built yet." },
  "in-progress": { label: "In progress", description: "Actively being worked on." },
  shipped: { label: "Shipped", description: "Built and put in front of real people." },
  completed: { label: "Completed", description: "Finished." },
  paused: { label: "Paused", description: "On hold for now." },
  archived: { label: "Archived", description: "No longer active." },
};

/** Visual weight of a project/event. Controls layout, never visibility. */
export const importanceLabels: Record<Importance, TaxonomyLabel> = {
  featured: {
    label: "Featured",
    description: "The strongest stories — given the most space and the richest media.",
  },
  significant: {
    label: "Significant",
    description: "Important work with a full card and detail page.",
  },
  archive: {
    label: "Archive",
    short: "Along the way",
    description: "Smaller experiences, shown compactly.",
  },
};

/** The four horizons on Beyond → Next. */
export const horizonLabels: Record<Horizon, TaxonomyLabel> = {
  now: { label: "Now", description: "Actively in motion" },
  next: { label: "Next", description: "Right after this" },
  later: { label: "Later", description: "On the roadmap" },
  someday: { label: "Someday", description: "Unscheduled, but real" },
};

/** Status chips on Beyond → Lab. */
export const labStatusLabels: Record<LabStatus, TaxonomyLabel> = {
  idea: { label: "Idea", description: "Just a thought, for now." },
  exploring: { label: "Exploring", description: "Reading, asking and testing the idea." },
  building: { label: "Building", description: "Actively being made." },
  testing: { label: "Testing", description: "Built enough to try on real people." },
  paused: { label: "Paused", description: "Set aside, not forgotten." },
  done: { label: "Done", description: "Finished — or finished teaching me what it could." },
};

/**
 * Labels for Beyond → Now items. `label` is the short form used on the
 * Now board; `lead` is the sentence form used on the homepage snapshot.
 */
export interface NowLabelCopy extends TaxonomyLabel {
  lead: string;
}

export const nowLabels: Record<NowLabel, NowLabelCopy> = {
  building: { label: "Building", lead: "Currently building" },
  learning: { label: "Learning", lead: "Currently learning" },
  reading: { label: "Reading", lead: "Currently reading" },
  exploring: { label: "Exploring", lead: "Currently exploring" },
  goal: { label: "Aiming for", lead: "Currently aiming for" },
  challenge: { label: "Wrestling with", lead: "Currently wrestling with" },
};

/** Skill groupings on Me → Skills. */
export const skillCategories: Record<SkillCategory, TaxonomyLabel> = {
  technical: { label: "Technical" },
  creative: { label: "Creative" },
  leadership: { label: "Leadership" },
  communication: { label: "Communication" },
  analytical: { label: "Analytical" },
};
