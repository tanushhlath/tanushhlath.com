import type { Skill } from "@/types/content";

/**
 * SKILLS — "Proof, not percentages"
 *
 * No percentages, no proficiency bars: a skill is only as real as the
 * evidence behind it. The proof list for each skill is built from BOTH
 *   - the ids listed here (`relatedProjects` / `relatedEvents` /
 *     `relatedStory`), and
 *   - every project or event whose own `relatedSkills` includes this id,
 * so you can connect evidence from either side. Events that carry a
 * recognition show up as recognitions automatically.
 *
 * `id` is referenced from other files — rename it everywhere if you
 * change it. `category` is one of the groups in `taxonomy.ts`.
 */
export const skills: Skill[] = [
  {
    id: "leadership",
    name: "Leadership",
    category: "leadership",
    blurb:
      "I lead by taking ownership, communicating clearly and making sure ideas move from discussion into action. I am strongest when I can combine people, planning and execution.",
    relatedProjects: ["digital-opportunity"],
    relatedEvents: ["flair-fest-core", "youth-ambassador"],
    relatedStory: ["taking-responsibility"],
  },
  {
    id: "product-thinking",
    name: "Product Thinking",
    category: "analytical",
    blurb:
      "I like starting with the problem and thinking about what would actually be useful to the person using the solution, rather than building for the sake of building.",
    relatedProjects: ["wizmo"],
    relatedEvents: [
      "masters-union-ai-hackathon",
      "innoventure",
      "bits-pilani-bootcamp",
      "masters-union-startup-league",
    ],
    relatedStory: ["building-with-ai"],
  },
  {
    id: "frontend-development",
    name: "Frontend Development",
    category: "technical",
    blurb:
      "I can work with web development at a practical level and enjoy understanding how digital experiences are put together, while continuing to develop deeper technical ability.",
    relatedProjects: ["wizmo", "ib-league-website"],
  },
  {
    id: "writing",
    name: "Writing",
    category: "creative",
    blurb:
      "I use writing to organise ideas, explain concepts and communicate clearly, although speaking and presenting are currently stronger areas for me.",
    relatedProjects: ["passion-project-research"],
    relatedEvents: ["school-news"],
  },
  {
    id: "design",
    name: "Design",
    category: "creative",
    blurb:
      "I approach design from the perspective of clarity and communication, especially when creating presentations, brochures and materials intended for other people to use.",
    relatedProjects: ["ib-league-website"],
    relatedEvents: ["inspireability-design-tech"],
  },
  {
    id: "public-communication",
    name: "Public Communication",
    category: "communication",
    blurb:
      "Public communication is one of my strengths. I have experience with emceeing, speaking, theatre, workshops, student reporting and presenting ideas to different audiences.",
    relatedEvents: [
      "tas-productions",
      "public-speaking",
      "inspireability-speaking",
      "pbl-emcee",
      "shistech-theatre",
      "world-scholars-cup",
    ],
    relatedStory: ["taking-the-stage"],
  },
  {
    id: "systems-thinking",
    name: "Systems Thinking",
    category: "analytical",
    blurb:
      "I like breaking larger problems into smaller parts, especially when working on projects that involve people, technology, processes and practical constraints.",
    relatedProjects: ["wizmo", "digital-opportunity", "passion-project-research"],
    relatedEvents: ["camp-yellow-mathematics"],
  },
];
