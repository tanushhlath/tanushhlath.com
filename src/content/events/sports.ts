import type { WorkEvent } from "@/types/content";

/**
 * EQUESTRIAN, SPORTS & ATHLETICS
 *
 * Horse riding first and foremost (the five equestrian records below link
 * to each other through `relatedEvents`), plus inter-house sports,
 * athletics and the crew roles I've taken on at sports events. Medal
 * results also appear in the Recognized lens under "Equestrian / Sports".
 *
 * `inter-house-horse-riding` is THE horse-riding page: the Horse Riding
 * interest on /me/ and the Easter egg both link to /work/inter-house-horse-riding/.
 * Its three videos are jumping PRACTICE footage, never competition footage;
 * keep the caption that says so.
 *
 * Newest first; records without a known year sit at the end and appear
 * under "Along the way". Photos and videos are auto-discovered from
 * `public/media/events/<id>/`; a `media` block here only picks the cover,
 * order, alt text, captions or layout.
 */
export const sportsEvents: WorkEvent[] = [
  {
    id: "janak-equestrian",
    title: "Janak Equestrian Show",
    year: 2025,
    category: "sports",
    type: "competition",
    importance: "featured",
    summary: "Won four Gold Medals in competitive equestrian events at the Janak Equestrian Show.",
    description:
      "A competitive equestrian tournament, with riders competing across several events. It's where my riding came together most clearly: four Gold Medals from a single show.",
    role: "Rider",
    actions: ["Competed in multiple equestrian events at the show.", "Won four Gold Medals."],
    learning:
      "Every event is a fresh chance to get it wrong. The show taught me to reset between rounds: to let one ride go, good or bad, and bring the same focus and control to the next one.",
    whyItMattered:
      "It represents a long-standing commitment to horse riding. The medals matter, but what they really reflect is years of time in the arena: practice, patience and a lot of quiet repetition that nobody sees on competition day.",
    recognition: {
      result: "4 Gold Medals",
      detail: "Across competitive equestrian events",
      category: "sports",
      level: "major",
    },
    relatedEvents: [
      "inter-house-horse-riding",
      "inter-school-horse-riding",
      "harmony-equestrian",
      "sports-day-horse-riding-show",
    ],
    media: {
      cover: "2.png",
      layout: "split",
      images: [
        { file: "2.png", alt: "Riding a round in the arena at the Janak Equestrian Show", focus: "40% 55%" },
        { file: "1.png", alt: "The four gold medals from the Janak Equestrian Show" },
      ],
    },
    detailsToAdd:
      "Venue or city; the four events you won gold in; your horse's name, if you'd like to include it.",
  },
  {
    id: "inter-school-horse-riding",
    title: "Inter-School Horse Riding Competitions",
    year: 2024,
    category: "sports",
    type: "competition",
    importance: "significant",
    summary:
      "Represented my school in inter-school equestrian competitions, winning 3 medals and receiving certificates.",
    description:
      "Inter-school competitions bring riders from different schools together, so I was no longer riding for my house but for my school. I represented my school in equestrian competitions and continued competing across school and external events.",
    role: "Equestrian competitor representing my school",
    actions: [
      "Represented my school in inter-school equestrian competitions.",
      "Won 3 medals and received certificates.",
      "Continued competing across school and external events.",
    ],
    learning:
      "Riding for your school adds a different kind of pressure, because you're not only competing for yourself. It taught me to treat consistency as the real goal: good results come from riding well round after round, not from one lucky moment.",
    whyItMattered:
      "It showed consistency in competitive sport, and it gave me the experience of representing my school, not just my house, in a sport I've cared about for a long time.",
    recognition: {
      result: "3 Medals",
      detail: "Plus certificates, representing my school",
      category: "sports",
      level: "major",
    },
    relatedEvents: [
      "inter-house-horse-riding",
      "janak-equestrian",
      "harmony-equestrian",
      "sports-day-horse-riding-show",
    ],
    media: {
      cover: "3.png",
      layout: "split",
      images: [
        { file: "3.png", alt: "Group photo at the inter-school horse-riding competition", focus: "50% 35%" },
        { file: "2.png", alt: "Medals and a certificate from the inter-school horse-riding competition" },
        { file: "1.png", alt: "Certificate from the inter-school horse-riding competition" },
      ],
    },
    // Replaces the retired aggregate "Equestrian Competition" record.
    aliases: ["equestrian"],
    detailsToAdd: "Which events the 3 medals came from and their colours; the host school(s).",
  },
  {
    id: "harmony-equestrian",
    title: "Harmony Equestrian Show",
    year: 2024,
    category: "sports",
    type: "competition",
    importance: "archive",
    summary: "Rode in the Harmony Equestrian Show, a prestigious equestrian competition and showcase.",
    description:
      "Harmony is an equestrian competition and showcase, where riders both compete and present their riding in a show setting.",
    role: "Rider",
    learning:
      "Show riding asks for composure as much as skill: staying calm in an unfamiliar arena, with people watching, and riding the plan you practised.",
    whyItMattered:
      "It kept me testing myself in new settings, which is a big part of how I keep improving as a rider.",
    relatedEvents: [
      "inter-house-horse-riding",
      "inter-school-horse-riding",
      "janak-equestrian",
      "sports-day-horse-riding-show",
    ],
    media: {
      cover: "2.png",
      layout: "hero",
      images: [{ file: "2.png", alt: "Riding in the arena at the Harmony Equestrian Show" }],
    },
    detailsToAdd:
      "Confirm the year: the selection letter (1.png) mentions August 2025, while this record says 2024. The selection letter was moved to private-media/withheld/harmony-equestrian/1.png (not published) because it shows a teacher's mobile number; crop that out and put it back in public/media/events/harmony-equestrian/ to show it. Also: the events you rode in and any result.",
  },
  {
    id: "sports-day-horse-riding-show",
    title: "Sports Day – Horse Riding Show",
    year: 2024,
    dateLabel: "2023 & 2024",
    category: "sports",
    type: "event",
    importance: "archive",
    summary: "Part of the horse-riding show at Sports Day in both 2023 and 2024.",
    description:
      "A horse-riding show held as part of the school's Sports Day, putting riding in front of the wider school community.",
    learning:
      "Riding in front of classmates and teachers is a different kind of pressure from competition. It taught me to stay composed and ride cleanly when the people watching are people I know.",
    whyItMattered: "It let me share something I care about with my school, two years running.",
    relatedEvents: [
      "inter-house-horse-riding",
      "inter-school-horse-riding",
      "janak-equestrian",
      "harmony-equestrian",
    ],
    detailsToAdd:
      "Whether the show was a display or a competition; what you rode in each year; any result.",
  },
  {
    id: "inter-house-horse-riding",
    title: "Inter-House Horse Riding Competitions",
    year: 2023,
    category: "sports",
    type: "competition",
    importance: "featured",
    summary:
      "Participated in school-level equestrian competitions, achieving 5 different positions and receiving multiple certificates.",
    description:
      "Inter-house horse riding is school-level equestrian competition: riders compete for their houses across a range of events. It's where the hours I spend in the arena get put to the test, and it's the part of school sport that sits closest to who I am outside the classroom.",
    role: "Rider",
    actions: [
      "Competed for my house in school-level horse-riding competitions.",
      "Achieved 5 different positions across the competitions.",
      "Received multiple certificates.",
      "Kept training in between; the jumping practice clips on this page come from that training.",
    ],
    learning:
      "Riding teaches patience in a way almost nothing else does. You can't force a horse, so you learn to stay calm, feel what's happening underneath you and correct things quietly. Competing showed me that most of the result is decided in practice, long before the day itself.",
    whyItMattered:
      "Competing for my house turned a long-standing personal passion into something I could measure myself against, and it's the thread that connects every equestrian event on this site.",
    recognition: {
      result: "5 Positions",
      detail: "Plus multiple certificates across school-level competitions",
      category: "sports",
      level: "minor",
    },
    relatedEvents: [
      "janak-equestrian",
      "inter-school-horse-riding",
      "harmony-equestrian",
      "sports-day-horse-riding-show",
      "other-sports-inter-house",
    ],
    media: {
      cover: "4.png",
      layout: "stage",
      images: [{ file: "4.png", alt: "Certificates from my inter-house horse-riding competitions" }],
      // 1.mp4–3.mp4 are training clips, not footage of the competition.
      videoCaption: "Jumping practice footage from my horse-riding training — not the competition itself.",
    },
    detailsToAdd:
      "Confirm the year: the certificates in 4.png appear to be dated March 2024, while this record says 2023 (if it spans both, add a dateLabel). The events you placed in and the position in each.",
  },
  {
    id: "other-sports-inter-house",
    title: "Other Sports Inter-House – Cricket, Football & Gymnastics",
    seoTitle: "Inter-House Cricket, Football & Gymnastics",
    year: 2021,
    dateLabel: "MYP 1 & 2",
    category: "sports",
    type: "competition",
    importance: "significant",
    summary:
      "Represented my house in Cricket, Football and Gymnastics as an active participant in inter-house sports.",
    description:
      "Inter-house sport across three very different disciplines during MYP 1 and 2: the team games of cricket and football, and the individual control of gymnastics.",
    role: "Represented my house",
    actions: [
      "Represented my house in Cricket, Football and Gymnastics.",
      "Took part actively in inter-house sports across MYP 1 and 2.",
    ],
    learning:
      "Playing three sports side by side taught me that being part of a team and being disciplined on your own are two different skills. Football and cricket needed the first, gymnastics the second, and house competitions needed both.",
    whyItMattered:
      "These years built the habit of turning up for my house and competing, and gave me a wide base across team and individual sport.",
    relatedEvents: ["inter-house-horse-riding"],
    media: {
      cover: "1.png",
      layout: "filmstrip",
    },
    detailsToAdd: "Which house you represented; any positions or results.",
  },
  {
    id: "isso-basketball-crew",
    title: "ISSO Basketball Crew",
    category: "sports",
    type: "role",
    importance: "archive",
    summary: "Worked on the crew for an ISSO basketball event, on the organising side rather than the court.",
    description:
      "ISSO runs sports competitions between schools. As part of the crew for its basketball event, my job was helping the event run rather than playing in it.",
    role: "Crew",
    learning:
      "Crew work showed me how much has to go right off the court for a match to run smoothly, and that the people keeping an event on schedule rarely get noticed when they do it well.",
    whyItMattered:
      "It was event operations in a sports setting: the same behind-the-scenes work I've done as crew at school events, applied to a basketball competition.",
    relatedEvents: ["racket-league-crew", "pbl-emcee"],
    detailsToAdd: "Year; what the crew handled (scoring, logistics, announcements…).",
  },
  {
    id: "racket-league-crew",
    title: "Racket League Crew",
    category: "sports",
    type: "role",
    importance: "archive",
    summary: "Part of the crew for the Racket League, supporting the competition from behind the scenes.",
    description: "The Racket League is a racket-sports competition, and I was part of the crew that helped it run.",
    role: "Crew",
    learning:
      "Supporting a league showed me how much organisation sits behind any competition: schedules, matches and people all have to line up before players can simply turn up and play.",
    whyItMattered:
      "Together with the ISSO basketball crew, it gave me hands-on experience of running sports events, not just taking part in them.",
    relatedEvents: ["isso-basketball-crew", "pbl-emcee"],
    detailsToAdd: "Year; which racket sports; what you handled as crew.",
  },
  {
    id: "athletics-meet",
    title: "Athletics Meet",
    category: "sports",
    type: "competition",
    importance: "archive",
    summary: "Competed at the Athletics Meet, the track-and-field side of school sport.",
    description: "A track-and-field meet where students compete across running, jumping and throwing events.",
    learning:
      "Athletics is refreshingly simple: it's you against the clock or the tape measure. It taught me to focus on improving my own effort rather than watching everyone else's.",
    relatedEvents: ["jogathon"],
    detailsToAdd: "Year; the events you took part in; any result.",
  },
  {
    id: "jogathon",
    title: "Jogathon",
    category: "sports",
    type: "event",
    importance: "archive",
    summary: "Ran in the Jogathon, where finishing matters more than finishing first.",
    description:
      "A run built around endurance and participation rather than winning: everyone runs, and getting to the end is the goal.",
    learning:
      "Longer runs are mostly a mental exercise: pacing yourself, not starting too fast, and finishing what you set out to do.",
    relatedEvents: ["athletics-meet", "skip-a-thon"],
    detailsToAdd: "Year; the distance; whether it raised money for a cause.",
  },
];
