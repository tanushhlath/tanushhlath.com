import { Skill } from "@/types/content";

/**
 * SKILLS
 *
 * No percentages, no proficiency bars — a skill is only as real as the
 * evidence behind it. `relatedProjects` / `relatedExperiences` /
 * `relatedAchievements` are what populate the "proof" list on /skills.
 * A skill with nothing linked will still render, just with no evidence —
 * that's a signal to either link something or remove it.
 */
export const skills: Skill[] = [
  {
    id: "skill-leadership",
    slug: "leadership",
    name: "Leadership",
    category: "leadership",
    blurb:
      "I lead by taking ownership, communicating clearly and making sure ideas move from discussion into action. I am strongest when I can combine people, planning and execution.",
    relatedExperiences: ["exp-lead-01", "exp-school-03"],
    relatedProjects: ["proj-02"],
  },
  {
    id: "skill-product",
    slug: "product-thinking",
    name: "Product Thinking",
    category: "analytical",
    blurb:
      "I like starting with the problem and thinking about what would actually be useful to the person using the solution, rather than building for the sake of building.",
    relatedProjects: ["proj-01"],
    relatedExperiences: ["exp-hack-01"],
    relatedAchievements: ["ach-03"],
  },
  {
    id: "skill-frontend",
    slug: "frontend-development",
    name: "Frontend Development",
    category: "technical",
    blurb:
      "I can work with web development at a practical level and enjoy understanding how digital experiences are put together, while continuing to develop deeper technical ability.",
    relatedProjects: ["proj-01", "proj-03"],
  },
  {
    id: "skill-writing",
    slug: "writing",
    name: "Writing",
    category: "creative",
    blurb:
      "I use writing to organise ideas, explain concepts and communicate clearly, although speaking and presenting are currently stronger areas for me.",
    relatedProjects: ["proj-04"],
    relatedExperiences: ["exp-media-01"],
  },
  {
    id: "skill-design",
    slug: "design",
    name: "Design",
    category: "creative",
    blurb:
      "I approach design from the perspective of clarity and communication, especially when creating presentations, brochures and materials intended for other people to use.",
    relatedProjects: ["proj-03"],
    relatedExperiences: ["exp-school-04"],
  },
  {
    id: "skill-communication",
    slug: "communication",
    name: "Public Communication",
    category: "communication",
    blurb:
      "Public communication is one of my strengths. I have experience with emceeing, speaking, theatre, workshops, student reporting and presenting ideas to different audiences.",
    relatedExperiences: ["exp-theatre-01", "exp-speak-01", "exp-workshop-01", "exp-school-02"],
    relatedAchievements: ["ach-05", "ach-06"],
  },
  {
    id: "skill-systems-thinking",
    slug: "systems-thinking",
    name: "Systems Thinking",
    category: "analytical",
    blurb:
      "I like breaking larger problems into smaller parts, especially when working on projects that involve people, technology, processes and practical constraints.",
    relatedProjects: ["proj-01", "proj-02", "proj-04"],
    relatedAchievements: ["ach-07"],
  },
];
