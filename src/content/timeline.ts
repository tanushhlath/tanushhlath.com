import { TimelineEvent } from "@/types/content";

/**
 * MY STORY
 *
 * The narrative spine of the site. `era` groups events into life stages
 * (shown as chapter headers on /story). `isTurningPoint` gets a visually
 * distinct treatment — use it sparingly, for moments that actually
 * changed direction, not every event.
 */
export const timeline: TimelineEvent[] = [
  {
    id: "tl-01",
    year: 2022,
    era: "First Steps",
    title: "The First Pitch",
    summary: "My first real experience turning an idea into something I could present.",
    narrative:
      "In 2022, I created my first pitch deck for an eco-friendly products business. It was an early introduction to entrepreneurship: taking an idea, thinking about the problem it addressed, shaping a solution, and trying to convince someone else that it was worth pursuing. It was much smaller than the projects I work on today, but it showed me that I enjoyed turning ideas into something tangible.",
  },
  {
    id: "tl-02",
    year: 2023,
    era: "Building Momentum",
    title: "Ideas Became Projects",
    summary: "Entrepreneurship and innovation started becoming a regular part of what I did.",
    narrative:
      "I began getting more involved in entrepreneurship and innovation through competitions, workshops and collaborative challenges. InnoVenture became one of the important milestones, with me progressing through its rounds and eventually reaching the Grand National Finale. I also became increasingly interested in presenting ideas, working in teams, and solving practical problems.",
    relatedExperiences: ["exp-hack-01"],
    relatedAchievements: ["ach-01"],
  },
  {
    id: "tl-03",
    year: 2024,
    era: "Finding Direction",
    title: "Taking the Stage",
    summary: "I started combining technology and problem-solving with communication and leadership.",
    narrative:
      "By 2024, I was taking on more public-facing and collaborative roles. Alongside competitions and innovation, I became involved in emceeing, theatre, student leadership, school events and other activities that pushed me outside purely academic work. I began to realise that building something is only part of the job; communicating it, working with people and taking responsibility matter just as much.",
    isTurningPoint: true,
    quote: "An idea only becomes useful when you can bring people with you.",
  },
  {
    id: "tl-04",
    year: 2025,
    era: "Technology & AI",
    title: "Building with AI",
    summary: "AI moved from something I was learning about to something I was actually building with.",
    narrative:
      "My interest in artificial intelligence became much more practical. I completed Google's and Kaggle's 5-Day AI Intensive Course, participated in the Master's Union AI Hackathon, and developed Wizmo, an AI-powered Parent Assistant Chatbot. Working through the full process of building and testing Wizmo made AI feel much less theoretical and much more like a tool I could use to solve real problems.",
    relatedProjects: ["proj-01"],
    relatedAchievements: ["ach-03"],
  },
  {
    id: "tl-05",
    year: 2026,
    dateLabel: "2025 — 2026",
    era: "Technology & AI",
    title: "From Competitions to Creation",
    summary: "I started connecting technology, entrepreneurship and real-world problem solving.",
    narrative:
      "My work expanded across AI, technology, entrepreneurship and communication. I qualified for the final round of the Master's Union AI Hackathon, continued participating in innovation competitions, worked on technology and marketing through an internship at Zoftware, and continued developing my technical skills.",
    relatedExperiences: ["exp-hack-01"],
    relatedAchievements: ["ach-02", "ach-04"],
  },
  {
    id: "tl-06",
    year: 2026,
    era: "Leadership in Practice",
    title: "Taking Responsibility",
    summary: "Leadership increasingly became about organising, communicating and making things happen.",
    narrative:
      "At school, I took on responsibilities ranging from being part of the Flair Fest Core Team and helping organise the full event to volunteering at Boiler Room, acting in TAS productions, supporting events and working across student leadership initiatives. These experiences taught me that leadership is often less about having a title and more about being someone others can rely on.",
    relatedExperiences: ["exp-lead-01", "exp-vol-01", "exp-theatre-01"],
  },
  {
    id: "tl-07",
    year: 2026,
    era: "Where I Am Now",
    title: "Building for Impact",
    summary: "I am beginning to think about how technology and opportunity can change people's lives.",
    narrative:
      "I am now working on an initiative with my dad focused on helping students from rural communities in Rajasthan develop digital skills, learn basic AI and software tools, gain access to real opportunities, earn money and become more employable. The project is still being planned, but it represents a shift in what I want to build: not only technology for technology's sake, but practical opportunities for people.",
    isTurningPoint: true,
    quote: "The projects I care about most are the ones that leave someone better off than before.",
    relatedProjects: ["proj-02"],
  },
  {
    id: "tl-08",
    year: 2026,
    era: "Where I Am Now",
    title: "Still Building",
    summary: "Exploring what comes next in AI, entrepreneurship and technology.",
    narrative:
      "I am preparing for the Indian Computing Olympiad, continuing to explore AI and entrepreneurship, and working towards eventually building an AI-focused startup. I do not have everything figured out yet, and that is part of the point. I want to keep experimenting until I find something worth building seriously.",
  },
];
