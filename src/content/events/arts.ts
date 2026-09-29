import type { WorkEvent } from "@/types/content";

/**
 * ARTS, MUSIC & PERFORMING ARTS
 *
 * Theatre, school productions, music workshops and performances: the
 * creative, on-stage side of school life. Theatre results (Shistech)
 * also appear in the Recognized lens under "Arts / Performing".
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way". Photos are auto-discovered from
 * `public/media/events/<id>/`; a `media` block here only picks the cover,
 * order, alt text or layout.
 */
export const artsEvents: WorkEvent[] = [
  {
    id: "shistech-theatre",
    title: "1st Place in Shistech – Inter-School Theatre Competition",
    seoTitle: "Shistech Inter-School Theatre Competition",
    organization: "Shistech",
    year: 2026,
    category: "arts",
    type: "competition",
    importance: "featured",
    summary:
      "Won first place in an inter-school theatre competition, one of my strongest performing-arts results.",
    description:
      "Shistech is an inter-school theatre and performance competition. That meant our work wasn't in front of a home crowd that already knew us: it was set side by side with entries from other schools, and it came out on top.",
    actions: [
      "Represented my school in Shistech's inter-school theatre and performance competition.",
      "Finished in 1st Place.",
    ],
    learning:
      "Competing in theatre is different from performing in a school production. Nobody is rooting for you by default, so the work has to stand on its own. It showed me how much preparation and teamwork sit behind a single performance, and how rewarding it is when all of that effort comes together at the right moment.",
    whyItMattered:
      "One of my strongest cultural and performing-arts achievements. It showed me that the communication I rely on when emceeing or pitching could also carry creative work, and that I could hold my own in a completely different kind of competition from technology and entrepreneurship.",
    recognition: {
      result: "1st Place",
      detail: "Inter-school theatre competition",
      category: "arts",
      level: "major",
    },
    relatedSkills: ["public-communication"],
    relatedEvents: ["tas-productions", "annual-production"],
    relatedStory: ["taking-the-stage"],
    media: {
      cover: "3.png",
      layout: "hero",
      images: [
        { file: "3.png", alt: "Shistech trophy and certificate of achievement", focus: "50% 45%" },
        { file: "2.png", alt: "Congratulatory reply from the School Director" },
      ],
    },
    detailsToAdd:
      "Confirm the year: the certificate in 3.png appears to read 2023, while this record says 2026. The emails in 1.png mention films and the \"Reelcraft\" category, so check that \"theatre competition\" is the right description. 1.png also shows other students' names in the To line; crop them out if you'd rather not publish them. Also: the name of the piece and your role in it.",
  },
  {
    id: "tas-productions",
    title: "TAS Productions – Acting",
    organization: "TAS Productions",
    year: 2026,
    category: "arts",
    type: "performance",
    importance: "significant",
    summary: "Acted in a school theatre production with TAS Productions.",
    description:
      "A performing-arts experience focused on acting, rehearsal and working as part of a production team: the collaborative process of taking a script and turning it into a performance.",
    role: "Actor",
    actions: [
      "Participated as an actor in a school theatre production.",
      "Rehearsed and performed as part of the production team.",
    ],
    learning:
      "Acting showed me how much of a performance depends on everyone else on stage. Rehearsal is where you learn to listen, adjust to the people around you and trust them to hit their cues, and a production only works when the whole team does.",
    whyItMattered:
      "Theatre asks for a kind of communication that has nothing to do with slides or pitches: holding an audience with voice, timing and presence. Alongside organising and volunteering at school, it was part of learning that working with people and taking responsibility matter as much as building something.",
    relatedSkills: ["public-communication"],
    relatedEvents: ["shistech-theatre", "annual-production"],
    relatedStory: ["taking-responsibility", "taking-the-stage"],
    detailsToAdd:
      "Name of the production and the character you played; a photo from rehearsal or the performance.",
  },
  {
    id: "annual-production",
    title: "Annual Production",
    year: 2023,
    dateLabel: "2022 & 2023",
    category: "arts",
    type: "performance",
    importance: "archive",
    summary: "Part of the school's Annual Production two years running, in 2022 and 2023.",
    description:
      "The Annual Production is the school's yearly stage show, where performance, rehearsal and backstage work come together in a single production. I was part of it in both 2022 and 2023.",
    learning:
      "Coming back for a second year taught me what long-form commitment looks like: a long rehearsal process building toward one performance, and the patience to keep improving something until it is ready for an audience.",
    whyItMattered:
      "It's an early part of the performing-arts thread that runs through my school years, alongside acting with TAS Productions and competing at Shistech.",
    relatedEvents: ["tas-productions", "shistech-theatre"],
    detailsToAdd: "Name of each year's production and your role in it (on stage or backstage).",
  },
  {
    id: "udeesha-music-workshop",
    title: "Udeesha Music Workshop",
    category: "arts",
    type: "workshop",
    importance: "archive",
    summary: "Joined the Udeesha Music Workshop to learn music by making it.",
    description:
      "A music workshop: time set aside from academics and competitions to learn about music and make it with other people.",
    learning:
      "It reminded me that music is built through listening and practice rather than talent alone, and that I learn something far faster by doing it than by watching it.",
    whyItMattered:
      "It kept music part of my school life, alongside the piano performance and the singing I've done.",
    relatedEvents: ["art-by-choice-piano", "diwali-open-house-singing"],
    detailsToAdd:
      "Year; who ran the workshop; what you worked on (instrument, vocals, composition…).",
  },
  {
    id: "art-by-choice-piano",
    title: "Art by Choice Music Performance – Piano",
    category: "arts",
    type: "performance",
    importance: "archive",
    summary: "Performed on the piano in the Art by Choice music performance.",
    description: "A music performance under Art by Choice, in which I performed on the piano.",
    role: "Performer (piano)",
    learning:
      "Performing a piece is very different from practising it. There's no stopping to fix a mistake, so you learn to keep going, stay composed and trust your preparation.",
    whyItMattered:
      "It added a quieter kind of performing to my experience alongside speaking and acting: one where the music has to do all the talking.",
    relatedEvents: ["udeesha-music-workshop", "diwali-open-house-singing"],
    detailsToAdd: "Year; the piece(s) you played; where the performance took place.",
  },
];
