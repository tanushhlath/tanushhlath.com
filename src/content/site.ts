import type { EasterEggConfig, NavigationConfig, SiteConfig } from "@/types/content";
import { SITE_URL, paths } from "@/routing/paths";

/**
 * SITE IDENTITY
 *
 * Name, tagline, bio, school, location, contact details and portrait.
 * These drive the homepage hero, the Me page, the footer, the menu and
 * every page's metadata — change a value here and it changes everywhere.
 *
 * The canonical origin (https://tanushhlath.com) lives in
 * `src/routing/paths.ts` as SITE_URL so routing and SEO share one value.
 */
export const site: SiteConfig = {
  name: "Tanushh Lath",
  shortName: "Tanushh",
  url: SITE_URL,
  tagline: "I build, lead, compete, and keep asking better questions.",
  heroKicker: "A person, not a résumé",
  bioShort:
    "I'm a Grade 11 student interested in AI, computer science, entrepreneurship, and ideas that can create real-world impact. I spend my time building projects, taking on leadership opportunities, competing, and exploring what technology can do for people.",
  bioLong: [
    "I've always been drawn to trying things rather than simply watching from the sidelines. Over time, that curiosity has taken me across technology, entrepreneurship, performing arts, public speaking, competitions, and school leadership. I enjoy learning by doing, especially when there is a real problem to solve or something worth creating.",
    "That curiosity gradually turned into action. I began exploring entrepreneurship and innovation, including building my first pitch deck for an eco-friendly products business in 2022. Since then, I have taken part in innovation competitions, developed an AI-powered school-parent chatbot called Wizmo, worked on websites and technology projects, organised events, performed, spoken publicly, and taken on student leadership responsibilities.",
    "Today, I am particularly interested in artificial intelligence, computer science, entrepreneurship, and using technology to create opportunities for others. I am currently working on a rural digital-skills initiative while preparing for the Indian Computing Olympiad and exploring future AI-focused ventures. I'm still figuring out exactly where I will end up, but I know I want to keep building, learning, and doing work that matters.",
  ],
  school: "Jayshree Periwal International School",
  location: {
    short: "Born & brought up in Dubai, UAE · Schooling in Jaipur, India",
    long: "I was born and brought up in Dubai, UAE, where I still live — and I'm at school in Jaipur, India, at Jayshree Periwal International School.",
    home: "Dubai, UAE",
    school: "Jaipur, India",
  },
  email: "tanushh37@gmail.com",
  social: [
    { label: "Email", url: "mailto:tanushh37@gmail.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/tanushh-lath-845345368/" },
  ],
  photo: {
    src: "/images/profile/headshot.png",
    small: "/images/profile/headshot-640.png",
    alt: "Tanushh Lath",
  },
  footerLine: "Built as a living page — it changes as I do.",
  easterEggHint: "Don't click on my name in the top left three times.",
};

/**
 * EASTER EGG
 *
 * The dialog that opens when the name in the top-left corner is clicked
 * three times quickly. The password is deliberately NOT stored here (or
 * anywhere in the repo): the video is encrypted with it at build time —
 * see EDITING_GUIDE.md → "Easter egg".
 */
export const easterEgg: EasterEggConfig = {
  title: "You found something.",
  subtitle: "A little secret from the archive.",
  hint: "My preferred number is 37.",
  wrongPassword: "Not quite. Try again — or reveal the hint.",
  wrongPasswordWithHint: "Not quite. Try again.",
  signoff: "Still figuring it out.",
  afterLink: {
    label: "See the horse-riding event",
    href: paths.workItem("inter-house-horse-riding"),
  },
};

/**
 * MENU
 *
 * Labels and one-line descriptions shown in the full-screen menu.
 * Primary items are numbered 01–04 in the order listed here.
 */
export const navigation: NavigationConfig = {
  home: { href: paths.home(), label: "Home", description: "The entrance" },
  primary: [
    { href: paths.story(), label: "Story", description: "How I got here" },
    { href: paths.work(), label: "Work", description: "Built, did, recognized" },
    { href: paths.me(), label: "Me", description: "The person underneath" },
    { href: paths.beyond(), label: "Beyond", description: "Now, next, and unfinished ideas" },
  ],
  secondary: [
    { href: paths.archive(), label: "Archive", description: "Everything, organized" },
    { href: paths.explore(), label: "Explore", description: "A different way in" },
  ],
};
