import type { LabIdea } from "@/types/content";
import { paths } from "@/routing/paths";

/**
 * LAB (Beyond → Lab) — "Half-formed ideas, on purpose"
 *
 * Unfinished, half-formed or speculative — deliberately looser than the
 * projects. Update `status` as things move (idea, exploring, building,
 * testing, paused, done). `href` optionally links to the related page,
 * always via `paths.*`.
 */
export const labIdeas: LabIdea[] = [
  {
    id: "ai-employability-tools",
    title: "AI-powered tools for employability",
    status: "exploring",
    summary:
      "Exploring how AI can help people with basic digital knowledge perform useful entry-level work more effectively.",
    year: 2026,
    href: paths.workItem("digital-opportunity"),
  },
  {
    id: "digital-skills-initiative",
    title: "Digital Skills & Opportunity Initiative",
    status: "building",
    summary: "A planned programme to recruit, train and connect rural students with real work opportunities.",
    year: 2026,
    href: paths.workItem("digital-opportunity"),
  },
  {
    id: "ai-startup",
    title: "AI Startup",
    status: "idea",
    summary: "An eventual AI-focused startup built around a problem worth solving at meaningful scale.",
    year: 2026,
  },
  {
    id: "wizmo-experiment",
    title: "Wizmo",
    status: "done",
    summary:
      "A completed experiment in applying conversational AI to a real school information problem. It went from idea through development and testing, then was discontinued.",
    year: 2025,
    href: paths.workItem("wizmo"),
  },
  {
    id: "eco-friendly-products",
    title: "Eco-Friendly Products Business",
    status: "paused",
    summary:
      "An early entrepreneurship idea that began with my first pitch deck in 2022 but was not developed into a long-term venture.",
    year: 2022,
    href: paths.story("first-pitch"),
  },
];
