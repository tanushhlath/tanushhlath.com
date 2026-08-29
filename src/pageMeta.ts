/**
 * One source of truth for every static route's <title>/<meta description>.
 * Read by each page component (via <Meta/>, for client-side navigation)
 * AND by scripts/prerender.mjs (to bake the same values into each route's
 * static HTML at build time). Keep this in sync when a route's copy
 * changes — don't duplicate the strings elsewhere.
 */
export const pageMeta = {
  story: {
    title: "My Story",
    description: "How I got here — the stages, turning points, and moments that shaped who I am.",
  },
  work: {
    title: "Work",
    description:
      "What I've built, where I've shown up, and what it's earned — one place instead of three.",
  },
  me: {
    title: "Me",
    description:
      "I'm a Grade 11 student interested in AI, computer science, entrepreneurship, and ideas that can create real-world impact. I spend my time building projects, taking on leadership opportunities, competing, and exploring what technology can do for people.",
  },
  beyond: {
    title: "Beyond",
    description: "What's happening now, where I'm headed next, and the half-formed ideas in between.",
  },
  archive: {
    title: "Archive",
    description:
      "Everything, organized — every project, experience, achievement, and story moment in one filterable list.",
  },
  explore: {
    title: "Explore",
    description:
      "Pick a lens and let the site assemble what's relevant from across everything — or skip the choice entirely.",
  },
  notFound: {
    title: "Not found",
    description: "Nothing here — but there's plenty everywhere else.",
  },
} as const;
