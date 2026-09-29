import type { WorkEvent } from "@/types/content";

/**
 * LEADERSHIP, SERVICE & STUDENT GOVERNANCE
 *
 * Roles where I was responsible for something bigger than my own work:
 * organising events, volunteering, councils, ambassador and mentoring
 * roles. These power the "I lead." link on the homepage
 * (Work → Did → Leadership).
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way". Fill in `detailsToAdd` gaps as you confirm them.
 */
export const leadershipEvents: WorkEvent[] = [
  {
    id: "flair-fest-core",
    title: "Flair Fest Core Team",
    organization: "Jayshree Periwal International School",
    year: 2026,
    category: "leadership",
    type: "role",
    // Featured without photos on purpose: it is the clearest leadership
    // story on the site and heads the "I lead." path. Add photos to
    // public/media/events/flair-fest-core/ and they appear automatically.
    importance: "featured",
    summary:
      "Helped organise and execute Flair Fest, the full school cultural event, as part of the Core Team.",
    description:
      "Flair Fest is a large, full-school cultural event at Jayshree Periwal International School. As part of its Core Team I was on the organising side of the whole event, not one corner of it: a hands-on event-leadership experience that ran from planning and coordination all the way through to execution.",
    role: "Core Team",
    actions: [
      "Helped organise and execute the full event.",
      "Worked collaboratively across different event requirements and responsibilities.",
      "Contributed to making the event run successfully from planning through execution.",
    ],
    learning:
      "An event this size showed me how much of leadership happens where nobody is looking: keeping track of lots of moving parts, following through on what I'd said I would do, and working with people whose responsibilities overlapped with mine. A plan only counts once it has actually been carried out.",
    whyItMattered:
      "This is where leadership stopped being an idea and became something practical: organising, communicating and making things happen for a whole school, not just for my own part of it. That thread runs through a lot of what I do now.",
    outcome: "Helped deliver the full event as a Core Team member.",
    relatedSkills: ["leadership", "public-communication"],
    relatedEvents: ["boiler-room"],
    relatedStory: ["taking-responsibility"],
    detailsToAdd:
      "Which part of the event your Core Team work focused on; roughly how big the event was; photos if you have them.",
  },
  {
    id: "boiler-room",
    title: "Boiler Room Volunteer",
    organization: "Jayshree Periwal International School",
    year: 2026,
    category: "leadership",
    type: "service",
    importance: "significant",
    summary: "Volunteered to support Boiler Room, a school event, and helped with its execution.",
    description:
      "Boiler Room was a school event at Jayshree Periwal International School. I supported it as a student volunteer and contributed to getting it done.",
    role: "Student volunteer",
    actions: ["Supported the event as a student volunteer and contributed to its execution."],
    learning:
      "Volunteering showed me that an event runs on the people who turn up and do whatever is needed, whether or not anyone notices. Being reliable counts for more than being visible.",
    whyItMattered:
      "It belongs to the same stretch as the Flair Fest Core Team: taking responsibility for things at school instead of only attending them.",
    outcome: "Student volunteer; contributed to the event's execution.",
    relatedSkills: ["leadership"],
    relatedEvents: ["flair-fest-core"],
    relatedStory: ["taking-responsibility"],
    detailsToAdd: "What kind of event Boiler Room is; what you actually did as a volunteer.",
  },
  {
    id: "inspireability-speaking",
    title: "Inspireability Speaking Mentor",
    year: 2025,
    category: "leadership",
    type: "role",
    importance: "archive",
    summary: "Mentored participants in Inspireability, a public-speaking event.",
    description:
      "Inspireability is a public-speaking event. As a Speaking Mentor, my job was to support the participants who were taking part in it.",
    role: "Speaking Mentor",
    actions: ["Mentored participants in the public-speaking event."],
    learning:
      "Mentoring meant putting into words things I usually do by instinct when I speak, and adjusting my advice to each person instead of handing everyone the same tips. Explaining it to someone else sharpened my own speaking too.",
    whyItMattered:
      "A workshop speaks to a whole room; mentoring is closer than that. It taught me to pay attention to what one person needs, which is a quieter kind of leadership.",
    outcome: "Speaking Mentor for the event.",
    relatedSkills: ["public-communication", "leadership"],
    relatedEvents: ["inspireability-design-tech", "public-speaking"],
    detailsToAdd:
      "Who organises Inspireability and who the participants were; how many people you mentored; how your mentees did.",
  },
  {
    id: "youth-ambassador",
    title: "Youth Ambassador Program",
    year: 2024,
    category: "leadership",
    type: "programme",
    importance: "significant",
    summary: "Took part in a student leadership and ambassador programme as a Youth Ambassador.",
    description:
      "The Youth Ambassador Program is a student leadership and ambassador programme: the kind that asks students to represent other people and take initiative beyond their own work. I took part as a Youth Ambassador.",
    role: "Youth Ambassador",
    learning:
      "Being an ambassador meant representing more than just myself. It made me more aware of how I show up, and more willing to take the first step instead of waiting to be asked.",
    whyItMattered:
      "It came in the year I started taking on more public-facing and leadership roles, and it helped build the confidence to keep saying yes to them.",
    outcome: "Served as a Youth Ambassador.",
    relatedSkills: ["leadership"],
    relatedStory: ["taking-the-stage"],
    detailsToAdd:
      "Who ran the programme (your school or an outside organisation); what ambassadors were responsible for; any certificate.",
  },
  {
    id: "boarding-council",
    title: "Boarding Council",
    year: 2024,
    category: "leadership",
    type: "role",
    importance: "archive",
    summary: "Served on the Boarding Council in 2024, the student voice for boarding life.",
    description:
      "A Boarding Council is student governance for the boarding house, giving boarders a say in how boarding life runs. I was part of it in 2024.",
    role: "Boarding Council member",
    learning:
      "Leading the people you live alongside is different from leading a team you see for an hour. You can't switch off at the end of the day, so being consistent and approachable matters more than any single decision.",
    whyItMattered:
      "Boarding has been a big part of my school life, so having a say in how it works for everyone felt personal.",
    outcome: "Member of the Boarding Council for 2024.",
    relatedSkills: ["leadership"],
    relatedEvents: ["best-boarder-award"],
    detailsToAdd:
      "Which school this was at; your position on the council (member, head, etc.); what the council worked on.",
  },
  {
    id: "safety-ambassador",
    title: "Student Leadership Council – Safety Ambassador",
    category: "leadership",
    type: "role",
    importance: "significant",
    summary: "Served on the Student Leadership Council as Safety Ambassador.",
    description:
      "The Student Leadership Council is the school's student leadership body, and Safety Ambassador was my position on it: a role focused on the safety side of student life.",
    role: "Safety Ambassador, Student Leadership Council",
    learning:
      "A safety role is less about big moments and more about paying attention: noticing what other people might walk past, and being willing to speak up about it. It taught me that responsibility for others is often quiet, everyday work.",
    whyItMattered:
      "It gave me a formal place in student leadership and made looking out for other people part of my job rather than something optional.",
    outcome: "Held the Safety Ambassador position on the Student Leadership Council.",
    relatedSkills: ["leadership"],
    detailsToAdd:
      "Year; which school; what the Safety Ambassador role involved day to day; anything you started or changed.",
  },
  {
    id: "student-led-conference",
    title: "Student-Led Conference I & II",
    category: "leadership",
    type: "conference",
    importance: "archive",
    summary: "Took part in both the first and second Student-Led Conference.",
    description:
      "As the name says, the Student-Led Conference is led by students rather than adults. I was part of both editions, I and II.",
    learning:
      "Doing it twice taught me that leading is something you build through repetition. The second time, I had a much better sense of what to prepare and how to carry myself.",
    whyItMattered: "It gave me repeated practice at taking the lead in a formal setting.",
    relatedSkills: ["leadership", "public-communication"],
    detailsToAdd:
      "Year of each edition; what the conference was about; your role (organiser, speaker, host…).",
  },
];
