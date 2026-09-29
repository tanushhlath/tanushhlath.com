import type { WorkEvent } from "@/types/content";

/**
 * GLOBAL AFFAIRS, DIPLOMACY & CULTURAL EXCHANGE
 *
 * Model United Nations, Round Square and cultural exchange: the
 * experiences that put me in conversation with students from other
 * schools and other countries.
 *
 * Newest first. Fill in `detailsToAdd` gaps as you confirm them.
 */
export const globalEvents: WorkEvent[] = [
  {
    id: "round-square",
    title: "Round Square Zoom Postcard Session – Emcee",
    organization: "Round Square",
    year: 2024,
    category: "global",
    type: "event",
    importance: "significant",
    summary:
      "Served as an emcee for an international student engagement and cultural exchange event held over Zoom.",
    description:
      "A Round Square Zoom Postcard Session is an online event that brings students together internationally for conversation and cultural exchange. I was the session's emcee, hosting it for the students taking part.",
    role: "Emcee",
    learning:
      "Hosting on Zoom is harder than it looks. You can't read the room the way you can on a stage, so energy and clarity have to come through your voice and your timing, and making people in very different places feel welcome takes deliberate effort.",
    whyItMattered:
      "It was part of the year I started taking on more public-facing roles, and it showed me that hosting is about more than speaking well: it's about making an international audience feel connected across a screen.",
    media: {
      images: [{ file: "3.png" }, { file: "1.png" }, { file: "2.png" }],
      cover: "3.png",
    },
    relatedSkills: ["public-communication"],
    relatedEvents: ["round-square-symposium"],
    relatedStory: ["taking-the-stage"],
    detailsToAdd:
      "Confirm the year (the certificate in the media folder reads April 2025); the session's theme.",
  },
  {
    id: "round-square-symposium",
    title: "Round Square Symposium",
    organization: "Round Square",
    year: 2024,
    category: "global",
    type: "conference",
    importance: "archive",
    summary:
      "Attended and supported an international student-focused event as a participant, volunteer and buddy.",
    description:
      "A Round Square symposium: an international, student-focused gathering built around discussion and exchange between schools. I took part in it while also volunteering and acting as a buddy.",
    role: "Participant / Volunteer / Buddy",
    learning:
      "Being a volunteer and a buddy as well as a participant meant seeing the event from both sides: enjoying it, but also being responsible for making sure other students felt looked after.",
    relatedSkills: ["public-communication"],
    relatedEvents: ["round-square", "thailand-exchange"],
    detailsToAdd: "Where it was held; the theme; what you did as a volunteer and buddy.",
  },
  {
    id: "mini-mun",
    title: "Mini MUN 5.0",
    year: 2023,
    category: "global",
    type: "conference",
    importance: "archive",
    summary: "Took part in a Model United Nations experience focused on discussion and diplomacy.",
    description:
      "Mini MUN 5.0 was a Model United Nations conference, where participants represent countries, debate global issues and work towards resolutions through discussion and diplomacy.",
    role: "Participant",
    learning:
      "MUN taught me to argue a position that isn't necessarily my own, to listen for where others might agree, and that diplomacy is often about finding common ground rather than winning the room.",
    relatedSkills: ["public-communication"],
    relatedEvents: ["world-scholars-cup"],
    detailsToAdd: "Host school; your committee and the country you represented; any award.",
  },
  {
    id: "thailand-exchange",
    title: "Thailand Culture Exchange Program Crew",
    year: 2023,
    category: "global",
    type: "programme",
    importance: "archive",
    summary: "Supported a Thailand cultural exchange programme as part of the crew and as a buddy.",
    description:
      "A cultural exchange programme with Thailand, built around sharing culture and perspectives. I was part of the crew supporting it and a buddy to participants.",
    role: "Crew / Buddy",
    learning:
      "Being a buddy taught me that cultural exchange happens in small moments: explaining everyday things, asking good questions, and being genuinely curious about how someone else sees the world.",
    relatedEvents: ["round-square-symposium"],
    detailsToAdd: "Whether you hosted visiting students or travelled; what the crew handled.",
  },
];
