import type { Interest } from "@/types/content";
import { paths } from "@/routing/paths";

/**
 * WHAT I CARE ABOUT (Me → #care-about)
 *
 * The human layer. Keep notes short — each one opens into a small card,
 * not an essay. `category` is a free-form group label (Curiosities,
 * Hobbies, Causes, Values, Just for me…); new groups appear automatically.
 *
 * `link` is the explicit "See more" destination — always a canonical
 * path from `paths.*` (or a full https:// URL). Horse riding always
 * points at the Inter-House Horse Riding event page.
 * `relatedProjects` / `relatedEvents` connect the interest to evidence.
 */
export const interests: Interest[] = [
  {
    id: "artificial-intelligence",
    title: "Artificial Intelligence",
    category: "Curiosities",
    note: "I am interested in how AI can move beyond automation and become a practical tool for solving problems, creating products and expanding access to opportunities.",
    link: { label: "See Wizmo", href: paths.workItem("wizmo") },
    relatedProjects: ["wizmo"],
  },
  {
    id: "economics-entrepreneurship",
    title: "Economics & Entrepreneurship",
    category: "Curiosities",
    note: "I enjoy understanding why people and businesses make decisions, how markets work, and how ideas can become sustainable ventures.",
    link: { label: "See the entrepreneurship work", href: paths.work("did", "entrepreneurship") },
    relatedProjects: ["digital-opportunity"],
    relatedEvents: [
      "innoventure",
      "bits-pilani-bootcamp",
      "masters-union-ai-hackathon",
      "masters-union-startup-league",
    ],
  },
  {
    id: "horse-riding",
    title: "Horse Riding",
    category: "Hobbies",
    note: "It gives me a completely different environment from academics and technology, while constantly demanding focus, control and patience.",
    link: { label: "See the horse-riding event", href: paths.workItem("inter-house-horse-riding") },
    relatedEvents: ["inter-house-horse-riding"],
  },
  {
    id: "theatre-performing",
    title: "Theatre & Performing",
    category: "Hobbies",
    note: "I enjoy the energy of being on stage and the collaborative process of turning a script or idea into a performance.",
    link: { label: "See TAS Productions", href: paths.workItem("tas-productions") },
    relatedEvents: ["tas-productions", "shistech-theatre"],
  },
  {
    id: "digital-opportunity-education",
    title: "Digital Opportunity & Education",
    category: "Causes",
    note: "I care about making education and useful technology more accessible, especially for people who may not otherwise have the skills or opportunities to benefit from them.",
    link: { label: "See the initiative", href: paths.workItem("digital-opportunity") },
    relatedProjects: ["digital-opportunity"],
    relatedEvents: ["digital-horizons"],
  },
  {
    id: "initiative",
    title: "Initiative",
    category: "Values",
    note: "I try not to wait for someone else to create an opportunity when I can start something myself.",
  },
  {
    id: "time-in-the-arena",
    title: "Time in the arena",
    category: "Just for me",
    note: "Simply being in a riding arena is something I enjoy even when there is no competition, project or goal attached to it.",
    link: { label: "See the horse-riding event", href: paths.workItem("inter-house-horse-riding") },
    relatedEvents: ["inter-house-horse-riding"],
  },
];
