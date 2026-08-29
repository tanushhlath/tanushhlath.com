import { FutureGoal } from "@/types/content";

/**
 * WHAT'S NEXT
 *
 * Grouped by horizon rather than date, since ambitions don't have deadlines
 * the way projects do. now = actively working toward. next = the next
 * thing in line. later = on the roadmap. someday = the big, unscheduled ones.
 */
export const futureGoals: FutureGoal[] = [
  {
    id: "fut-01",
    horizon: "now",
    title: "Launch the first cohort of my digital-skills and opportunity initiative",
    description: "Learn from how it works in practice.",
  },
  {
    id: "fut-02",
    horizon: "next",
    title: "Prepare seriously for the Indian Computing Olympiad",
    description: "Strengthen my algorithms, programming and computational-thinking abilities.",
  },
  {
    id: "fut-03",
    horizon: "next",
    title: "Keep competing in AI, computing, entrepreneurship and innovation events",
    description: "Continue participating in these competitions to test myself in different environments.",
  },
  {
    id: "fut-04",
    horizon: "later",
    title: "Start a startup focused on artificial intelligence",
    description: "Identify a problem worth solving seriously.",
  },
  {
    id: "fut-05",
    horizon: "someday",
    title: "Build that startup into a substantial company",
    description: "Create real value and give myself the freedom to pursue ambitious ideas.",
  },
  {
    id: "fut-06",
    horizon: "someday",
    title: "Use technology and entrepreneurship to create meaningful opportunities for others",
    description: "While building a life I genuinely enjoy.",
  },
];
