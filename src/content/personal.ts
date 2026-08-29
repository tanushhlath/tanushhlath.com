import { PersonalDetail } from "@/types/content";

/**
 * PERSONAL DETAILS ("A few things about me")
 *
 * Short prompt/answer pairs for the "get to know me" grid. Keep answers to
 * one or two sentences — this section works because it's quick, specific,
 * and a little unexpected, not because it's thorough.
 */
export const personalDetails: PersonalDetail[] = [
  { id: "pd-01", category: "Habits", prompt: "Mornings or late nights", answer: "All-nighters." },
  { id: "pd-02", category: "Favourites", prompt: "Comfort food", answer: "Pizza / Pasta." },
  { id: "pd-04", category: "Preferences", prompt: "How you like to work", answer: "On my laptop at night, when I can focus without distractions." },
  { id: "pd-05", category: "Favourites", prompt: "A song on repeat lately", answer: "Viva La Vida — Coldplay." },
  { id: "pd-06", category: "Personality", prompt: "Introvert, extrovert, or depends", answer: "Extrovert." },
  { id: "pd-07", category: "Habits", prompt: "First thing you do in the morning", answer: "Get ready." },
  { id: "pd-09", category: "Favourites", prompt: "A place that feels like you", answer: "A horse riding arena or ground." },
  { id: "pd-10", category: "Preferences", prompt: "Handwritten or typed", answer: "Typed." },
];
