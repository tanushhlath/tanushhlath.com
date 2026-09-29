import type { WorkEvent } from "@/types/content";

/**
 * ACADEMIC COMPETITIONS & INTELLECTUAL DEVELOPMENT
 *
 * Academic competitions, benchmarked assessments, and the courses and
 * workshops I've taken outside the classroom. Medals and distinctions are
 * stored on the event as `recognition` (category "academic"), which is
 * what the Recognized lens reads.
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way". Fill in `detailsToAdd` gaps as you confirm them.
 */
export const academicEvents: WorkEvent[] = [
  {
    id: "world-scholars-cup",
    title: "World Scholar's Cup",
    organization: "World Scholar's Cup",
    year: 2025,
    category: "academic",
    type: "competition",
    importance: "featured",
    summary:
      "Earned Gold and Silver Medals and qualified for Round 2 of an international academic competition.",
    description:
      "The World Scholar's Cup is an international academic competition built around debate, writing and team challenges. It rewards curiosity across a wide range of subjects, and the ability to argue, write and think alongside teammates.",
    role: "Participant",
    actions: ["Competed across the debate, writing and team challenges."],
    learning:
      "Doing debate and writing in the same competition showed me how differently the two work: debate rewards thinking on your feet and listening closely, while writing rewards structure and patience. Doing both as part of a team taught me how to share the load and lean on other people's strengths.",
    whyItMattered:
      "It brought communication, collaboration and intellectual curiosity together in one place, and showed me that I enjoy academic challenges most when they involve arguing, explaining and working with other people.",
    recognition: {
      result: "Gold & Silver Medals",
      detail: "Qualified for Round 2",
      category: "academic",
      level: "major",
    },
    media: {
      images: [{ file: "2.png" }, { file: "1.png" }, { file: "3.png" }],
      cover: "2.png",
      layout: "split",
    },
    relatedSkills: ["public-communication", "writing"],
    relatedEvents: ["mini-mun"],
    detailsToAdd:
      "Confirm the year (the certificates in the media folder read 2023); which round and location; which events the medals were for.",
  },
  {
    id: "ai-intensive-google-kaggle",
    title: "5-Day AI Intensive Course by Google & Kaggle",
    organization: "Google & Kaggle",
    year: 2025,
    category: "academic",
    type: "programme",
    importance: "significant",
    summary:
      "Completed an intensive programme on artificial intelligence and machine learning run by Google and Kaggle.",
    description:
      "A five-day intensive course from Google and Kaggle focused on artificial intelligence and machine learning: a short, dense programme that moves from core concepts to working with modern AI in practice.",
    role: "Participant",
    learning:
      "It gave me a much clearer picture of how modern AI systems work underneath the interface: what they're good at, where they fail, and why testing matters as much as building.",
    whyItMattered:
      "It came in the same year I built Wizmo and reached the final round of the Master's Union AI Hackathon. Together, they made AI feel much less theoretical and much more like a tool I could use to solve real problems.",
    outcome: "Successfully completed the course.",
    relatedSkills: ["product-thinking"],
    relatedProjects: ["wizmo"],
    relatedEvents: ["masters-union-ai-hackathon"],
    relatedStory: ["building-with-ai"],
  },
  {
    id: "indiana-university-finance-workshop",
    title: "International Finance and Development Workshop by Indiana University",
    seoTitle: "Finance Workshop — Indiana University",
    organization: "Indiana University",
    year: 2025,
    category: "academic",
    type: "workshop",
    importance: "archive",
    summary: "Completed an academic workshop on economics, finance and development.",
    description:
      "An academic workshop from Indiana University on international finance and development: how economics and finance shape the way countries grow, and what that means for development around the world.",
    role: "Participant",
    learning:
      "It showed me how closely finance and development are tied together. Decisions about money, investment and trade end up shaping the opportunities people actually have.",
    outcome: "Successfully completed the workshop.",
    media: {
      images: [{ file: "2.png" }],
      cover: "2.png",
    },
    relatedSkills: ["systems-thinking"],
  },
  {
    id: "acer-tests-awards",
    title: "ACER Tests Awards",
    organization: "ACER",
    year: 2024,
    dateLabel: "2022, 2023 & 2024",
    category: "academic",
    type: "assessment",
    importance: "significant",
    summary:
      "Received medals and academic recognition, including High Distinction, across three years of internationally benchmarked assessments.",
    description:
      "ACER's internationally benchmarked assessments measure students in English, Mathematics and Science against a much wider group than their own school. I took them in 2022, 2023 and 2024.",
    learning:
      "Taking the same benchmarked assessments three years running made my progress visible in a way a single test can't. It taught me that consistency comes from steady habits more than last-minute effort.",
    whyItMattered:
      "It provides evidence of academic consistency alongside my extracurricular work, a reminder that the competitions and projects sit on top of a steady academic base.",
    recognition: {
      result: "Medals & High Distinction",
      detail: "Across the 2022, 2023 and 2024 assessments",
      category: "academic",
      level: "major",
    },
    media: {
      layout: "stack",
    },
    detailsToAdd:
      "Which award you received in each subject and year. The certificates in the media folder show Participation for 2022 and 2023, and High Distinction (English), Distinction (Science) and Participation (Mathematics) for 2024; check that 'medals across 2022–2024' is right.",
  },
  {
    id: "camp-yellow-mathematics",
    title: "Camp Yellow International Mathematics Competition",
    organization: "Camp Yellow",
    year: 2024,
    category: "academic",
    type: "competition",
    importance: "significant",
    summary: "Won a Bronze Medal in the Final Round of an international mathematics competition.",
    description:
      "An international mathematics competition run by Camp Yellow, testing mathematical problem solving over successive rounds, with a Final Round for those who progress.",
    role: "Participant",
    learning:
      "Competition maths rewards a different kind of thinking from classroom maths: reading a problem carefully, finding the structure hidden inside it, and staying calm when the first approach doesn't work.",
    whyItMattered:
      "It reflects a strength and a sustained interest in mathematical problem solving, the kind of thinking I'm now building on as I prepare for the Indian Computing Olympiad.",
    recognition: {
      result: "Bronze Medal",
      detail: "Final Round",
      category: "academic",
      level: "major",
    },
    media: {
      // Certificate and results first; the thin email strips and the
      // sign-up email follow.
      images: [
        { file: "1.png" },
        { file: "3.png" },
        { file: "5.png" },
        { file: "4.png" },
        { file: "2.png" },
      ],
      cover: "1.png",
    },
    relatedSkills: ["systems-thinking"],
    relatedEvents: ["inter-house-mathematics-final"],
    detailsToAdd: "Confirm the year (the certificate in the media folder reads '22).",
  },
  {
    id: "inter-house-mathematics-final",
    title: "Inter-House Mathematics Competition Final",
    category: "academic",
    type: "competition",
    importance: "archive",
    summary: "Competed for my house in the final of the inter-house mathematics competition.",
    description:
      "A mathematics competition between the houses at school, where I made it through to the final.",
    learning:
      "Representing my house rather than only myself added a different kind of pressure, and it showed me that in a final, staying composed matters as much as knowing the method.",
    recognition: {
      result: "Finalist",
      category: "academic",
      level: "minor",
    },
    relatedEvents: ["camp-yellow-mathematics"],
    detailsToAdd: "Year; how you placed in the final.",
  },
  {
    id: "times-of-india-national-contest",
    title: "Times of India National Contest",
    organization: "The Times of India",
    category: "academic",
    type: "competition",
    importance: "archive",
    summary: "Took part in a national-level contest run by The Times of India.",
    description: "A national contest organised by The Times of India, open to students across the country.",
    role: "Participant",
    learning:
      "Entering a national contest meant measuring myself against students from all over India rather than just my own school, a useful reminder of how wide the field really is.",
    detailsToAdd:
      "Year; what the contest tested (quiz, essay, olympiad…); any result or certificate.",
  },
  {
    id: "spelling-bee-final",
    title: "Spelling Bee – Final Round",
    category: "academic",
    type: "competition",
    importance: "archive",
    summary: "Reached the final round of a spelling bee.",
    description:
      "A spelling competition that narrows the field round by round. I made it through to the final round.",
    learning:
      "Spelling bees look simple, but the final round is where preparation and nerve meet: listening carefully, breaking a word into parts and trusting what I know.",
    recognition: {
      result: "Final Round",
      category: "academic",
      level: "minor",
    },
    detailsToAdd: "Year; organiser (school or external); how you placed.",
  },
];
