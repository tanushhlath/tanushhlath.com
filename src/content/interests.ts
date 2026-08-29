import { Interest } from "@/types/content";

/**
 * WHAT I CARE ABOUT
 *
 * The human layer. Keep entries short — these open into a small card on
 * click, they're not mini-essays. `category` is a loose grouping label
 * (Curiosities / Values / Hobbies / Causes...), not a strict enum, so you
 * can introduce new categories freely.
 */
export const interests: Interest[] = [
  {
    id: "int-01",
    title: "Artificial Intelligence",
    category: "Curiosities",
    note: "I am interested in how AI can move beyond automation and become a practical tool for solving problems, creating products and expanding access to opportunities.",
    relatedProjects: ["proj-01"],
  },
  {
    id: "int-02",
    title: "Economics & Entrepreneurship",
    category: "Curiosities",
    note: "I enjoy understanding why people and businesses make decisions, how markets work, and how ideas can become sustainable ventures.",
    relatedProjects: ["proj-02"],
    relatedExperiences: ["exp-hack-01"],
  },
  {
    id: "int-03",
    title: "Horse Riding",
    category: "Hobbies",
    note: "It gives me a completely different environment from academics and technology, while constantly demanding focus, control and patience.",
    relatedExperiences: ["exp-school-12"],
  },
  {
    id: "int-04",
    title: "Theatre & Performing",
    category: "Hobbies",
    note: "I enjoy the energy of being on stage and the collaborative process of turning a script or idea into a performance.",
    relatedExperiences: ["exp-theatre-01"],
  },
  {
    id: "int-05",
    title: "Digital Opportunity & Education",
    category: "Causes",
    note: "I care about making education and useful technology more accessible, especially for people who may not otherwise have the skills or opportunities to benefit from them.",
    relatedProjects: ["proj-02"],
  },
  {
    id: "int-06",
    title: "Initiative",
    category: "Values",
    note: "I try not to wait for someone else to create an opportunity when I can start something myself.",
  },
  {
    id: "int-07",
    title: "Horse Riding",
    category: "Just for me",
    note: "Simply being in a riding arena is something I enjoy even when there is no competition, project or goal attached to it.",
    relatedExperiences: ["exp-school-12"],
  },
];
