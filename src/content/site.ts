import { SiteConfig } from "@/types/content";

/**
 * Core identity config. This drives the homepage hero, the <title> tag,
 * OG metadata, and the "who am I" snapshot used across the site.
 */
export const site: SiteConfig = {
  name: "Tanushh Lath",
  shortName: "Tanushh",
  tagline: "I build, lead, compete, and keep asking better questions.",
  bioShort:
    "I'm a Grade 11 student interested in AI, computer science, entrepreneurship, and ideas that can create real-world impact. I spend my time building projects, taking on leadership opportunities, competing, and exploring what technology can do for people.",
  bioLong: [
    "I've always been drawn to trying things rather than simply watching from the sidelines. Over time, that curiosity has taken me across technology, entrepreneurship, performing arts, public speaking, competitions, and school leadership. I enjoy learning by doing, especially when there is a real problem to solve or something worth creating.",
    "That curiosity gradually turned into action. I began exploring entrepreneurship and innovation, including building my first pitch deck for an eco-friendly products business in 2022. Since then, I have taken part in innovation competitions, developed an AI-powered school-parent chatbot called Wizmo, worked on websites and technology projects, organised events, performed, spoken publicly, and taken on student leadership responsibilities.",
    "Today, I am particularly interested in artificial intelligence, computer science, entrepreneurship, and using technology to create opportunities for others. I am currently working on a rural digital-skills initiative while preparing for the Indian Computing Olympiad and exploring future AI-focused ventures. I'm still figuring out exactly where I will end up, but I know I want to keep building, learning, and doing work that matters.",
  ],
  location: "Dubai, UAE · Jaipur, India",
  email: "tanushh37@gmail.com",
  social: [
    { label: "Email", url: "mailto:tanushh37@gmail.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/tanushh-lath-845345368/" },
  ],
  definingThings: [
    "I build.",
    "I lead.",
    "I compete.",
    "I make things.",
    "I stay curious.",
  ],
  photo: { src: "/images/Headshot_Plain.png", alt: "Tanushh Lath, portrait" },
  secretNote: "Still figuring it out.",
};
