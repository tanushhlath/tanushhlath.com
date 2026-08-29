import { CurrentlyItem } from "@/types/content";

/**
 * CURRENTLY
 *
 * The "this site is alive" section. Update `value` and `updatedAt`
 * regularly — the homepage and /now page both show `updatedAt` so stale
 * entries are visible as stale. Keep this list short (5-7 items); it's a
 * snapshot, not a log.
 */
export const currently: CurrentlyItem[] = [
  {
    id: "cur-01",
    label: "building",
    value: "Digital Skills & Opportunity Initiative",
    note: "I am working with my dad on a planned initiative for students from rural communities in Rajasthan. The first cohort is expected to be around 20 students, with practical training followed by internships and other opportunities.",
    updatedAt: "2026-08-27",
    relatedProjects: ["proj-02"],
  },
  {
    id: "cur-02",
    label: "learning",
    value: "Indian Computing Olympiad prep",
    note: "I am studying algorithms, computational thinking and advanced problem-solving to prepare for competitive computer science.",
    updatedAt: "2026-08-27",
  },
  {
    id: "cur-04",
    label: "exploring",
    value: "AI-assisted work and employability",
    note: "I am exploring how basic AI and digital tools can help people with limited technology experience become capable of doing useful, paid work.",
    updatedAt: "2026-08-27",
    relatedProjects: ["proj-02"],
  },
  {
    id: "cur-05",
    label: "goal",
    value: "Move my digital-skills initiative from planning into its first real cohort.",
    updatedAt: "2026-08-27",
    relatedProjects: ["proj-02"],
  },
  {
    id: "cur-06",
    label: "challenge",
    value: "Turning a good idea into a practical model",
    note: "The difficult part is not only teaching digital skills, but creating a realistic pathway from training to actual work, income and long-term employability.",
    updatedAt: "2026-08-27",
    relatedProjects: ["proj-02"],
  },
];
