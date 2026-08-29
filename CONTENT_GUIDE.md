# Content Guide

Everything on this site lives as plain data in `src/content/`. You never need
to touch a component or a page file to update what's shown — add, edit, or
remove an entry in the right file and it appears (or disappears) everywhere
it's supposed to, automatically.

Each file is regular TypeScript, so your editor will underline mistakes
(a missing field, a typo'd status value) before you ever load the page.

## The golden rule: one fact, one place

If you write the full story of a project in `projects.ts`, do not re-type
that story in `achievements.ts`. Instead, link them:

- `achievements.ts` → `relatedProjects: ["proj-01"]`
- `experiences.ts` → `relatedAchievements: ["ach-01"]`
- `skills.ts` → `relatedProjects`, `relatedExperiences`, `relatedAchievements`
- `timeline.ts` → `relatedProjects`, `relatedExperiences`, `relatedAchievements`

The `id` you give something in its home file (e.g. `id: "proj-01"` in
`projects.ts`) is what every other file uses to point back to it. Pages
resolve these links automatically via `src/lib/content.ts` — you'll see
"Related projects," "Skills demonstrated," etc. show up wherever they're
relevant, with zero extra work.

---

## Add a project ("What I Build")

Open `src/content/projects.ts` and add an object to the `projects` array:

```ts
{
  id: "proj-08",              // unique, used for linking from other files
  slug: "my-new-thing",       // used in the URL: /build/my-new-thing
  title: "My New Thing",
  year: 2026,
  category: "Web App",
  status: "shipped",          // "concept" | "in-progress" | "shipped" | "paused" | "archived"
  tier: "featured",           // "featured" | "significant" | "archive" — see below
  themes: ["building"],       // any of: building, leading, creating, competing, exploring
  summary: "One line a stranger understands in 5 seconds.",
  // everything below is optional — only fill in what's true
  problem: "...",
  motivation: "...",
  concept: "...",
  role: "...",
  process: ["Step one", "Step two"],
  challenges: "...",
  outcome: "...",
  impact: "...",
  recognition: "...",
  lessons: "...",
  tools: ["Next.js", "TypeScript"],
  images: [{ src: "/images/my-new-thing.jpg", alt: "Description" }],
  links: [{ label: "Live site", url: "https://..." }],
  relatedSkills: ["skill-frontend"],
  relatedExperiences: [],
  relatedAchievements: [],
}
```

**That's it.** It now appears on `/build`, on the homepage if `tier` is
`"featured"`, in `/archive`, in `/explore` (matching its `themes`), and as
its own page at `/build/my-new-thing`.

To **edit** a project, find its object by `id` or `title` and change any
field. To **remove** one, delete its object — it disappears from every page
that referenced it. If something else links to its `id`, that link will just
silently resolve to nothing (no crash), so clean up references when you
delete something significant.

## Add an experience ("What I Do")

Same pattern, in `src/content/experiences.ts`. `category` is one of:
`leadership`, `competition`, `entrepreneurship`, `speaking`, `theatre`,
`volunteering`, `community`, `media`, `school`, `workshop`, `conference`,
`other`.

## Add an achievement

In `src/content/achievements.ts`. Keep it short — the full story belongs on
the linked project or experience via `relatedProjects` / `relatedExperiences`.
`category` is one of: `award`, `competition`, `recognition`, `certification`,
`leadership`, `academic`, `milestone`.

## Add a timeline / story event

In `src/content/timeline.ts`. `era` is a free-text label that groups events
into chapters on `/story` (e.g. "Where it started," "Finding direction") —
introduce a new one just by typing it. Set `isTurningPoint: true` only for
moments that actually changed direction; it gets a visually distinct
treatment, so using it on everything defeats the point.

## Add a skill

In `src/content/skills.ts`. There are no percentages or proficiency bars by
design — a skill's credibility comes entirely from what you link to it via
`relatedProjects`, `relatedExperiences`, `relatedAchievements`. A skill with
nothing linked still shows up, just with "No evidence linked yet" — treat
that as a prompt to either link something or remove the skill.

## Add an interest ("What I Care About")

In `src/content/interests.ts`. `category` is free text (e.g. "Curiosities,"
"Hobbies," "Causes," "Values") — new categories just work.

## Update "Currently"

In `src/content/currently.ts`. Update `value`, `note`, and **`updatedAt`**
(an ISO date, e.g. `"2026-09-01"`) whenever something changes. The date is
what makes this section feel alive rather than stale — don't skip it.

## Update "What's Next"

In `src/content/future.ts`. `horizon` is one of `now`, `next`, `later`,
`someday` and controls which column/group it appears under.

## Add a Lab idea

In `src/content/lab.ts`. `status` is one of `idea`, `exploring`, `building`,
`testing`, `paused`, `done` — just update it as things move.

## Edit personal details

In `src/content/personal.ts` — short prompt/answer pairs shown on `/me`.
`category` groups them (Habits, Favourites, Quirks, ...).

## Edit your identity / homepage text

`src/content/site.ts` is the single source for your name, tagline, short and
long bio, location, email, social links, and the "I build. I lead..." list.
This feeds the homepage hero, the `/me` page, and the site's `<title>` /
social-preview metadata — change it once, it updates everywhere.

## Change what's featured

Every project, experience, and achievement has a `tier` field: `"featured"`,
`"significant"`, or `"archive"`. This is the only thing controlling visual
weight — change `tier: "archive"` to `tier: "featured"` on an entry and it
gets promoted to the homepage and the top of its section, no layout edits
needed. Keep 2–3 things "featured" at once so it stays meaningful.

## Images

Drop real photos/screenshots into `public/images/` and reference them as
`/images/your-file.jpg` in the relevant `images` field. The placeholder SVGs
currently in there (`placeholder-portrait.svg`, `placeholder-project-wide.svg`)
are safe to delete once replaced.

For the social-preview image (`public/og-image.svg`), replace it with a real
1200×630 JPG or PNG when you're ready — SVG works for development but not
every platform renders SVG open-graph images.

## The one Easter egg

Lives in `src/components/misc/EasterEgg.tsx` (the Konami code). It's
harmless and optional — edit the message inside if you want it to say
something more personal.
