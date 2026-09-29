import type { WorkEvent } from "@/types/content";

/**
 * ENTREPRENEURSHIP, INNOVATION & CAREER EXPLORATION
 *
 * Startup and innovation competitions, hackathons, entrepreneurship
 * bootcamps and workshops, and the sessions that helped me think about
 * where all of this could lead. Results (Grand National Finale, 1st
 * Runner-Up, Final Round…) live on the event itself as `recognition`;
 * the Recognized lens is generated from them, so never add a second copy.
 *
 * InnoVenture, BITS Pilani and the two Master's Union records replace the
 * old combined "Entrepreneurship & Innovation Competitions" entry; its
 * old URL (/work/innovation-competitions/) redirects to InnoVenture.
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way". Fill in `detailsToAdd` gaps as you confirm them.
 */
export const entrepreneurshipEvents: WorkEvent[] = [
  {
    id: "masters-union-startup-league",
    title: "Master's Union – High School Startup League",
    organization: "Master's Union",
    year: 2026,
    category: "entrepreneurship",
    type: "competition",
    importance: "significant",
    summary:
      "Qualified for the final round of a national startup competition, and presented my project at the Gurgaon campus.",
    description:
      "The High School Startup League is a national startup competition run by Master's Union for school students. Participants develop a startup idea into a project and take it through successive rounds of the competition.",
    role: "Participant / Project Creator",
    actions: [
      "Developed a startup project and took it through the competition's rounds.",
      "Qualified for the final round of the competition.",
      "Presented the project at the Gurgaon campus.",
    ],
    learning:
      "Taking a project this far showed me how much sharper an idea has to become before it's ready for a real audience. Every part of it needs a reason, and I have to be able to explain that reason simply, in person.",
    whyItMattered:
      "It showed that entrepreneurship wasn't a one-competition phase for me. After InnoVenture and the BITS Pilani bootcamp, I was still building ideas and still taking them to the final stage, this time in a national startup competition.",
    recognition: {
      result: "Final Round",
      detail: "Presented the project at the Gurgaon campus",
      category: "entrepreneurship",
      level: "major",
    },
    media: {
      images: [{ file: "2.png" }, { file: "1.png" }],
      cover: "2.png",
      layout: "split",
    },
    relatedSkills: ["product-thinking", "public-communication"],
    relatedProjects: ["digital-opportunity"],
    relatedEvents: ["masters-union-ai-hackathon", "innoventure", "bits-pilani-bootcamp"],
    relatedStory: ["competitions-to-creation"],
    detailsToAdd:
      "Confirm the round and the year: the certificate and badge in the media folder say 'Regional Qualifier Round' (the email gives Round 2, Gurugram, 13–14 December), while this page says 'Final Round'. If you went on to a final, add where and when; if not, update the recognition wording. Also: which project you presented (the Digital Skills & Opportunity Initiative?) and whether it was a team.",
  },
  {
    id: "masters-union-ai-hackathon",
    title: "Master's Union – AI Hackathon",
    organization: "Master's Union",
    year: 2025,
    category: "entrepreneurship",
    type: "competition",
    importance: "significant",
    summary:
      "Qualified for the final round of an AI-focused innovation and problem-solving competition, and presented my project there.",
    description:
      "An AI-focused innovation and problem-solving competition run by Master's Union. Participants build a project around a practical problem and develop it through successive rounds, and the finalists present their work in the final round.",
    role: "Participant / Project Creator",
    actions: [
      "Developed an AI-focused project for the competition.",
      "Qualified for the final round and presented the project there.",
    ],
    learning:
      "Hackathons compress everything. Working on an AI problem against a deadline taught me to decide early what the project really needs to do, and to spend my time making that part work well instead of adding more to it.",
    whyItMattered:
      "It reflects my interest in applying AI to practical problems. It came in the same year as Google and Kaggle's AI Intensive Course and Wizmo: the year AI stopped being something I only learned about and became something I built with.",
    recognition: {
      result: "Final Round",
      detail: "Presented the project in the final round",
      category: "entrepreneurship",
      level: "major",
    },
    media: {
      // 1.png in this folder is Master's Union's listing for the High School
      // Startup League, not this hackathon, so it stays off this page.
      images: [{ file: "3.png" }, { file: "2.png" }],
      hide: ["1.png"],
      cover: "3.png",
      layout: "split",
    },
    relatedSkills: ["product-thinking", "public-communication"],
    relatedProjects: ["wizmo"],
    relatedEvents: ["ai-intensive-google-kaggle", "masters-union-startup-league", "innoventure"],
    relatedStory: ["building-with-ai", "competitions-to-creation"],
    detailsToAdd:
      "What the project was (and whether it connected to Wizmo); team or solo. 1.png in the media folder (the High School Startup League listing) is hidden here; remove it from `hide` if you meant it for this page.",
  },
  {
    id: "digital-horizons",
    title: "Global Youth Action Fund Project: Digital Horizons – Empowering Education for All",
    seoTitle: "Digital Horizons — Global Youth Action Fund",
    organization: "Global Youth Action Fund",
    year: 2025,
    category: "entrepreneurship",
    type: "programme",
    importance: "significant",
    summary:
      "A social-impact education initiative focused on improving access to education through technology, pitched to the IB board.",
    description:
      "Digital Horizons – Empowering Education for All was a project under the Global Youth Action Fund: a social-impact education initiative focused on improving access to education through technology.",
    role: "Project participant",
    actions: ["Submitted a pitch and proposal for the project to the IB board."],
    learning:
      "Writing a proposal made me be specific about things that are easy to leave vague in conversation: who the project is for, what problem it addresses and why technology is the right way to address it. A good cause still needs a clear plan before anyone can back it.",
    whyItMattered:
      "It pushed me to think seriously about technology as a way to widen access to education. That same question, how technology can open up opportunity for people who have less access to it, is at the centre of the Digital Skills & Opportunity Initiative I'm planning now.",
    media: {
      images: [{ file: "3.png", focus: "50% 0%" }, { file: "1.png" }, { file: "2.png" }],
      cover: "3.png",
      layout: "split",
    },
    relatedSkills: ["systems-thinking", "writing"],
    relatedProjects: ["digital-opportunity"],
    relatedEvents: ["masters-union-startup-league"],
    relatedStory: ["building-for-impact"],
    detailsToAdd:
      "Confirm the year; whether it was a team project; what the proposal set out to do in practice.",
  },
  {
    id: "innoventure",
    title: "InnoVenture Competition",
    organization: "InnoVenture",
    year: 2024,
    dateLabel: "2023 & 2024",
    category: "entrepreneurship",
    type: "competition",
    importance: "featured",
    summary: "Reached the Grand National Finale of InnoVenture in two consecutive years, 2023 and 2024.",
    description:
      "InnoVenture is an entrepreneurship and innovation competition that runs over multiple rounds and ends in a Grand National Finale. I entered it in two consecutive years, 2023 and 2024.",
    role: "Participant / Project Creator",
    actions: [
      "Developed ideas and presented them as solutions across the competition's rounds.",
      "Collaborated with others and responded to feedback between rounds.",
      "Progressed through the rounds to the Grand National Finale in 2023, and reached it again in 2024.",
    ],
    learning:
      "Going through it twice taught me that feedback isn't a verdict on an idea but information for the next version of it, and that how clearly an idea is explained can matter as much as the idea itself.",
    whyItMattered:
      "InnoVenture was one of the milestones of 2023, the year entrepreneurship went from something I'd tried once, with my first pitch deck, to something I did regularly. Reaching the national finale two years running showed a sustained interest in entrepreneurship, innovation and solving real-world problems, and gave me the confidence to keep taking ideas to new competitions.",
    recognition: {
      result: "Grand National Finale",
      detail: "Reached it in both 2023 and 2024",
      category: "entrepreneurship",
      level: "major",
    },
    media: {
      images: [
        { file: "3.png" },
        { file: "4.png", focus: "50% 72%" },
        { file: "2.png" },
      ],
      cover: "3.png",
    },
    relatedSkills: ["product-thinking", "public-communication", "systems-thinking"],
    relatedEvents: [
      "bits-pilani-bootcamp",
      "masters-union-startup-league",
      "masters-union-ai-hackathon",
      "junior-make-a-thon",
    ],
    relatedStory: ["ideas-became-projects", "competitions-to-creation"],
    aliases: ["innovation-competitions"],
    detailsToAdd:
      "The idea or project you presented each year; team or solo; how you placed at each finale.",
  },
  {
    id: "bits-pilani-bootcamp",
    title: "Young Entrepreneurship Bootcamp by BITS Pilani",
    organization: "BITS Pilani",
    year: 2024,
    category: "entrepreneurship",
    type: "programme",
    importance: "featured",
    summary:
      "Finished as 1st Runner-Up in the entrepreneurship competition at BITS Pilani's Young Entrepreneurship Bootcamp.",
    description:
      "An entrepreneurship bootcamp for young people, held on the BITS Pilani campus and including an entrepreneurship competition. A bootcamp like this pairs learning how startup ideas take shape with the pressure of developing one and presenting it to be judged.",
    role: "Participant",
    actions: [
      "Attended the entrepreneurship bootcamp on the BITS Pilani campus.",
      "Developed and presented an idea in the bootcamp's entrepreneurship competition, finishing as 1st Runner-Up.",
    ],
    learning:
      "Pitching an idea in a university setting raised my standard for what a finished pitch looks like: a real problem, a solution explained plainly, and honesty about what still needs work.",
    whyItMattered:
      "It's one of my strongest entrepreneurship results. Placing at a competition outside my own school showed me that my ideas could hold up in a wider field, and it's part of the run of competitions, from InnoVenture to Master's Union, that turned entrepreneurship into a habit rather than a one-off.",
    recognition: {
      result: "1st Runner-Up",
      detail: "Entrepreneurship competition at the BITS Pilani campus bootcamp",
      category: "entrepreneurship",
      level: "major",
    },
    media: {
      images: [{ file: "1.png" }, { file: "2.png", focus: "50% 22%" }, { file: "3.png" }],
      layout: "stack",
    },
    relatedSkills: ["product-thinking", "public-communication"],
    relatedEvents: ["innoventure", "masters-union-startup-league", "masters-union-ai-hackathon"],
    relatedStory: ["competitions-to-creation"],
    detailsToAdd:
      "Confirm the year (the certificate in the media folder reads January 2025); what you pitched; team or solo.",
  },
  {
    id: "junior-make-a-thon",
    title: "Junior-Make-A-Thon",
    year: 2023,
    category: "entrepreneurship",
    type: "competition",
    importance: "significant",
    summary: "An innovation and rapid-prototyping competition built around collaborative challenges.",
    description:
      "A make-a-thon is a hackathon for making: participants pick a real problem, design a solution and shape it into something that can be shown and evaluated, usually in teams and against the clock. Junior-Make-A-Thon brought that format to younger students through collaborative innovation challenges.",
    role: "Participant",
    learning:
      "It taught me to think in versions. A rapid-prototyping challenge doesn't reward the perfect idea; it rewards getting a workable one down quickly, seeing where it falls short and improving it with the people around you.",
    whyItMattered:
      "It was part of the year competitions, workshops and collaborative challenges became a regular part of what I did, and it fed my growing interest in working in teams and solving practical problems.",
    media: {
      images: [{ file: "2.png", focus: "50% 12%" }],
      cover: "2.png",
    },
    relatedSkills: ["systems-thinking", "product-thinking"],
    relatedEvents: ["innoventure", "design-thinking-toi-samsung"],
    relatedStory: ["ideas-became-projects"],
    detailsToAdd: "Organiser; the challenge you chose and what your team built; any result.",
  },
  {
    id: "design-thinking-toi-samsung",
    title: "Design Thinking Workshop by TOI & Samsung",
    organization: "The Times of India & Samsung",
    year: 2023,
    category: "entrepreneurship",
    type: "workshop",
    importance: "archive",
    summary:
      "Completed a design-thinking and innovation workshop built around activities and projects, and received a certificate.",
    description:
      "A workshop on design thinking: understanding the people you're designing for, defining the real problem, then generating, testing and refining ideas. It involved hands-on activities and projects.",
    learning:
      "The programme exposed me to structured design-thinking methods and collaborative problem-solving. It helped me understand how ideas can be developed by testing assumptions and iterating on solutions, and that a first solution is something to test and improve rather than something to defend.",
    whyItMattered:
      "It gave a name and a method to something I care about in every project: starting with the problem, and with what would actually be useful to the person using the solution.",
    outcome: "Completed the workshop and received a certificate.",
    media: {
      images: [{ file: "3.png", focus: "50% 30%" }, { file: "1.png" }],
      cover: "3.png",
    },
    relatedSkills: ["design", "product-thinking"],
    relatedEvents: ["junior-make-a-thon", "idea-generation-workshop"],
    relatedStory: ["ideas-became-projects"],
    detailsToAdd:
      "Confirm the year (the workshop emails in the media folder are dated August 2024).",
  },
  {
    id: "streampreneur-program",
    title: "Streampreneur Program",
    category: "entrepreneurship",
    type: "programme",
    importance: "archive",
    summary: "An entrepreneurship programme, and part of my wider exploration of ideas and future paths.",
    description:
      "An entrepreneurship-focused programme, part of the same thread as my innovation competitions, workshops and career-exploration sessions.",
    learning:
      "Programmes like this helped me see entrepreneurship as a set of skills that can be practised rather than a talent you either have or don't: spotting problems, shaping ideas and learning how to explain them.",
    detailsToAdd:
      "Year; organiser; what the programme involved; your role; any outcome or certificate.",
  },
  {
    id: "idea-generation-workshop",
    title: "Idea Generation Techniques Workshop",
    category: "entrepreneurship",
    type: "workshop",
    importance: "archive",
    summary: "A workshop on structured techniques for generating and developing ideas.",
    description:
      "A workshop on idea generation: practical techniques for coming up with more, and better, ideas instead of waiting for inspiration to arrive.",
    role: "Participant",
    learning:
      "The most useful lesson was that good ideas usually come from generating many and then narrowing them down deliberately, which is a far more reliable starting point than waiting for one perfect idea.",
    relatedSkills: ["product-thinking"],
    relatedEvents: ["design-thinking-toi-samsung"],
    detailsToAdd: "Year; organiser; the techniques covered; any certificate.",
  },
  {
    id: "aspirations-career-advisory",
    title: "Aspirations – Careers and College Advisory Sessions",
    category: "entrepreneurship",
    type: "programme",
    importance: "archive",
    summary: "Careers and college advisory sessions that helped me explore possible paths after school.",
    description:
      "A series of careers and college advisory sessions under the Aspirations programme, focused on exploring university options, possible careers and how present interests connect to future pathways.",
    role: "Participant",
    learning:
      "The sessions helped me think about the future more deliberately, connecting the things I already enjoy, like technology, entrepreneurship and problem-solving, to the degrees and careers that could build on them.",
    relatedEvents: ["global-university-fair"],
    detailsToAdd: "Year; who ran the sessions; anything specific you explored or decided.",
  },
];
