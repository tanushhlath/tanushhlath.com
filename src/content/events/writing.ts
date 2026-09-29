import type { WorkEvent } from "@/types/content";

/**
 * LITERATURE, WRITING & READING
 *
 * Essay competitions, reading programmes and book discussions. Speaking
 * comes more naturally to me than writing, so these are the records of
 * deliberately practising the harder skill.
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way".
 */
export const writingEvents: WorkEvent[] = [
  {
    id: "aiyyo-essay-writing",
    title: "Aiyyo Essay Writing Competition",
    year: 2023,
    category: "writing",
    type: "competition",
    importance: "archive",
    summary: "Entered a philosophical and analytical essay-writing competition.",
    description:
      "The Aiyyo Essay Writing Competition is a philosophical and analytical writing competition, built around developing written expression and analysis. I took part by writing an essay for it.",
    learning:
      "Writing an argument that has to stand on its own, with no chance to explain it in person, showed me where my thinking was still vague. Clear writing starts with clear reasoning.",
    whyItMattered:
      "Speaking is where I'm most comfortable, so a written competition was deliberate practice in the skill I find harder.",
    outcome: "Competition participant.",
    media: {
      cover: "1.png",
      images: [{ file: "1.png", focus: "50% 8%" }, { file: "2.png", focus: "50% 0%" }],
    },
    relatedSkills: ["writing"],
    relatedEvents: ["tata-english-writing-essay"],
    detailsToAdd:
      "Confirm the year: the photos refer to the Aiyyo Essay Competition 2025, but this record says 2023. Also: your essay's prompt or topic; whether you were shortlisted.",
  },
  {
    id: "reading-programme",
    title: "Reading Programme / Shelf Indulgence Program",
    year: 2023,
    dateLabel: "2022 & 2023",
    category: "writing",
    type: "programme",
    importance: "archive",
    summary:
      "Completed the Shelf Indulgence reading and literary-enrichment programme two years running.",
    description:
      "Shelf Indulgence is a reading and literary-enrichment programme that encourages students to read widely and consistently across the school year. I actively completed it in both 2022 and 2023.",
    learning:
      "Reading consistently, rather than in bursts, changed how I write. The more I read, the more I noticed how other writers build an idea, and the easier it became to structure my own.",
    whyItMattered:
      "Doing it two years running kept reading a habit rather than an occasional thing, and that quietly supports everything else I write and explore.",
    outcome: "Completed the programme in both 2022 and 2023.",
    media: {
      cover: "2.png",
      images: [{ file: "2.png" }, { file: "3.png" }, { file: "1.png" }],
    },
    relatedSkills: ["writing"],
    relatedEvents: ["lit-unlimited-book-discussion"],
    detailsToAdd:
      "Confirm the years: the Pathways World School certificates in the photos are for the 2023–24 academic year ('Shelf Indulgence') and 2024–25 ('Passport to Reading'), but this record says 2022 & 2023. If so, update year/dateLabel and set organization.",
  },
  {
    id: "tata-english-writing-essay",
    title: "Tata English Writing Essay",
    category: "writing",
    type: "event",
    importance: "archive",
    summary: "Took part in the Tata English Writing Essay, turning an idea into a structured piece of writing.",
    description:
      "As the name suggests, the Tata English Writing Essay centres on writing an essay in English: taking an idea and building it into a structured, well-argued piece.",
    learning:
      "An essay rewards structure. One clear idea, properly supported, beats several half-developed ones, and writing this made me more deliberate about planning before I start.",
    whyItMattered:
      "Alongside the Aiyyo competition, it's part of a steady effort to get better at writing, not just at talking.",
    relatedSkills: ["writing"],
    relatedEvents: ["aiyyo-essay-writing"],
    detailsToAdd:
      "Year; who ran it (which Tata organisation); your essay topic; any result or certificate.",
  },
  {
    id: "lit-unlimited-book-discussion",
    title: "Lit Unlimited: Book Discussion",
    category: "writing",
    type: "event",
    importance: "archive",
    summary: "Took part in a book discussion as part of Lit Unlimited.",
    description:
      "A book discussion under the Lit Unlimited banner: a conversation about a book, where the point is to test your own reading against other people's.",
    learning:
      "Discussing a book out loud shows you what you actually understood. Hearing other readers' interpretations made me realise how much a single text can hold, and how to disagree about it well.",
    whyItMattered: "It's where my reading and my speaking meet.",
    relatedSkills: ["writing", "public-communication"],
    relatedEvents: ["reading-programme"],
    detailsToAdd:
      "Year; which book was discussed; who organised Lit Unlimited; your role (participant, speaker, moderator).",
  },
];
