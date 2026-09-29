import type { FutureGoal } from "@/types/content";

/**
 * NEXT (Beyond → Next)
 *
 * Grouped by horizon rather than date, since ambitions don't have
 * deadlines the way projects do:
 *   now     → actively working toward it
 *   next    → the next thing in line
 *   later   → on the roadmap
 *   someday → the big, unscheduled ones
 */
export const futureGoals: FutureGoal[] = [
  {
    id: "launch-first-cohort",
    horizon: "now",
    title: "Launch the first cohort of my digital-skills and opportunity initiative",
    description: "Learn from how it works in practice.",
  },
  {
    id: "computing-olympiad",
    horizon: "next",
    title: "Prepare seriously for the Indian Computing Olympiad",
    description: "Strengthen my algorithms, programming and computational-thinking abilities.",
  },
  {
    id: "keep-competing",
    horizon: "next",
    title: "Keep competing in AI, computing, entrepreneurship and innovation events",
    description: "Continue participating in these competitions to test myself in different environments.",
  },
  {
    id: "start-ai-startup",
    horizon: "later",
    title: "Start a startup focused on artificial intelligence",
    description: "Identify a problem worth solving seriously.",
  },
  {
    id: "build-substantial-company",
    horizon: "someday",
    title: "Build that startup into a substantial company",
    description: "Create real value and give myself the freedom to pursue ambitious ideas.",
  },
  {
    id: "create-opportunities",
    horizon: "someday",
    title: "Use technology and entrepreneurship to create meaningful opportunities for others",
    description: "While building a life I genuinely enjoy.",
  },
];
