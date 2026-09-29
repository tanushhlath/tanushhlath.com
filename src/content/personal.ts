import type { PersonalDetail } from "@/types/content";

/**
 * A FEW THINGS ABOUT ME (Me → #personal-details)
 *
 * Short prompt/answer cards. Keep answers to a sentence or two — this
 * section works because it's quick, specific and a little unexpected.
 *
 *   hidden: true  → the answer stays covered until the visitor reveals it
 *   link          → optional; `external: true` opens in a new tab with ↗
 *   accent        → purely cosmetic hint for the card's visual treatment
 *
 * The order here is the order on the page.
 */
export const personalDetails: PersonalDetail[] = [
  {
    id: "mornings-or-late-nights",
    category: "Habits",
    prompt: "Mornings or late nights",
    answer: "All-nighters.",
  },
  {
    id: "preferred-number",
    category: "Favourites",
    prompt: "Preferred number",
    answer: "37",
    hidden: true,
    accent: "number",
  },
  {
    id: "comfort-food",
    category: "Favourites",
    prompt: "Comfort food",
    answer: "Pizza / Pasta.",
  },
  {
    id: "how-i-like-to-work",
    category: "Preferences",
    prompt: "How you like to work",
    answer: "On my laptop at night, when I can focus without distractions.",
  },
  {
    id: "song-on-repeat",
    category: "Favourites",
    prompt: "A song on repeat lately",
    answer: "Viva La Vida — Coldplay.",
    accent: "music",
  },
  {
    id: "favourite-time-pass-game",
    category: "Favourites",
    prompt: "Favourite time-pass game",
    answer: "Slope 3D.",
    link: { label: "Play Slope 3D", href: "https://www.y8.com/games/slope", external: true },
    accent: "game",
  },
  {
    id: "introvert-or-extrovert",
    category: "Personality",
    prompt: "Introvert, extrovert, or depends",
    answer: "Extrovert.",
  },
  {
    id: "currently-preparing-for",
    category: "Right now",
    prompt: "Currently preparing for",
    answer: "The Indian Computing Olympiad.",
  },
  {
    id: "place-that-feels-like-me",
    category: "Favourites",
    prompt: "A place that feels like you",
    answer: "A horse riding arena or ground.",
    accent: "place",
  },
  {
    id: "handwritten-or-typed",
    category: "Preferences",
    prompt: "Handwritten or typed",
    answer: "Typed.",
  },
];
