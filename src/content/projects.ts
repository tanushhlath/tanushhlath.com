import { Project } from "@/types/content";

/**
 * WHAT I BUILD
 *
 * One record per project. `tier` controls visual weight everywhere this
 * project is shown ("featured" gets the big immersive treatment on /build
 * and the homepage; "significant" gets a normal card; "archive" only shows
 * up in the filtered archive grid).
 *
 * `relatedSkills` / `relatedExperiences` / `relatedAchievements` are how
 * this project shows up as "evidence" on the Skills page and gets cross-
 * linked from Achievements and Experiences — set them once here and every
 * other page picks it up automatically.
 */
export const projects: Project[] = [
  {
    id: "proj-01",
    slug: "wizmo",
    title: "Wizmo — AI Parent Assistant",
    year: 2025,
    dateLabel: "2025 — 2026",
    category: "AI / Conversational Technology",
    status: "shipped",
    tier: "featured",
    themes: ["building", "exploring"],
    summary:
      "An AI-powered Parent Assistant chatbot designed to make school information easier for parents to access.",
    problem:
      "Parents can have many questions about school life, programmes and processes, while information may be spread across different places.",
    motivation:
      "I wanted to explore how conversational AI could make information easier to access in a way that felt more natural than searching through pages of information.",
    concept:
      "A conversational assistant that parents could interact with to ask school-related questions and receive useful responses.",
    role: "I handled the project from development through testing, including building the chatbot, shaping its responses and testing how it handled real queries.",
    process: [
      "Identify information needs and design the conversational experience.",
      "Build the chatbot in Botpress and develop its response flows.",
      "Test the chatbot, review responses and refine the experience.",
    ],
    challenges:
      "Making responses accurate and useful across different ways users might phrase the same question was one of the main challenges.",
    outcome:
      "A working chatbot prototype that was tested with users and used to explore the practical application of conversational AI in a school environment.",
    impact:
      "The project gave me practical experience in building, testing and improving an AI system around real user needs.",
    recognition: "Developed as a significant independent technology project.",
    lessons:
      "Building useful AI is not just about getting a model to answer; it is about understanding users, handling ambiguity and continuously testing the experience.",
    tools: ["Botpress"],
    links: [
      {
        label: "Try Wizmo",
        url: "https://cdn.botpress.cloud/webchat/v3.7/shareable.html?configUrl=https://files.bpcontent.cloud/2025/04/22/13/20250422133400-RBQXWW2E.json",
      },
    ],
    relatedSkills: ["skill-product", "skill-frontend", "skill-systems-thinking"],
    relatedExperiences: ["exp-hack-01"],
    relatedAchievements: ["ach-03"],
  },
  {
    id: "proj-02",
    slug: "digital-opportunity",
    title: "Digital Skills & Opportunity Initiative",
    year: 2026,
    dateLabel: "Planning — 2026",
    category: "Social Impact / Digital Literacy",
    status: "concept",
    tier: "featured",
    themes: ["leading", "building", "exploring"],
    summary:
      "An initiative to help students from rural communities develop practical digital and AI skills and gain access to real work opportunities.",
    problem:
      "Students in smaller rural communities may have limited access to digital skills, technology and pathways into skilled employment.",
    motivation:
      "I want to help people move beyond limited digital access by giving them practical skills that can translate into income, experience and better employment opportunities.",
    concept:
      "Recruit a small first cohort, provide approximately one month of practical digital and AI training, then connect participants with internships and other work opportunities where they can earn money and build a portfolio.",
    role: "Co-founder / project lead with my dad; currently responsible for developing the concept and planning the first cohort.",
    process: [
      "Recruit around 20 students from rural communities in Rajasthan.",
      "Train them in basic AI, software and digital platforms over one month.",
      "Connect them with internships and other real opportunities to gain experience, earn money and become more employable.",
    ],
    challenges:
      "Building a model that is practical for students with limited digital exposure while ensuring that training genuinely leads to useful opportunities.",
    outcome: "Currently in planning; first cohort and implementation model are being developed.",
    impact:
      "The long-term goal is to improve digital literacy, employability, income opportunities and access to skilled work.",
    tools: ["Smartphones", "Computers", "AI tools", "Digital platforms"],
    relatedSkills: ["skill-leadership", "skill-systems-thinking"],
    relatedExperiences: ["exp-hack-01", "exp-school-08"],
    relatedAchievements: ["ach-04"],
  },
  {
    id: "proj-03",
    slug: "ib-league-website",
    title: "IB League — Website Development",
    year: 2025,
    category: "Web Development",
    status: "shipped",
    tier: "significant",
    themes: ["building", "creating"],
    summary: "A web-development project connected to the IB League initiative.",
    concept: "Contributing to the development of a website for the IB League.",
    role: "Website development contributor.",
    relatedSkills: ["skill-frontend", "skill-design"],
  },
  {
    id: "proj-04",
    slug: "passion-project-research",
    title: "Passion Project & Research",
    year: 2025,
    category: "Research / School Project",
    status: "in-progress",
    tier: "significant",
    themes: ["exploring", "creating"],
    summary: "Independent academic exploration combining research with an area of personal interest.",
    concept: "A school-based passion project and research process.",
    role: "Student researcher / project creator.",
    relatedSkills: ["skill-writing", "skill-systems-thinking"],
  },
];
