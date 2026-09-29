import type { WorkEvent } from "@/types/content";

/**
 * COMMUNICATION, PUBLIC SPEAKING & MEDIA
 *
 * Emceeing, speaking, teaching others to speak, reporting, podcasts and
 * the design work that helps an event communicate. Most of the evidence
 * for the "Public Communication" skill lives here.
 *
 * Newest first. Photos are auto-discovered from
 * `public/media/events/<id>/`; a `media` block here only picks the cover,
 * crop focus, order or layout.
 */
export const communicationEvents: WorkEvent[] = [
  {
    id: "pbl-emcee",
    title: "PBL Season 2, 3, 4, 5 — Emcee & Crew",
    year: 2025,
    dateLabel: "2022 — 2025",
    category: "communication",
    type: "role",
    importance: "significant",
    summary:
      "Four seasons of PBL on the mic and behind the scenes: emceeing, media, auditions, event support, and the main scoresheet and announcements.",
    description:
      "PBL runs in seasons, and I was involved in four of them, Seasons 2 to 5, between 2022 and 2025. My part combined being on the mic as an emcee with crew work that kept the events running.",
    role: "Emcee & Crew",
    actions: [
      "Emceed PBL events.",
      "Contributed to the events' media.",
      "Helped with auditions.",
      "Provided event support as part of the crew.",
      "Handled the main scoresheet and announcements.",
    ],
    learning:
      "Holding the scoresheet and the mic at the same time taught me that whoever announces the results has to be the most careful person in the room. Being trusted with results means checking everything before it's said out loud, and staying composed when plans shift.",
    whyItMattered:
      "A lot of my comfort on stage was built here. Coming back season after season gave me repeated practice in front of an audience, and the crew side showed me what it actually takes to keep an event running.",
    outcome:
      "Emcee and crew across four seasons (2 to 5); responsible for the main scoresheet and announcements.",
    relatedSkills: ["public-communication"],
    relatedEvents: ["pathways-got-talent", "round-square"],
    relatedStory: ["taking-the-stage"],
    detailsToAdd:
      "What PBL stands for and who runs it; which year each season took place; photos if you have them.",
  },
  {
    id: "public-speaking",
    title: "Public Speaking Workshop",
    year: 2025,
    category: "communication",
    type: "workshop",
    importance: "significant",
    summary:
      "Facilitated a public-speaking workshop, helping other students build confidence and communication skills.",
    description:
      "A school workshop on public speaking, where I was on the facilitating side rather than in the audience: sharing what I had learned about speaking to help other students build confidence and communication skills.",
    role: "Facilitator",
    actions: [
      "Facilitated a public-speaking workshop for other students.",
      "Shared public-speaking knowledge with the participants.",
      "Helped other students develop confidence and communication skills.",
    ],
    learning:
      "Teaching something forces you to understand it properly. To help other students, I had to turn habits I had picked up on stage into advice that someone nervous could actually use.",
    whyItMattered:
      "Standing in front of my peers to teach, not perform, took a different kind of confidence. It showed me that I enjoy helping other people get more comfortable speaking, not only doing it myself.",
    outcome: "Workshop delivered to fellow students.",
    media: {
      cover: "1.png",
      layout: "mosaic",
      images: [{ file: "1.png" }, { file: "4.png" }, { file: "3.png" }],
    },
    relatedSkills: ["public-communication", "leadership"],
    relatedEvents: ["inspireability-speaking"],
    relatedStory: ["taking-responsibility"],
    detailsToAdd:
      "Confirm the year: the congratulations email in the photos (dated 26 Feb 2024) thanks the Public Speaking Ambassadors for organising and hosting the workshop on 23 February in the MYP 2 Assembly at Pathways World School, but this record says 2025. If that's right, set year, organization and role (e.g. Public Speaking Ambassador) to match.",
  },
  {
    id: "inspireability-design-tech",
    title: "Inspireability Speaking Design & Tech Team",
    year: 2025,
    category: "communication",
    type: "role",
    importance: "archive",
    summary:
      "Worked on the design and technology behind Inspireability, including creating brochures for the event.",
    description:
      "The Design & Tech Team handled the design and technology side of Inspireability, a public-speaking event. My contribution included creating the brochures.",
    role: "Design & Technology Team",
    actions: [
      "Contributed to the event's design and technology.",
      "Created brochures for the event.",
    ],
    learning:
      "Designing for an event taught me that a brochure is communication before it is decoration: it has to make sense at a glance to someone who has never heard of the event.",
    whyItMattered:
      "It's where my interest in design as a way of communicating became concrete: making materials that other people actually use.",
    outcome: "Created brochures as part of the Design & Tech Team.",
    relatedSkills: ["design"],
    relatedEvents: ["inspireability-speaking"],
    detailsToAdd:
      "What else the Design & Tech Team handled; images of the brochures you made.",
  },
  {
    id: "breaking-in-bhaskara",
    title: "Breaking in Bhaskara – Cyber Security Podcast",
    year: 2025,
    category: "communication",
    type: "event",
    importance: "archive",
    summary: "Spoke on Breaking in Bhaskara, a student-produced podcast about cybersecurity.",
    description:
      "Breaking in Bhaskara is a student-produced podcast on cybersecurity. I contributed to it as a speaker.",
    role: "Speaker",
    learning:
      "Talking about a technical subject without slides to lean on made me think harder about explaining ideas simply. If it doesn't make sense out loud, it doesn't make sense yet.",
    whyItMattered: "It sat right where two of my interests meet: technology and communication.",
    outcome: "Featured as a speaker on the podcast.",
    relatedSkills: ["public-communication"],
    detailsToAdd:
      "The episode's topic; who produced the podcast; a link to the episode if it's public.",
  },
  {
    id: "pathways-got-talent",
    title: "Emcee at Pathways Got Talent",
    year: 2024,
    category: "communication",
    type: "role",
    importance: "significant",
    summary: "Official emcee for Pathways Got Talent, a school-wide talent showcase.",
    description:
      "Pathways Got Talent is a school-wide talent showcase. As the official emcee, I hosted and presented the event, carrying the audience from one act to the next.",
    role: "Official Emcee",
    actions: ["Hosted and presented the event as its official emcee."],
    learning:
      "A talent show isn't about the emcee. The job is to set each performer up well, keep the energy steady between acts, and step back when the stage belongs to someone else, which is harder than it sounds.",
    whyItMattered:
      "Being trusted with a school-wide audience built real confidence on the mic, and emceeing became something I kept coming back to.",
    outcome: "Official emcee for the event.",
    media: { cover: "1.png" },
    relatedSkills: ["public-communication"],
    relatedEvents: ["pbl-emcee", "round-square"],
    relatedStory: ["taking-the-stage"],
    detailsToAdd:
      "Confirm the year: the certificate in the photos is for Pathways Got Talent 2023 (held 22 September 2023), but this record says 2024. If that's right, update the year and set organization to \"Pathways World School\".",
  },
  {
    id: "school-news",
    title: "MYP News Desk Reporter",
    year: 2024,
    category: "communication",
    type: "role",
    importance: "archive",
    summary: "Worked as a student reporter for the school's MYP News Desk.",
    description:
      "The MYP News Desk brings school news to the Middle Years Programme community, and I was one of its student reporters.",
    role: "Student Reporter",
    learning:
      "Reporting taught me to find what matters in a lot of information and say it clearly and briefly, for an audience that doesn't have to pay attention.",
    whyItMattered:
      "It gave me regular practice at turning what was happening around me into clear, readable news.",
    outcome: "Student reporter for the MYP News Desk.",
    media: {
      cover: "2.png",
      images: [{ file: "2.png", focus: "8% 50%" }, { file: "1.png" }],
    },
    relatedSkills: ["writing", "public-communication"],
    detailsToAdd:
      "Confirm the year: the video in the photos is titled 'Trending @ MYP August 2023' (Pathways World School), but this record says 2024. Also: organization; the stories you covered; a link to the video if it's public.",
  },
];
