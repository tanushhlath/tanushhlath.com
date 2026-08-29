# Content Checklist

Everything below is currently a placeholder or an example value. Nothing in
this list is hardcoded in a component — every single item lives in the file
named in each heading, so filling this in is purely a text edit. See
[CONTENT_GUIDE.md](./CONTENT_GUIDE.md) for the add/edit/remove mechanics.

**How to use this:** send me the real information (in any order, any format —
plain text, bullet points, voice-memo-transcript-messy is fine) and I'll drop
it straight into these files. Reference items by their `id` (shown in bold)
if you want to be precise, or just describe which one you mean.

Legend: **[bracketed]** = placeholder text to replace. *(example)* = a
plausible-looking value I invented to demonstrate the schema — verify or
replace it, don't assume it's already right.

---

## 1. Identity — `src/content/site.ts`
Powers: homepage hero, `/me`, nav wordmark, footer, browser tab title, social share previews.

- `name`: **[Your Name]**
- `shortName`: **[Name]** (short version for the nav wordmark)
- `tagline`: **[A one-line description of who you are — not a job title]**
- `bioShort`: **[Two or three sentences — who you are, what you spend your time on]**
- `bioLong` — three paragraphs for `/me`:
  1. **[Where you're starting from — early world, early curiosity]**
  2. **[How that curiosity turned into action — first thing you built/led]**
  3. **[Where you are now, and what you're reaching for]**
- `location`: **[City, Country]**
- `email`: **[you@example.com]**
- `social` — for each, the real URL/handle:
  - Email: *(uses the email above)*
  - GitHub: **[github.com/your-handle]**
  - LinkedIn: **[linkedin.com/in/your-handle]**
  - Instagram: **[instagram.com/your-handle]**
  - *(delete any you don't use, or add others — X/Twitter, YouTube, a personal blog, etc.)*
- `definingThings`: currently "I build. / I lead. / I compete. / I make things. / I ask too many questions." — keep, edit, reorder, or replace with your own five-or-so short statements
- `photo`: portrait image *(see § 12 — image files)*
- `secretNote`: **[the Easter egg text — a tiny personal fact, inside joke, or thank-you]** shown when someone holds/triple-taps the nav wordmark

---

## 2. My Story — `src/content/timeline.ts`
Powers: `/story`. Each entry needs `title`, `summary`, `narrative`, and (for turning points) a `quote`. `year` and `era` should be checked/adjusted too.

- **tl-01** (2010, "Where it started"): title, summary, and narrative for **[an early memory or environment that shaped your curiosity]**
- **tl-02** (2016, "Where it started"): **[first time you made or led something, however small]**
- **tl-03** (2019, "Finding direction") — turning point, needs a `quote` too: **[a turning point — class/person/failure/book]**
- **tl-04** (2021, "Finding direction"): **[first real project or role you took seriously]**
- **tl-05** (2022, "Building momentum"): **[a project, competition, or role that raised the stakes]**
- **tl-06** (2023, "Building momentum"): **[stepping into a leadership or public role]**
- **tl-07** (2024, "Where I am now") — turning point, needs a `quote` too: **[the thing that made this website worth building]**
- **tl-08** (2025, "Where I am now"): **[present — what you're building and leading today]**

*(Add, remove, rename eras, or add more moments freely — this is meant to be edited into your actual shape, not filled in as 8 fixed slots.)*

---

## 3. What I Build — `src/content/projects.ts`
Powers: `/build` and each project's detail page. Per project, everything below needs your real answer (fields left blank in a project — like `impact` on Orbit — are optional; add them if relevant).

**proj-01** / `signal` — *(currently titled "Project One — e.g. Signal")*
- title, year, `dateLabel`, `category` *(example: "Product / Web App")*, `status` *(example: "in-progress")*, `tier` *(currently "featured")*
- summary, problem, motivation, concept, role
- process: 3 steps
- challenges, outcome, impact, recognition, lessons
- tools: *(example: Next.js, TypeScript, PostgreSQL — replace with what you actually used)*
- image(s), and a real link (currently `"#"`)

**proj-02** / `field-notes` — *(currently "Project Two — e.g. Field Notes")*
- Same field set as above (category example: "Writing / Publication"); tools example: Markdown, Figma

**proj-03** / `orbit` — *(currently "Project Three — e.g. Orbit")*
- title, summary, problem, concept, role, outcome, recognition
- category example: "Hardware / Hackathon"; tools example: Arduino, Python
- no image yet — add one if you have it

**proj-04** / `loop` — *(currently "Project Four — e.g. Loop", status "paused")*
- title, summary, concept, role, outcome
- category example: "Mobile App"; tools example: React Native, Firebase

**proj-05** / `smaller-experiment-one` — archive tier
- title **[e.g. weekend build]**, summary, category *(example: "Experiment")*

**proj-06** / `smaller-experiment-two` — archive tier
- title **[e.g. class project]**, summary, category *(example: "School Project")*

**proj-07** / `smaller-experiment-three` — archive tier
- title **[e.g. design study]**, summary, category *(example: "Design")*

*(This is your real inventory — add more projects, delete any of these that don't correspond to something real, re-tier them as featured/significant/archive based on what actually matters most.)*

---

## 4. What I Do (Experiences) — `src/content/experiences.ts`
Powers: `/do` and each experience's detail page.

**exp-lead-01** / `student-council-president` — featured
- title **[e.g. Student Council President]**, organization/school, dates
- summary, description, role
- highlights: 3 bullets **[specific initiative / hard decision / measurable outcome]**

**exp-hack-01** / `national-hackathon` — featured
- title **[e.g. National Hackathon]**, organizer, year
- summary, description, role
- highlights: 1 bullet **[placement or standout moment]**

**exp-theatre-01** / `school-production` — significant
- title **[e.g. lead role in school production]**, production/group name, year
- summary, description, role played

**exp-speak-01** / `conference-talk` — significant
- title **[e.g. talk at a youth conference]**, event name, year
- summary, description

**exp-vol-01** / `community-initiative` — significant
- title **[e.g. community tutoring initiative]**, organization, years
- summary, description

**exp-media-01** / `school-newspaper` — archive
- title **[e.g. school newspaper editor]**, year, one-line summary

**exp-workshop-01** / `design-workshop` — archive
- title **[e.g. UX design workshop]**, year, one-line summary

**exp-school-01** / `class-project-showcase` — archive
- title **[e.g. class project showcase]**, year, one-line summary

*(Same deal — add/remove/re-tier to match your real history of leadership, competitions, performances, volunteering, school life, etc.)*

---

## 5. Achievements — `src/content/achievements.ts`
Powers: `/achievements`, and shows up cross-linked on related projects/experiences.

- **ach-01** `hackathon-finalist` (featured): title **[e.g. National Hackathon Finalist]**, issuer, summary, context, why it matters
- **ach-02** `hardware-recognition` (significant): title **[e.g. Best Hardware Hack]**, issuer, summary, context
- **ach-03** `leadership-recognition` (significant): title **[e.g. Outstanding Student Leader]**, issuer/school, summary, why it matters
- **ach-04** `academic-honor` (archive): title **[e.g. Honor Roll / subject prize]**, school, summary
- **ach-05** `certification-01` (archive): title **[e.g. an online course completion]**, provider, summary

---

## 6. Skills — `src/content/skills.ts`
The skill *names* are already reasonable (Leadership, Product Thinking, Frontend Development, Hardware Prototyping, Writing, Design, Public Communication, Systems Thinking) — keep, rename, add, or delete to match what you actually want to claim. Each one needs a real one-sentence `blurb` in your own words:

- **skill-leadership**: **[how you lead, in your own words]**
- **skill-product**: **[how you think about problems and users]**
- **skill-frontend**: **[your build practice — tools you reach for and why]**
- **skill-hardware**: **[your hands-on building]**
- **skill-writing**: **[how and why you write]**
- **skill-design**: **[your design instincts]**
- **skill-communication**: **[speaking/performing/writing for an audience]**
- **skill-systems-thinking**: **[how you break down complex problems]**

*(The evidence links — which projects/experiences/achievements prove each skill — I'll wire up myself once I know your real projects and experiences; you don't need to figure out the IDs.)*

---

## 7. What I Care About — `src/content/interests.ts`
Powers `/care-about`. Each needs a real title and a note on why it holds your attention:

- **int-01 / int-02** (Curiosities): two topics you're genuinely curious about, and why
- **int-03 / int-04** (Hobbies): two hobbies, and what you get out of them
- **int-05** (Causes): a cause you care about, and why
- **int-06** (Values): a value you try to live by, and what it means in practice
- **int-07** ("Just for me"): something you love that has nothing to do with work
- **int-08** (Taste): a genre/artist/medium you're into, and what draws you to it

*(Categories are free text — rename "Curiosities"/"Hobbies"/etc. or add new categories entirely.)*

---

## 8. Currently — `src/content/currently.ts`
Powers `/now` and the homepage "Right now" section. This one goes stale on purpose — give me today's real answers and the real date:

- **building**: what you're building right now + a note
- **learning**: what you're learning + why
- **reading**: what you're reading
- **exploring**: a topic/idea you're circling
- **goal**: your current headline goal
- **challenge**: something genuinely hard right now + a note

*(Dates are currently early-to-mid August 2026 placeholders — tell me the real "as of" date for each, or I'll just use today's date.)*

---

## 9. What's Next — `src/content/future.ts`
Powers `/next`. Six goals across four horizons:

- **Now** (1): what you're actively working toward this month
- **Next** (2): the next thing in line + a skill/area you want to grow into
- **Later** (1): something on the 1–2 year roadmap
- **Someday** (2): two bigger, unscheduled ambitions

*(Add more at any horizon, or fewer — six is just what's there now.)*

---

## 10. Lab — `src/content/lab.ts`
Powers `/lab`. Six half-formed ideas across different statuses:

- **exploring**: an idea you're actively exploring
- **building**: something you started building
- **idea**: a concept that's still just an idea
- **testing**: something you tested and are deciding on
- **paused**: something you paused (and why, not "why it failed")
- **done**: something you finished that folded into a real project

---

## 11. A Few Things About Me — `src/content/personal.ts`
Powers the collage on `/me`. Ten short prompt/answer pairs — just give me real one-line answers:

1. Mornings or late nights?
2. Comfort food?
3. A small habit people notice about you?
4. How you like to work?
5. A song on repeat lately?
6. Introvert, extrovert, or depends?
7. First thing you do in the morning?
8. Something you collect or hoard?
9. A place that feels like you?
10. Handwritten or typed?

*(Swap out any prompt you don't like for a different one — these are just a starting set.)*

---

## 12. Images & other assets (not text — these are files, not content records)

- `public/images/placeholder-portrait.svg` → your real portrait (referenced by `site.photo` in `site.ts`)
- `public/images/placeholder-project-wide.svg` → real screenshots/photos for `proj-01` and `proj-02` (referenced in each project's `images` array); projects 03–07 have no image yet — add one the same way if you have it
- `public/og-image.svg` → a real 1200×630 JPG/PNG for social share previews (currently a placeholder graphic with `[Your Name]` on it)
- `public/favicon.svg` → currently a simple generated mark (dark square + blue dot) — replace only if you want a custom one, otherwise it's fine as-is
- Experience images: none are wired up yet — the schema supports them (`images` field on any experience) if you have event photos, competition photos, theatre stills, etc.

For any image: just hand me the file (or tell me where it lives) and which project/experience/the portrait it's for — I'll place it and wire up the reference.

---

## What I do NOT need a list for

- Skill *names*, interest *categories*, and UI copy (nav labels, page intros like "Not a résumé timeline...") are already real, finished writing — not placeholders. Say the word if you want any of that reworded, but it's not blocking.
- Relationship links between items (which skill a project demonstrates, which achievement an experience led to) — once I have the real content, I'll connect these myself based on what you tell me actually happened.
