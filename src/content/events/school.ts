import type { WorkEvent } from "@/types/content";

/**
 * SCHOOL EVENTS, COMMUNITY ENGAGEMENT & OPERATIONS
 *
 * The everyday life of school beyond the classroom: fests, fairs,
 * celebrations, whole-school events and boarding. The Best Boarder Award
 * is an `award`, so it shows in the Recognized lens ("Other Awards &
 * Recognition") rather than in Did.
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way". Fill in `detailsToAdd` gaps as you confirm them.
 */
export const schoolEvents: WorkEvent[] = [
  {
    id: "global-university-fair",
    title: "PWS Global University Fair",
    year: 2025,
    category: "school",
    type: "event",
    importance: "archive",
    summary: "Took part in the PWS Global University Fair, a large school-wide university and community event.",
    description:
      "A university fair that brings universities and the wider school community together, giving students the chance to explore options for higher education and ask questions directly.",
    role: "Participant",
    learning:
      "Seeing universities side by side made me think more concretely about what I actually want from higher education, rather than just which names I recognise.",
    whyItMattered:
      "It connected the things I'm interested in, like AI, computer science and entrepreneurship, to real future pathways.",
    relatedEvents: ["aspirations-career-advisory"],
    detailsToAdd: "Your role (visitor, volunteer, organiser?) and anything specific you took away from it.",
  },
  {
    id: "cultural-fest",
    title: "Cultural Fest",
    year: 2024,
    category: "school",
    type: "event",
    importance: "archive",
    summary: "Took part in the school's Cultural Fest, a celebration of performance, art and culture.",
    description:
      "A school cultural festival that brings students together around performance, art and cultural activities.",
    role: "Participant",
    learning:
      "A cultural fest shows how much energy a school has when everyone is making something at once, and brings out talents in people that you would never see in a classroom.",
    relatedStory: ["taking-the-stage"],
    detailsToAdd: "What you did at the fest (performed, competed, organised…).",
  },
  {
    id: "best-boarder-award",
    title: "Best Boarder Award",
    year: 2022,
    category: "school",
    type: "award",
    importance: "significant",
    summary: "Received the Best Boarder Award for my time in boarding.",
    description:
      "The Best Boarder Award recognises a student for boarding life: the part of school that happens after classes end, where you live alongside the people you study with.",
    learning:
      "Boarding taught me independence early: managing my own time, looking after my own things and getting along with the people I lived with every day. Being recognised for it showed me that those everyday habits do get noticed.",
    whyItMattered:
      "It's one of the few recognitions I have that isn't about a competition or a single performance, but about how I lived day to day.",
    recognition: {
      result: "Best Boarder Award",
      category: "other",
      level: "major",
    },
    relatedEvents: ["boarding-council"],
    detailsToAdd: "Which school and boarding house; what the award recognised.",
  },
  {
    id: "neasc-meeting",
    title: "NEASC Meeting",
    category: "school",
    type: "event",
    importance: "archive",
    summary: "Took part in a NEASC meeting, one of the ways a school is reviewed for accreditation.",
    description:
      "NEASC is an association that accredits schools. Its meetings give the people who make up a school, students included, a chance to talk about how it works and where it could improve.",
    learning:
      "It gave me a look at how a school is evaluated from the outside, and showed me that student perspectives are part of how that picture gets formed.",
    whyItMattered:
      "It was a rare chance to see the systems behind school life: the standards, reviews and conversations that shape how a school runs.",
    detailsToAdd: "Year; your role in the meeting (e.g. student representative); what was discussed.",
  },
  {
    id: "diwali-open-house-singing",
    title: "Diwali Open House Singing",
    category: "school",
    type: "performance",
    importance: "archive",
    summary: "Sang at the school's Diwali Open House.",
    description:
      "A Diwali Open House celebration, where I was part of the singing for the guests and school community who came to celebrate the festival.",
    learning:
      "Singing on a festival day is less about perfection and more about adding to the atmosphere. It taught me to enjoy performing rather than just getting through it.",
    relatedEvents: ["udeesha-music-workshop", "art-by-choice-piano"],
    detailsToAdd: "Year; what you sang; solo or group.",
  },
  {
    id: "skip-a-thon",
    title: "Skip-a-Thon",
    category: "school",
    type: "event",
    importance: "archive",
    summary: "Joined the Skip-a-Thon, a skipping challenge built on stamina.",
    description:
      "A skipping event built around endurance and participation, bringing students together for one shared challenge.",
    learning:
      "Fitness challenges work best when they're shared. Everyone pushing through the same thing at once makes it much easier to keep going.",
    relatedEvents: ["jogathon"],
    detailsToAdd: "Year; whether it supported a cause; your part in it.",
  },
];
