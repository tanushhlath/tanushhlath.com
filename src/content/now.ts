import type { NowItem } from "@/types/content";

/**
 * NOW (Beyond → Now, and the "Right now" snapshot on Home)
 *
 * The "this site is alive" list. Update `value`, `note` and `updatedAt`
 * (ISO date, YYYY-MM-DD) whenever something changes — the date is shown,
 * so stale entries look stale. Keep it to roughly 4–7 items: a snapshot,
 * not a log. The first three appear on the homepage.
 *
 * `label` is one of: building, learning, reading, exploring, goal,
 * challenge (words shown for each live in `taxonomy.ts` → nowLabels).
 */
export const now: NowItem[] = [
  {
    id: "building-digital-opportunity",
    label: "building",
    value: "Digital Skills & Opportunity Initiative",
    note: "I am working with my dad on a planned initiative for students from rural communities in Rajasthan. The first cohort is expected to be around 20 students, with practical training followed by internships and other opportunities.",
    updatedAt: "2026-08-27",
    relatedProjects: ["digital-opportunity"],
  },
  {
    id: "learning-computing-olympiad",
    label: "learning",
    value: "Indian Computing Olympiad prep",
    note: "I am studying algorithms, computational thinking and advanced problem-solving to prepare for competitive computer science.",
    updatedAt: "2026-08-27",
  },
  {
    id: "exploring-ai-employability",
    label: "exploring",
    value: "AI-assisted work and employability",
    note: "I am exploring how basic AI and digital tools can help people with limited technology experience become capable of doing useful, paid work.",
    updatedAt: "2026-08-27",
    relatedProjects: ["digital-opportunity"],
  },
  {
    id: "goal-first-cohort",
    label: "goal",
    value: "Move my digital-skills initiative from planning into its first real cohort.",
    updatedAt: "2026-08-27",
    relatedProjects: ["digital-opportunity"],
  },
  {
    id: "challenge-practical-model",
    label: "challenge",
    value: "Turning a good idea into a practical model",
    note: "The difficult part is not only teaching digital skills, but creating a realistic pathway from training to actual work, income and long-term employability.",
    updatedAt: "2026-08-27",
    relatedProjects: ["digital-opportunity"],
  },
];
